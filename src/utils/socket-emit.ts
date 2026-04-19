// Socket.IO real-time helper
import { getIO } from '../websocket/socket';
export function safeEmit(userId: string, event: string, data: any) {
  try { getIO().to(`user:${userId}`).emit(event, data); } catch(e) {}
}
