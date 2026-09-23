import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { env } from './env';

const BALL_EVENTS_TOPIC = 'ssl.scoring.ball-events';

/**
 * Envelope published to `ssl.scoring.ball-events`.
 *
 * Two consumers depend on this topic:
 *  - ai-commentary-service reads the raw ball fields (top-level spread below
 *    matches its `BallEvent` interface: matchId, tenantId, inning, over, ball,
 *    runs, extras, wicket, batsmanId, bowlerId, timestamp).
 *  - notification-service reads `event.type` + `event.data` (SIX_HIT /
 *    FOUR_HIT) for boundary alerts.
 */
export interface ScoringBallEventPayload {
  type: 'BALL_RECORDED' | 'SIX_HIT' | 'FOUR_HIT' | 'WICKET';
  data: Record<string, unknown>;

  eventId: string;
  matchId: string;
  tenantId: string;
  inning: number;
  over: number;
  ball: number;
  runs: number;
  extras?: { type: string; runs: number };
  wicket?: { type: string; playerOut: string; dismissedBy?: string };
  batsmanId: string;
  bowlerId: string;
  batsmanName?: string;
  bowlerName?: string;
  sequenceNumber: number;
  timestamp: string;
}

@Injectable()
export class KafkaScoringPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaScoringPublisher.name);
  private readonly producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'scoring-service-producer',
      brokers: env.KAFKA_BROKERS.split(','),
    });
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      maxInFlightRequests: 1,
      retry: { retries: 5 },
    });
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      // kafkajs re-attempts connection on the next send(); log so the outage
      // surface is visible while still degrading gracefully.
      this.logger.warn(
        `Kafka producer connect failed (will retry on next publish): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.producer.disconnect();
    } catch {
      // ignore shutdown errors
    }
  }

  async publishBallEvent(event: ScoringBallEventPayload): Promise<void> {
    try {
      await this.producer.send({
        topic: BALL_EVENTS_TOPIC,
        messages: [
          {
            // Partition by match id to preserve in-order delivery per match.
            key: event.matchId,
            value: JSON.stringify(event),
            headers: {
              'content-type': 'application/json',
              'idempotency-key': event.eventId,
            },
          },
        ],
      });
    } catch (err) {
      this.logger.warn(
        `Failed to publish ball event ${event.eventId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}