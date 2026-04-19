import jwt from 'jsonwebtoken';
import { Request } from 'express';
import config from '../config';

interface JwtPayload {
  userId: string;
  role: string;
  jwtVersion: number;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const generateToken = (userId: string, role: string = 'USER', jwtVersion: number = 0): string => {
  return jwt.sign(
    { userId, role, jwtVersion },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
  }
};

export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};
