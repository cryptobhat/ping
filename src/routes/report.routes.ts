import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { reportSubmitLimiter } from '../middleware/rate-limit';

const router = Router();

// POST /api/v1/reports — report content (any authenticated user)
router.post('/', authenticate, reportSubmitLimiter, reportController.createReport);

// GET /api/v1/reports — list reports (admin only)
router.get('/', authenticate, authorize('ADMIN'), reportController.listReports);

// PUT /api/v1/reports/:reportId — resolve a report (admin only)
router.put('/:reportId', authenticate, authorize('ADMIN'), reportController.resolveReport);

export default router;
