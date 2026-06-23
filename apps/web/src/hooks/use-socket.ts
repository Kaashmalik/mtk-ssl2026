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
    const ballAddedHandler = (data: unknown) => onMessageRef.current?.("ball-added", data);
    const ballRemovedHandler = (data: unknown) => onMessageRef.current?.("ball-removed", data);
    const matchStateHandler = (data: unknown) => onMessageRef.current?.("match-state", data);
    const matchStateUpdatedHandler = (data: unknown) => onMessageRef.current?.("match-state-updated", data);

    socket.on("message", messageHandler);
    socket.on("ball-added", ballAddedHandler);
    socket.on("ball-removed", ballRemovedHandler);
    socket.on("match-state", matchStateHandler);
    socket.on("match-state-updated", matchStateUpdatedHandler);

    return () => {
      socket.off("message", messageHandler);
      socket.off("ball-added", ballAddedHandler);
      socket.off("ball-removed", ballRemovedHandler);
      socket.off("match-state", matchStateHandler);
      socket.off("match-state-updated", matchStateUpdatedHandler);
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
