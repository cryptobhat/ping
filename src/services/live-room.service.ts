/**
 * Live Room Service — in-memory store for active live reading rooms.
 * Supports multi-speaker (Clubhouse-style) with hand-raise workflow.
 * Max speakers: 20 (host + 19 guests).
 */

export interface Speaker {
  userId: string;
  userName: string;
  userImage?: string;
  isMuted: boolean;
  joinedAt: Date;
}

export interface HandRaiseRequest {
  userId: string;
  userName: string;
  userImage?: string;
  requestedAt: Date;
}

export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostImage?: string;
  title: string;
  contentId?: string;
  contentTitle?: string;
  listenerCount: number;
  speakers: Speaker[];
  pendingRequests: HandRaiseRequest[];
  startedAt: Date;
  isActive: boolean;
}

const MAX_SPEAKERS = 20; // host + 19 guests

// In-memory store — rooms are ephemeral, no DB persistence needed
const activeRooms = new Map<string, LiveRoom>();

// Track which socket is in which room (socketId -> roomId)
const socketRoomMap = new Map<string, string>();

// Track host socket per room (roomId -> socketId)
const roomHostSocket = new Map<string, string>();

// Track speaker sockets (roomId -> Map<userId, socketId>)
const roomSpeakerSockets = new Map<string, Map<string, string>>();

// Track userId per socketId (socketId -> userId)
const socketUserMap = new Map<string, string>();

export class LiveRoomService {
  static createRoom(
    hostId: string,
    hostName: string,
    hostImage: string | undefined,
    title: string,
    contentId?: string,
    contentTitle?: string
  ): LiveRoom {
    // Prevent same host from having multiple active rooms
    for (const room of activeRooms.values()) {
      if (room.hostId === hostId && room.isActive) {
        return room; // Return existing room
      }
    }

    const room: LiveRoom = {
      id: `room_${Date.now()}_${hostId}`,
      hostId,
      hostName,
      hostImage,
      title,
      contentId,
      contentTitle,
      listenerCount: 0,
      speakers: [
        {
          userId: hostId,
          userName: hostName,
          userImage: hostImage,
          isMuted: false,
          joinedAt: new Date(),
        },
      ],
      pendingRequests: [],
      startedAt: new Date(),
      isActive: true,
    };
    activeRooms.set(room.id, room);
    roomSpeakerSockets.set(room.id, new Map());
    return room;
  }

  static getRoom(roomId: string): LiveRoom | undefined {
    return activeRooms.get(roomId);
  }

  static getActiveRooms(): LiveRoom[] {
    return Array.from(activeRooms.values()).filter((r) => r.isActive);
  }

  static joinRoom(roomId: string, socketId: string, userId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room || !room.isActive) return false;
    room.listenerCount++;
    socketRoomMap.set(socketId, roomId);
    socketUserMap.set(socketId, userId);
    return true;
  }

  static leaveRoom(roomId: string, socketId: string): void {
    const room = activeRooms.get(roomId);
    const userId = socketUserMap.get(socketId);
    if (room) {
      room.listenerCount = Math.max(0, room.listenerCount - 1);
      // Remove from speakers if they were a speaker (not host)
      if (userId && userId !== room.hostId) {
        room.speakers = room.speakers.filter((s) => s.userId !== userId);
        roomSpeakerSockets.get(roomId)?.delete(userId);
      }
      // Remove pending hand raise
      if (userId) {
        room.pendingRequests = room.pendingRequests.filter((r) => r.userId !== userId);
      }
    }
    socketRoomMap.delete(socketId);
    socketUserMap.delete(socketId);
  }

  static endRoom(roomId: string, hostId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room || room.hostId !== hostId) return false;
    room.isActive = false;
    activeRooms.delete(roomId);
    roomHostSocket.delete(roomId);
    roomSpeakerSockets.delete(roomId);
    return true;
  }

  static setHostSocket(roomId: string, socketId: string): void {
    roomHostSocket.set(roomId, socketId);
  }

  static getHostSocket(roomId: string): string | undefined {
    return roomHostSocket.get(roomId);
  }

  static setSpeakerSocket(roomId: string, userId: string, socketId: string): void {
    if (!roomSpeakerSockets.has(roomId)) {
      roomSpeakerSockets.set(roomId, new Map());
    }
    roomSpeakerSockets.get(roomId)!.set(userId, socketId);
  }

  static getSpeakerSocket(roomId: string, userId: string): string | undefined {
    return roomSpeakerSockets.get(roomId)?.get(userId);
  }

  static getRoomBySocket(socketId: string): string | undefined {
    return socketRoomMap.get(socketId);
  }

  static getUserBySocket(socketId: string): string | undefined {
    return socketUserMap.get(socketId);
  }

  static setSocketUser(socketId: string, userId: string): void {
    socketUserMap.set(socketId, userId);
  }

  // --- Multi-speaker methods ---

  static raiseHand(
    roomId: string,
    userId: string,
    userName: string,
    userImage?: string
  ): boolean {
    const room = activeRooms.get(roomId);
    if (!room || !room.isActive) return false;
    // Already a speaker
    if (room.speakers.some((s) => s.userId === userId)) return false;
    // Already requested
    if (room.pendingRequests.some((r) => r.userId === userId)) return false;

    room.pendingRequests.push({
      userId,
      userName,
      userImage,
      requestedAt: new Date(),
    });
    return true;
  }

  static approveSpeaker(roomId: string, hostId: string, userId: string): Speaker | null {
    const room = activeRooms.get(roomId);
    if (!room || room.hostId !== hostId) return null;
    if (room.speakers.length >= MAX_SPEAKERS) return null;

    // Find the request
    const request = room.pendingRequests.find((r) => r.userId === userId);
    if (!request) return null;

    // Remove from pending
    room.pendingRequests = room.pendingRequests.filter((r) => r.userId !== userId);

    // Add as speaker
    const speaker: Speaker = {
      userId: request.userId,
      userName: request.userName,
      userImage: request.userImage,
      isMuted: false,
      joinedAt: new Date(),
    };
    room.speakers.push(speaker);
    return speaker;
  }

  static removeSpeaker(roomId: string, hostId: string, userId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room || room.hostId !== hostId) return false;
    if (userId === hostId) return false; // Cannot remove host

    const before = room.speakers.length;
    room.speakers = room.speakers.filter((s) => s.userId !== userId);
    roomSpeakerSockets.get(roomId)?.delete(userId);
    return room.speakers.length < before;
  }

  static muteSpeaker(roomId: string, hostId: string, userId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room || room.hostId !== hostId) return false;

    const speaker = room.speakers.find((s) => s.userId === userId);
    if (!speaker) return false;
    speaker.isMuted = true;
    return true;
  }

  static isSpeaker(roomId: string, userId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room) return false;
    return room.speakers.some((s) => s.userId === userId);
  }

  static denyHandRaise(roomId: string, hostId: string, userId: string): boolean {
    const room = activeRooms.get(roomId);
    if (!room || room.hostId !== hostId) return false;
    const before = room.pendingRequests.length;
    room.pendingRequests = room.pendingRequests.filter((r) => r.userId !== userId);
    return room.pendingRequests.length < before;
  }

  static handleDisconnect(socketId: string): { roomId: string; wasHost: boolean; userId?: string } | null {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return null;

    const room = activeRooms.get(roomId);
    const userId = socketUserMap.get(socketId);
    if (!room) {
      socketRoomMap.delete(socketId);
      socketUserMap.delete(socketId);
      return null;
    }

    const hostSocketId = roomHostSocket.get(roomId);
    const wasHost = hostSocketId === socketId;

    if (wasHost) {
      // Host disconnected — end the room
      room.isActive = false;
      activeRooms.delete(roomId);
      roomHostSocket.delete(roomId);
      roomSpeakerSockets.delete(roomId);
    } else {
      // Listener/speaker disconnected
      room.listenerCount = Math.max(0, room.listenerCount - 1);
      // Remove from speakers if applicable
      if (userId) {
        room.speakers = room.speakers.filter((s) => s.userId !== userId);
        room.pendingRequests = room.pendingRequests.filter((r) => r.userId !== userId);
        roomSpeakerSockets.get(roomId)?.delete(userId);
      }
    }

    socketRoomMap.delete(socketId);
    socketUserMap.delete(socketId);
    return { roomId, wasHost, userId };
  }
}
