import { NextFunction, Response } from 'express';
import { verifyToken, extractToken, AuthRequest } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import prisma from '../config/database';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    errorResponse(res, 'Invalid or expired token', 401);
    return;
  }

  // Check jwtVersion to support token revocation (logout invalidates all old tokens)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { jwtVersion: true, isActive: true },
  });

  if (!user || !user.isActive) {
    errorResponse(res, 'Account not found or deactivated', 401);
    return;
  }

  if (decoded.jwtVersion !== undefined && decoded.jwtVersion !== user.jwtVersion) {
    errorResponse(res, 'Token has been revoked. Please login again.', 401);
    return;
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      errorResponse(res, 'Unauthorized access', 403);
      return;
    }
    next();
  };
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      // Verify jwtVersion and isActive (same as authenticate, but don't reject on failure)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { jwtVersion: true, isActive: true },
      });

      if (user && user.isActive &&
          (decoded.jwtVersion === undefined || decoded.jwtVersion === user.jwtVersion)) {
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      }
    }
  }
  next();
};
