import { Router } from 'express';
import * as liveRoomController from '../controllers/live-room.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Create a live room (auth required)
router.post('/create', authenticate, liveRoomController.createRoom);

// List active rooms (public, but optionalAuth for personalization)
router.get('/rooms', optionalAuth, liveRoomController.listRooms);

// Get room details (public)
router.get('/rooms/:id', optionalAuth, liveRoomController.getRoom);

// End a room (host only)
router.post('/rooms/:id/end', authenticate, liveRoomController.endRoom);

export default router;
