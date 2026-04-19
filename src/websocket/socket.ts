import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { registerChatHandlers } from './chat.handler';
import { registerLiveRoomHandlers } from './live-room.handler';
import prisma from '../config/database';

let io: Server;

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

export function initializeWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3001', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT authentication middleware with jwtVersion check
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    // Check jwtVersion to support token revocation (matches HTTP auth middleware)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { jwtVersion: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new Error('Account not found or deactivated'));
    }

    if (decoded.jwtVersion !== undefined && decoded.jwtVersion !== user.jwtVersion) {
      return next(new Error('Token has been revoked'));
    }

    (socket as AuthenticatedSocket).userId = decoded.userId;
    (socket as AuthenticatedSocket).userRole = decoded.role;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`Socket connected: ${authSocket.userId} (${authSocket.id})`);

    // Join a personal room so we can target messages to specific users
    authSocket.join(`user:${authSocket.userId}`);

    registerChatHandlers(io, authSocket);
    registerLiveRoomHandlers(io, authSocket);

    authSocket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${authSocket.userId} - ${reason}`);
    });

    authSocket.on('error', (err) => {
      console.error(`Socket error for ${authSocket.userId}:`, err.message);
    });
  });

  console.log('WebSocket server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}
