import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

let socket: Socket | null = null;

/**
 * Get or create a singleton Socket.io connection.
 * Authenticates using the JWT token from localStorage.
 */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (socket?.connected) return socket;

  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket) {
    // Update token and reconnect
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

/**
 * Disconnect and clean up the socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
