import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEvent {
  type: 'generation_started' | 'agent_started' | 'agent_completed' | 'generation_completed' | 'generation_failed' | 'connection_established';
  data: any;
  timestamp: string;
}

interface UseEnhancedWebSocketOptions {
  onGenerationStarted?: (data: any) => void;
  onAgentStarted?: (data: any) => void;
  onAgentCompleted?: (data: any) => void;
  onGenerationCompleted?: (data: any) => void;
  onGenerationFailed?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useEnhancedWebSocket(options: UseEnhancedWebSocketOptions = {}) {
  const {
    onGenerationStarted,
    onAgentStarted,
    onAgentCompleted,
    onGenerationCompleted,
    onGenerationFailed,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const socket = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (socket.current?.connected) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Create Socket.IO connection
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';
    
    console.log('Connecting to Socket.IO server:', serverUrl);
    
    socket.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection established
    socket.current.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setConnectionStatus('connected');
      optionsRef.current.onConnect?.();
    });

    // Connection confirmation from server
    socket.current.on('connection_established', (data) => {
      console.log('Connection confirmed by server:', data);
      setClientId(data.clientId);
      setLastEvent({
        type: 'connection_established',
        data,
        timestamp: data.timestamp
      });
    });

    // Generation events
    socket.current.on('generation_started', (event: SocketEvent) => {
      console.log('Generation started:', event.data);
      setLastEvent(event);
      optionsRef.current.onGenerationStarted?.(event.data);
    });

    socket.current.on('agent_started', (event: SocketEvent) => {
      console.log('Agent started:', event.data);
      setLastEvent(event);
      optionsRef.current.onAgentStarted?.(event.data);
    });

    socket.current.on('agent_completed', (event: SocketEvent) => {
      console.log('Agent completed:', event.data);
      setLastEvent(event);
      optionsRef.current.onAgentCompleted?.(event.data);
    });

    socket.current.on('generation_completed', (event: SocketEvent) => {
      console.log('Generation completed:', event.data);
      setLastEvent(event);
      optionsRef.current.onGenerationCompleted?.(event.data);
    });

    socket.current.on('generation_failed', (event: SocketEvent) => {
      console.log('Generation failed:', event.data);
      setLastEvent(event);
      optionsRef.current.onGenerationFailed?.(event.data);
    });

    // Connection events
    socket.current.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setConnectionStatus('disconnected');
      optionsRef.current.onDisconnect?.();
    });

    socket.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnectionStatus('error');
      optionsRef.current.onError?.(error);
    });

    // Pong response
    socket.current.on('pong', (data) => {
      console.log('Pong received:', data);
    });

  }, []);

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
    setConnectionStatus('disconnected');
    setClientId(null);
  }, []);

  const sendPing = useCallback(() => {
    if (socket.current?.connected) {
      socket.current.emit('ping');
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socket.current?.connected) {
      socket.current.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected. Event not sent:', event, data);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [connect]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (connectionStatus === 'connected') {
        sendPing();
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [connectionStatus, sendPing]);

  return {
    connectionStatus,
    lastEvent,
    clientId,
    connect,
    disconnect,
    emit,
    sendPing,
    isConnected: connectionStatus === 'connected'
  };
}

