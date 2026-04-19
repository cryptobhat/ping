import { NextFunction, Response } from 'express';
import { ReadingGoalsService } from '../services/reading-goals.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const getGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const goals = await ReadingGoalsService.getGoals(userId);
    successResponse(res, goals, 'Reading goals fetched');
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { dailyGoalMinutes } = req.body;

    if (!dailyGoalMinutes || typeof dailyGoalMinutes !== 'number') {
      errorResponse(res, 'dailyGoalMinutes is required and must be a number');
      return;
    }

    const result = await ReadingGoalsService.updateGoal(userId, dailyGoalMinutes);
    successResponse(res, result, 'Reading goal updated');
  } catch (error) {
    next(error);
  }
};

export const logSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { durationSeconds, contentId, wordsRead } = req.body;

    if (!durationSeconds || typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      errorResponse(res, 'durationSeconds is required and must be a positive number');
      return;
    }

    const result = await ReadingGoalsService.logSession(userId, {
      durationSeconds,
      contentId,
      wordsRead,
    });

    successResponse(res, result, 'Reading session logged');
  } catch (error) {
    next(error);
  }
};
