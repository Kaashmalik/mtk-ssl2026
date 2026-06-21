"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/lib/socket-client";

interface SocketOptions {
  room?: string;
  onMessage?: (event: string, data: unknown) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  sendMessage: (event: string, data: unknown) => void;
  socket: Socket | null;
}

export function useSocket({ room, onMessage }: SocketOptions = {}): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated with latest reference
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!room) return;

    const socket = getSocket(room);
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial state in case already connected
    setIsConnected(socket.connected);

    const messageHandler = (data: unknown) => onMessageRef.current?.("message", data);
    const matchUpdateHandler = (data: unknown) => onMessageRef.current?.("match-update", data);
    const ballRecordedHandler = (data: unknown) => onMessageRef.current?.("ball-recorded", data);
    const scoreUpdateHandler = (data: unknown) => onMessageRef.current?.("score-update", data);

    socket.on("message", messageHandler);
    socket.on("match-update", matchUpdateHandler);
    socket.on("ball-recorded", ballRecordedHandler);
    socket.on("score-update", scoreUpdateHandler);

    return () => {
      socket.off("message", messageHandler);
      socket.off("match-update", matchUpdateHandler);
      socket.off("ball-recorded", ballRecordedHandler);
      socket.off("score-update", scoreUpdateHandler);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      disconnectSocket();
    };
  }, [room]);

  const sendMessage = (event: string, data: unknown) => {
    if (socketRef.current && isConnected) {
      const payload =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : { value: data };
      socketRef.current.emit(event, { room, ...payload });
    }
  };

  return { isConnected, sendMessage, socket: socketRef.current };
}
