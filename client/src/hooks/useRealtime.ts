import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface RealtimeEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface RealtimeManager {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  onActivityUpdate: (callback: (event: RealtimeEvent) => void) => void;
  onNewActivity: (callback: (event: RealtimeEvent) => void) => void;
  onActivityRemoved: (callback: (event: RealtimeEvent) => void) => void;
  onActivityGraded: (callback: (event: RealtimeEvent) => void) => void;
  joinActivity: (activityId: string) => void;
  leaveActivity: (activityId: string) => void;
}

export function useRealtime(): RealtimeManager {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    if (socketRef.current?.connected || !user) return;

    console.log('🔌 Conectando ao sistema de tempo real...');
    
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado ao sistema de tempo real');
      setIsConnected(true);
      
      // Autenticar usuário
      socketRef.current?.emit('authenticate', {
        userId: user.id,
        role: user.role
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado do sistema de tempo real');
      setIsConnected(false);
    });

    socketRef.current.on('authenticated', (data) => {
      console.log('🔐 Autenticado no sistema de tempo real:', data);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error);
      setIsConnected(false);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const onNewActivity = (callback: (event: RealtimeEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_activity', callback);
    }
  };

  const onActivityUpdate = (callback: (event: RealtimeEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('activity_updated', callback);
    }
  };

  const onActivityRemoved = (callback: (event: RealtimeEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('activity_removed', callback);
    }
  };

  const onActivityGraded = (callback: (event: RealtimeEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('activity_graded', callback);
    }
  };

  const joinActivity = (activityId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_activity', activityId);
    }
  };

  const leaveActivity = (activityId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_activity', activityId);
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    onNewActivity,
    onActivityUpdate,
    onActivityRemoved,
    onActivityGraded,
    joinActivity,
    leaveActivity
  };
}






