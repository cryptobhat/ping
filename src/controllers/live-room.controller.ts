import { Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { LiveRoomService } from '../services/live-room.service';
import { NotificationService } from '../services/notification.service';
import prisma from '../config/database';

/**
 * POST /api/v1/live/create
 * Create a new live reading room. Requires auth.
 */
export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, contentId } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errorResponse(res, 'Title is required', 400);
      return;
    }

    // Fetch host info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, profileImage: true },
    });

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    let contentTitle: string | undefined;

    // If linked to content, verify it exists and belongs to the host
    if (contentId) {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        select: { authorId: true, title: true },
      });

      if (!content) {
        errorResponse(res, 'Content not found', 404);
        return;
      }

      if (content.authorId !== userId) {
        errorResponse(res, 'You can only read your own content live', 403);
        return;
      }

      contentTitle = content.title ?? undefined;
    }

    const room = LiveRoomService.createRoom(
      userId,
      user.name,
      user.profileImage || undefined,
      title.trim(),
      contentId,
      contentTitle
    );

    // Fire-and-forget: notify all followers that the host is live
    NotificationService.notifyFollowersLive(
      userId,
      room.id,
      title.trim()
    ).catch(() => {});

    successResponse(res, room, 'Live room created', 201);
  } catch (error: any) {
    console.error('[LiveRoom] createRoom error:', error);
    errorResponse(res, 'Failed to create live room', 500);
  }
};

/**
 * GET /api/v1/live/rooms
 * List all active live rooms. Public.
 */
export const listRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = LiveRoomService.getActiveRooms();
    successResponse(res, rooms);
  } catch (error: any) {
    console.error('[LiveRoom] listRooms error:', error);
    errorResponse(res, 'Failed to list rooms', 500);
  }
};

/**
 * GET /api/v1/live/rooms/:id
 * Get single room details. Public.
 */
export const getRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const room = LiveRoomService.getRoom(req.params.id);
    if (!room) {
      errorResponse(res, 'Room not found or has ended', 404);
      return;
    }
    successResponse(res, room);
  } catch (error: any) {
    console.error('[LiveRoom] getRoom error:', error);
    errorResponse(res, 'Failed to get room', 500);
  }
};

/**
 * POST /api/v1/live/rooms/:id/end
 * End a live room. Host only.
 */
export const endRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const roomId = req.params.id;

    const ended = LiveRoomService.endRoom(roomId, userId);
    if (!ended) {
      errorResponse(res, 'Room not found or you are not the host', 403);
      return;
    }

    successResponse(res, { roomId }, 'Room ended');
  } catch (error: any) {
    console.error('[LiveRoom] endRoom error:', error);
    errorResponse(res, 'Failed to end room', 500);
  }
};
