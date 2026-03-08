// WebSocket hook for real-time data communication
import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  clientId: string | null;
}

export interface UseWebSocketOptions {
  onConnect?: (clientId: string) => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    clientId: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    console.log('=== WebSocket URL Construction Debug ===');
    console.log('window.location:', window.location);
    console.log('window.location.protocol:', window.location.protocol);
    console.log('window.location.host:', window.location.host);
    console.log('window.location.hostname:', window.location.hostname);
    console.log('window.location.port:', window.location.port);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    
    console.log('Initial host value:', host);
    console.log('Host type:', typeof host);
    console.log('Host === undefined:', host === 'undefined');
    console.log('Host === "undefined":', host === 'undefined');
    
    // More robust fallback for development environments
    if (!host || host === 'undefined' || host.trim() === '') {
      // Default to localhost:5000 for development
      host = 'localhost:5000';
      console.log('WebSocket: Using fallback host:', host);
    }
    
    const wsUrl = `${protocol}//${host}/ws`;
    console.log('Final WebSocket URL:', wsUrl);
    console.log('=== End WebSocket URL Construction Debug ===');
    return wsUrl;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    console.log('=== WebSocket Connection Attempt ===');
    console.log('Current WebSocket state:', wsRef.current?.readyState);
    console.log('Connection timestamp:', new Date().toISOString());
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping connection');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = getWebSocketUrl();
      
      // Validate URL before creating WebSocket
      if (!wsUrl || wsUrl.includes('undefined') || wsUrl.includes('null')) {
        console.error('Invalid WebSocket URL detected:', wsUrl);
        throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
      }
      
      console.log('WebSocket: Attempting connection to:', wsUrl);
      console.log('Creating new WebSocket instance...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
        reconnectAttempts.current = 0;
        onConnect?.(state.clientId || '');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          setState(prev => ({ ...prev, lastMessage: message }));

          // Handle specific message types
          switch (message.type) {
            case 'connection':
              setState(prev => ({ ...prev, clientId: message.data.clientId }));
              break;
            case 'authenticated':
              console.log('WebSocket authenticated:', message.data);
              break;
            case 'pong':
              // Heartbeat response
              break;
            default:
              onMessage?.(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          clientId: null,
        }));
        onDisconnect?.();

        // Auto-reconnect if enabled and not a normal closure
        if (autoReconnect && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false,
        }));
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false,
      }));
    }
  }, [getWebSocketUrl, onConnect, onDisconnect, onMessage, onError, autoReconnect, reconnectInterval, maxReconnectAttempts, state.clientId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      clientId: null,
    }));
  }, []);

  // Send message to WebSocket
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(fullMessage));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }, []);

  // Authenticate with WebSocket
  const authenticate = useCallback((userId: string) => {
    return sendMessage({
      type: 'authenticate',
      data: { userId },
    });
  }, [sendMessage]);

  // Send ping for heartbeat
  const ping = useCallback(() => {
    return sendMessage({
      type: 'ping',
      data: {},
    });
  }, [sendMessage]);

  // Setup heartbeat
  useEffect(() => {
    if (state.isConnected) {
      const interval = setInterval(() => {
        ping();
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.isConnected, ping]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    authenticate,
    ping,
  };
};

export default useWebSocket;
