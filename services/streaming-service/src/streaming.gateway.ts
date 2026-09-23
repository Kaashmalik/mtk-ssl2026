import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { MediasoupRouterService } from './mediasoup-router.service';
import { StreamingService } from './streaming.service';
import { env } from './env';
import * as mediasoup from 'mediasoup';

interface ClientData {
  roomId: string;
  transportIds: string[];
  producerIds: string[];
}

@WebSocketGateway({
  namespace: 'streaming',
  cors: { origin: env.CORS_ORIGIN.split(','), credentials: true },
})
export class StreamingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(StreamingGateway.name);
  private clients = new Map<string, ClientData>();
  private roomClients = new Map<string, Set<string>>();

  constructor(
    private readonly mediasoup: MediasoupRouterService,
    private readonly streamingService: StreamingService,
  ) {}

  handleConnection(client: Socket) {
    if (!this.isAuthorized(client)) {
      this.logger.warn(`Rejecting unauthorized connection: ${client.id}`);
      client.emit('unauthorized', { reason: 'invalid-token' });
      client.disconnect(true);
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    await this.teardownClient(client);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() body: { matchId?: string; roomId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isAuthorized(client)) {
      client.emit('unauthorized', { reason: 'invalid-token' });
      return;
    }

    const roomId = body.matchId ? `stream-${body.matchId}` : body.roomId;
    if (!roomId) {
      client.emit('error', { message: 'roomId or matchId is required' });
      return;
    }

    try {
      await this.mediasoup.createRoom(roomId);
      client.join(roomId);

      const members = this.roomClients.get(roomId) ?? new Set<string>();
      members.add(client.id);
      this.roomClients.set(roomId, members);
      this.streamingService.updateViewerCount(roomId, 1);

      // Reset any previous room membership for this socket (defensive: a
      // socket may only ever be in one room in this gateway).
      const previous = this.clients.get(client.id);
      if (previous && previous.roomId !== roomId) {
        previous.transportIds = [];
        previous.producerIds = [];
      }

      this.clients.set(client.id, { roomId, transportIds: [], producerIds: [] });
      this.logger.log(`Client ${client.id} joined room ${roomId}`);

      const router = this.mediasoup.getRouter(roomId)!;
      client.emit('router-capabilities', { rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      this.logger.error(`Failed to join room ${roomId}: ${err}`);
      client.emit('error', { message: 'failed to join room' });
    }
  }

  @SubscribeMessage('create-transport')
  async handleCreateTransport(
    @MessageBody() body: { direction: 'send' | 'recv' },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isAuthorized(client)) return;
    const data = this.clients.get(client.id);
    if (!data) return;

    try {
      const transport = await this.mediasoup.createWebRtcTransport(data.roomId);
      data.transportIds.push(transport.id);

      client.emit('transport-created', {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      this.logger.error(`Failed to create transport for ${client.id}: ${err}`);
      client.emit('error', { message: 'failed to create transport' });
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @MessageBody() body: { transportId: string; dtlsParameters: mediasoup.types.DtlsParameters },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isAuthorized(client)) return;
    const data = this.clients.get(client.id);
    if (!data || !data.transportIds.includes(body.transportId)) {
      client.emit('error', { message: 'transport not owned' });
      return;
    }

    try {
      const room = this.mediasoup.getRoom(data.roomId);
      const transport = room?.transports.get(body.transportId);
      if (!transport) {
        client.emit('error', { message: 'transport not found' });
        return;
      }

      await transport.connect({ dtlsParameters: body.dtlsParameters });
      client.emit('transport-connected', { transportId: body.transportId });
    } catch (err) {
      this.logger.error(`Failed to connect transport for ${client.id}: ${err}`);
      client.emit('error', { message: 'failed to connect transport' });
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @MessageBody() body: { transportId: string; kind: 'audio' | 'video'; rtpParameters: mediasoup.types.RtpParameters },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isAuthorized(client)) return;
    const data = this.clients.get(client.id);
    if (!data || !data.transportIds.includes(body.transportId)) {
      client.emit('error', { message: 'transport not owned' });
      return;
    }

    try {
      const producer = await this.mediasoup.createProducer(
        data.roomId,
        body.transportId,
        body.kind,
        body.rtpParameters,
      );
      data.producerIds.push(producer.id);
      this.streamingService.updateProducerCount(data.roomId, 1);

      client.to(data.roomId).emit('new-producer', { producerId: producer.id });
      client.emit('producer-created', { producerId: producer.id });
    } catch (err) {
      this.logger.error(`Failed to produce for ${client.id}: ${err}`);
      client.emit('error', { message: 'failed to create producer' });
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @MessageBody() body: { transportId: string; producerId: string; rtpCapabilities: mediasoup.types.RtpCapabilities },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isAuthorized(client)) return;
    const data = this.clients.get(client.id);
    if (!data || !data.transportIds.includes(body.transportId)) {
      client.emit('error', { message: 'transport not owned' });
      return;
    }

    try {
      const consumer = await this.mediasoup.createConsumer(
        data.roomId,
        body.transportId,
        body.producerId,
        body.rtpCapabilities,
      );

      if (!consumer) {
        client.emit('consume-error', { error: 'Cannot consume this producer' });
        return;
      }

      await consumer.resume();
      client.emit('consumer-created', {
        id: consumer.id,
        producerId: body.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (err) {
      this.logger.error(`Failed to consume for ${client.id}: ${err}`);
      client.emit('error', { message: 'failed to create consumer' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    await this.teardownClient(client);
  }

  private isAuthorized(client: Socket): boolean {
    const expected = env.STREAMING_ACCESS_TOKEN;
    if (!expected) {
      if (env.NODE_ENV === 'production') {
        this.logger.error(
          'STREAMING_ACCESS_TOKEN is not configured in production; rejecting all streaming connections. Set it via env to enable streaming.',
        );
        return false;
      }
      this.logger.warn(
        'STREAMING_ACCESS_TOKEN is not configured; accepting streaming connection (development only).',
      );
      return true;
    }

    const presented = client.handshake.auth?.token;
    if (typeof presented !== 'string' || presented.length === 0) return false;

    const a = Buffer.from(presented);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async teardownClient(client: Socket): Promise<void> {
    const data = this.clients.get(client.id);
    if (!data) return;
    this.clients.delete(client.id);

    // 1. close this client's producers/transports and drop them from room maps
    await this.mediasoup.closeClientResources(data.roomId, data.producerIds, data.transportIds);

    // 2. leave the socket.io room and update membership tracking
    client.leave(data.roomId);

    const members = this.roomClients.get(data.roomId);
    members?.delete(client.id);
    if (members && members.size === 0) {
      this.roomClients.delete(data.roomId);
      await this.mediasoup.closeRoom(data.roomId);
      this.logger.log(`Room ${data.roomId} closed (last participant left)`);
    }

    this.logger.log(`Client ${client.id} left room ${data.roomId}`);
  }
}