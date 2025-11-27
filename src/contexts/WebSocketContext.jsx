import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const listenersRef = useRef(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const baseApiUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:5000/api/v1';
    const SOCKET_URL = baseApiUrl.replace(/\/api\/v1\/?$/, '');

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      reconnectAttemptsRef.current += 1;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setError('Failed to connect to server. Please refresh the page.');
      }
    });

    newSocket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(err.message || 'WebSocket error occurred');
    });

    // Restore event listeners
    listenersRef.current.forEach((callback, event) => {
      newSocket.on(event, callback);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (!socket) {
      console.warn('Socket not connected. Event listener will be added when connected.');
      listenersRef.current.set(event, callback);
      return;
    }

    socket.on(event, callback);
    listenersRef.current.set(event, callback);

    // Return unsubscribe function
    return () => {
      if (socket) {
        socket.off(event, callback);
      }
      listenersRef.current.delete(event);
    };
  }, [socket]);

  // Unsubscribe from an event
  const unsubscribe = useCallback((event, callback) => {
    if (socket && callback) {
      socket.off(event, callback);
    }
    listenersRef.current.delete(event);
  }, [socket]);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (!socket || !connected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    socket.emit(event, data);
  }, [socket, connected]);

  // Subscribe to circuit queue updates
  const subscribeToCircuitQueue = useCallback((callback) => {
    return subscribe('queue:updated', callback);
  }, [subscribe]);

  // Subscribe to booking status updates
  const subscribeToBookingStatus = useCallback((callback) => {
    return subscribe('booking:status', callback);
  }, [subscribe]);

  // Subscribe to childcare notifications
  const subscribeToChildcareCheckin = useCallback((callback) => {
    return subscribe('childcare:checkin', callback);
  }, [subscribe]);

  const subscribeToChildcareCheckout = useCallback((callback) => {
    return subscribe('childcare:checkout', callback);
  }, [subscribe]);

  // Subscribe to kiosk status updates
  const subscribeToKioskStatus = useCallback((callback) => {
    return subscribe('kiosk:status', callback);
  }, [subscribe]);

  // Subscribe to inventory alerts
  const subscribeToInventoryLowStock = useCallback((callback) => {
    return subscribe('inventory:low_stock', callback);
  }, [subscribe]);

  // Subscribe to voucher expiry alerts
  const subscribeToVoucherExpiring = useCallback((callback) => {
    return subscribe('voucher:expiring', callback);
  }, [subscribe]);

  // Subscribe to settlement notifications
  const subscribeToSettlementGenerated = useCallback((callback) => {
    return subscribe('settlement:generated', callback);
  }, [subscribe]);

  // Join a room (for business unit specific updates)
  const joinRoom = useCallback((room) => {
    if (!socket || !connected) {
      console.warn('Socket not connected. Cannot join room:', room);
      return;
    }

    socket.emit('join:room', { room });
  }, [socket, connected]);

  // Leave a room
  const leaveRoom = useCallback((room) => {
    if (!socket || !connected) {
      console.warn('Socket not connected. Cannot leave room:', room);
      return;
    }

    socket.emit('leave:room', { room });
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    error,
    subscribe,
    unsubscribe,
    emit,
    // Convenience methods
    subscribeToCircuitQueue,
    subscribeToBookingStatus,
    subscribeToChildcareCheckin,
    subscribeToChildcareCheckout,
    subscribeToKioskStatus,
    subscribeToInventoryLowStock,
    subscribeToVoucherExpiring,
    subscribeToSettlementGenerated,
    joinRoom,
    leaveRoom
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
