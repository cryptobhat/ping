import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socket';
import { ChatService } from '../services/chat.service';

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId;

  /**
   * Join a conversation room.
   * Client emits: 'join_conversation' { conversationId: string }
   * Server emits: 'joined_conversation' { conversationId } on success
   * Server emits: 'error' { message } on failure
   */
  socket.on('join_conversation', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        socket.emit('error', { message: 'conversationId is required' });
        return;
      }

      // Verify the user is a participant before allowing them into the room
      const messages = await ChatService.getMessages(conversationId, userId, 1, 1);
      // If getMessages doesn't throw, the user is a valid participant

      const room = `conversation:${conversationId}`;
      socket.join(room);

      socket.emit('joined_conversation', { conversationId });
      console.log(`User ${userId} joined conversation ${conversationId}`);
    } catch (err: any) {
      socket.emit('error', { message: err.message || 'Failed to join conversation' });
    }
  });

  /**
   * Send a message in a conversation.
   * Client emits: 'send_message' { conversationId, content, messageType? }
   * Server broadcasts: 'new_message' { message } to the conversation room
   * Server emits: 'message_sent' { message } back to sender as acknowledgement
   */
  socket.on(
    'send_message',
    async (data: { conversationId: string; content: string; messageType?: string }) => {
      try {
        const { conversationId, content, messageType } = data;

        if (!conversationId || !content) {
          socket.emit('error', { message: 'conversationId and content are required' });
          return;
        }

        const message = await ChatService.sendMessage(
          conversationId,
          userId,
          content,
          messageType || 'TEXT'
        );

        const room = `conversation:${conversationId}`;

        // Broadcast to all participants in the room (including sender)
        io.to(room).emit('new_message', { message });

        // Acknowledge to sender
        socket.emit('message_sent', { message });
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
      }
    }
  );

  /**
   * Broadcast typing indicator.
   * Client emits: 'typing' { conversationId, isTyping: boolean }
   * Server broadcasts: 'user_typing' { conversationId, userId, isTyping } to other participants
   */
  socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
    const { conversationId, isTyping } = data;

    if (!conversationId) {
      return;
    }

    const room = `conversation:${conversationId}`;

    // Broadcast to everyone in the room except the sender
    socket.to(room).emit('user_typing', {
      conversationId,
      userId,
      isTyping: !!isTyping,
    });
  });

  /**
   * Mark messages as read in a conversation.
   * Client emits: 'read_messages' { conversationId }
   * Server broadcasts: 'messages_read' { conversationId, userId, readAt } to room
   */
  socket.on('read_messages', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        socket.emit('error', { message: 'conversationId is required' });
        return;
      }

      await ChatService.markAsRead(conversationId, userId);

      const room = `conversation:${conversationId}`;
      io.to(room).emit('messages_read', {
        conversationId,
        userId,
        readAt: new Date().toISOString(),
      });
    } catch (err: any) {
      socket.emit('error', { message: err.message || 'Failed to mark messages as read' });
    }
  });
}
