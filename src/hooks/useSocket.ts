'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useQueueSocket(clinicId?: string, ticketId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to current origin or env URL
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || '', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      if (clinicId) {
        socket.emit('join_clinic', { clinicId });
      }
      if (ticketId) {
        socket.emit('join_ticket', { ticketId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    return () => {
      if (clinicId) {
        socket.emit('leave_clinic', { clinicId });
      }
      if (ticketId) {
        socket.emit('leave_ticket', { ticketId });
      }
      socket.disconnect();
    };
  }, [clinicId, ticketId]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
