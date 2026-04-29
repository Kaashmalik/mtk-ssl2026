"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/lib/socket-client";

interface SocketOptions {
  room?: string;
  onMessage?: (event: string, data: any) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  socket: Socket | null;
}

export function useSocket({ room, onMessage }: SocketOptions = {}): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

    const messageHandler = (data: any) => onMessage?.("message", data);
    const matchUpdateHandler = (data: any) => onMessage?.("match-update", data);
    const ballRecordedHandler = (data: any) => onMessage?.("ball-recorded", data);
    const scoreUpdateHandler = (data: any) => onMessage?.("score-update", data);

    if (onMessage) {
      socket.on("message", messageHandler);
      socket.on("match-update", matchUpdateHandler);
      socket.on("ball-recorded", ballRecordedHandler);
      socket.on("score-update", scoreUpdateHandler);
    }

    return () => {
      if (onMessage) {
        socket.off("message", messageHandler);
        socket.off("match-update", matchUpdateHandler);
        socket.off("ball-recorded", ballRecordedHandler);
        socket.off("score-update", scoreUpdateHandler);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      disconnectSocket();
    };
  }, [room, onMessage]);

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, { room, ...data });
    }
  };

  return { isConnected, sendMessage, socket: socketRef.current };
}
