import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socket';
import { LiveRoomService } from '../services/live-room.service';

/**
 * Live Reading Room — Socket.io event handlers.
 * Supports multi-speaker (Clubhouse-style): host + up to 4 guest speakers.
 *
 * Audio flow:
 *   Any speaker captures audio via MediaRecorder (128kbps mono) ->
 *   Sends binary chunks via 'live:audio' with userId ->
 *   Server broadcasts to all in the room except the sender ->
 *   Listeners/other speakers play via AudioContext / Media Source
 */
export function registerLiveRoomHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId;

  /**
   * Host starts streaming in a room.
   * Client emits: 'live:host' { roomId }
   */
  socket.on('live:host', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) {
      socket.emit('live:error', { message: 'roomId is required' });
      return;
    }

    const room = LiveRoomService.getRoom(roomId);
    if (!room) {
      socket.emit('live:error', { message: 'Room not found' });
      return;
    }

    if (room.hostId !== userId) {
      socket.emit('live:error', { message: 'Only the host can start the room' });
      return;
    }

    // Register host socket and join the Socket.io room
    LiveRoomService.setHostSocket(roomId, socket.id);
    LiveRoomService.setSpeakerSocket(roomId, userId, socket.id);
    LiveRoomService.setSocketUser(socket.id, userId);
    socket.join(`live:${roomId}`);

    socket.emit('live:host_ready', { roomId, speakers: room.speakers });
    console.log(`[Live] Host ${userId} started streaming in ${roomId}`);
  });

  /**
   * Listener joins a live room.
   * Client emits: 'live:join' { roomId }
   */
  socket.on('live:join', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) {
      socket.emit('live:error', { message: 'roomId is required' });
      return;
    }

    const joined = LiveRoomService.joinRoom(roomId, socket.id, userId);
    if (!joined) {
      socket.emit('live:error', { message: 'Room not found or has ended' });
      return;
    }

    socket.join(`live:${roomId}`);

    const room = LiveRoomService.getRoom(roomId);
    if (room) {
      socket.emit('live:joined', {
        roomId,
        speakers: room.speakers,
        pendingRequests: room.pendingRequests,
      });
      io.to(`live:${roomId}`).emit('live:listener_count', {
        roomId,
        count: room.listenerCount,
      });
    }

    console.log(`[Live] Listener ${userId} joined ${roomId}`);
  });

  /**
   * Listener leaves a live room.
   * Client emits: 'live:leave' { roomId }
   */
  socket.on('live:leave', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    LiveRoomService.leaveRoom(roomId, socket.id);
    socket.leave(`live:${roomId}`);

    const room = LiveRoomService.getRoom(roomId);
    if (room) {
      io.to(`live:${roomId}`).emit('live:listener_count', {
        roomId,
        count: room.listenerCount,
      });
      // Broadcast updated speakers list
      io.to(`live:${roomId}`).emit('live:speakers_updated', {
        roomId,
        speakers: room.speakers,
      });
    }

    console.log(`[Live] Listener ${userId} left ${roomId}`);
  });

  /**
   * Any speaker sends audio chunk (binary data from MediaRecorder).
   * Client emits: 'live:audio' { roomId, chunk: ArrayBuffer }
   * Server broadcasts chunk to all in the room except the sender.
   */
  socket.on('live:audio', (data: { roomId: string; chunk: ArrayBuffer }) => {
    const { roomId, chunk } = data;
    if (!roomId || !chunk) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    // Only speakers (including host) can send audio
    if (!LiveRoomService.isSpeaker(roomId, userId)) return;

    // Check if this speaker is muted by host
    const speaker = room.speakers.find((s) => s.userId === userId);
    if (speaker?.isMuted) return;

    // Broadcast to all in room except the sender
    socket.to(`live:${roomId}`).emit('live:audio', {
      roomId,
      chunk,
      speakerId: userId,
    });
  });

  /**
   * Listener raises hand to request speaking access.
   * Client emits: 'live:raise-hand' { roomId, userName, userImage }
   */
  socket.on('live:raise-hand', (data: { roomId: string; userName: string; userImage?: string }) => {
    const { roomId, userName, userImage } = data;
    if (!roomId) return;

    const raised = LiveRoomService.raiseHand(roomId, userId, userName || 'Anonymous', userImage);
    if (!raised) {
      socket.emit('live:error', { message: 'Could not raise hand — you may already be a speaker or have a pending request' });
      return;
    }

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    // Notify host about the hand raise
    const hostSocketId = LiveRoomService.getHostSocket(roomId);
    if (hostSocketId) {
      io.to(hostSocketId).emit('live:hand-raised', {
        roomId,
        userId,
        userName: userName || 'Anonymous',
        userImage,
        pendingRequests: room.pendingRequests,
      });
    }

    socket.emit('live:hand-raise-ack', { roomId });
    console.log(`[Live] ${userId} raised hand in ${roomId}`);
  });

  /**
   * Host approves a hand raise — user becomes a speaker.
   * Client emits: 'live:approve-speaker' { roomId, userId }
   */
  socket.on('live:approve-speaker', (data: { roomId: string; userId: string }) => {
    const { roomId, userId: targetUserId } = data;
    if (!roomId || !targetUserId) return;

    const speaker = LiveRoomService.approveSpeaker(roomId, userId, targetUserId);
    if (!speaker) {
      socket.emit('live:error', { message: 'Could not approve speaker — room may be full (max 5)' });
      return;
    }

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    // Notify the approved user
    io.to(`user:${targetUserId}`).emit('live:speaker-approved', {
      roomId,
      speaker,
    });

    // Broadcast updated speakers and pending requests to entire room
    io.to(`live:${roomId}`).emit('live:speakers_updated', {
      roomId,
      speakers: room.speakers,
      pendingRequests: room.pendingRequests,
    });

    console.log(`[Live] Host approved ${targetUserId} as speaker in ${roomId}`);
  });

  /**
   * Host removes a speaker (moves back to listener).
   * Client emits: 'live:remove-speaker' { roomId, userId }
   */
  socket.on('live:remove-speaker', (data: { roomId: string; userId: string }) => {
    const { roomId, userId: targetUserId } = data;
    if (!roomId || !targetUserId) return;

    const removed = LiveRoomService.removeSpeaker(roomId, userId, targetUserId);
    if (!removed) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    // Notify the removed speaker
    io.to(`user:${targetUserId}`).emit('live:speaker-removed', { roomId });

    // Broadcast updated speakers
    io.to(`live:${roomId}`).emit('live:speakers_updated', {
      roomId,
      speakers: room.speakers,
    });

    console.log(`[Live] Host removed speaker ${targetUserId} in ${roomId}`);
  });

  /**
   * Host mutes a speaker.
   * Client emits: 'live:mute-speaker' { roomId, userId }
   */
  socket.on('live:mute-speaker', (data: { roomId: string; userId: string }) => {
    const { roomId, userId: targetUserId } = data;
    if (!roomId || !targetUserId) return;

    const muted = LiveRoomService.muteSpeaker(roomId, userId, targetUserId);
    if (!muted) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    // Notify the muted speaker
    io.to(`user:${targetUserId}`).emit('live:you-were-muted', { roomId });

    // Broadcast updated speakers
    io.to(`live:${roomId}`).emit('live:speakers_updated', {
      roomId,
      speakers: room.speakers,
    });

    console.log(`[Live] Host muted ${targetUserId} in ${roomId}`);
  });

  /**
   * Host denies a hand raise request.
   * Client emits: 'live:deny-hand' { roomId, userId }
   */
  socket.on('live:deny-hand', (data: { roomId: string; userId: string }) => {
    const { roomId, userId: targetUserId } = data;
    if (!roomId || !targetUserId) return;

    const denied = LiveRoomService.denyHandRaise(roomId, userId, targetUserId);
    if (!denied) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room) return;

    io.to(`user:${targetUserId}`).emit('live:hand-denied', { roomId });

    // Update host's pending list
    io.to(`live:${roomId}`).emit('live:speakers_updated', {
      roomId,
      speakers: room.speakers,
      pendingRequests: room.pendingRequests,
    });
  });

  /**
   * Speaker registers their socket for audio (after being approved).
   * Client emits: 'live:speaker-ready' { roomId }
   */
  socket.on('live:speaker-ready', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    if (LiveRoomService.isSpeaker(roomId, userId)) {
      LiveRoomService.setSpeakerSocket(roomId, userId, socket.id);
      socket.emit('live:speaker-stream-ready', { roomId });
      console.log(`[Live] Speaker ${userId} ready in ${roomId}`);
    }
  });

  /**
   * Host ends the live room.
   * Client emits: 'live:end' { roomId }
   */
  socket.on('live:end', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    const ended = LiveRoomService.endRoom(roomId, userId);
    if (ended) {
      io.to(`live:${roomId}`).emit('live:ended', { roomId });
      console.log(`[Live] Host ${userId} ended room ${roomId}`);
    }
  });

  /**
   * Listener sends a reaction emoji.
   */
  socket.on('live:reaction', (data: { roomId: string; emoji: string }) => {
    const { roomId, emoji } = data;
    if (!roomId || !emoji) return;

    const allowedEmojis = ['\u2764\uFE0F', '\uD83D\uDC4F', '\uD83D\uDD25', '\uD83D\uDE0D', '\uD83D\uDE22', '\uD83E\uDD29'];
    if (!allowedEmojis.includes(emoji)) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room || !room.isActive) return;

    io.to(`live:${roomId}`).emit('live:reaction', {
      roomId,
      emoji,
      userId,
    });
  });

  /**
   * Live chat message during a reading session.
   */
  socket.on('live:chat', (data: { roomId: string; message: string; userName: string }) => {
    const { roomId, message, userName } = data;
    if (!roomId || !message || message.trim().length === 0) return;
    if (message.length > 300) return;

    const room = LiveRoomService.getRoom(roomId);
    if (!room || !room.isActive) return;

    io.to(`live:${roomId}`).emit('live:chat', {
      roomId,
      message: message.trim(),
      userId,
      userName: userName || 'Anonymous',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Handle disconnect — clean up room membership.
   */
  socket.on('disconnect', () => {
    const result = LiveRoomService.handleDisconnect(socket.id);
    if (result) {
      if (result.wasHost) {
        io.to(`live:${result.roomId}`).emit('live:ended', {
          roomId: result.roomId,
          reason: 'host_disconnected',
        });
        console.log(`[Live] Host ${userId} disconnected, room ${result.roomId} ended`);
      } else {
        const room = LiveRoomService.getRoom(result.roomId);
        if (room) {
          io.to(`live:${result.roomId}`).emit('live:listener_count', {
            roomId: result.roomId,
            count: room.listenerCount,
          });
          // Broadcast updated speakers if a speaker disconnected
          if (result.userId) {
            io.to(`live:${result.roomId}`).emit('live:speakers_updated', {
              roomId: result.roomId,
              speakers: room.speakers,
            });
          }
        }
      }
    }
  });
}
