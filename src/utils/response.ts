import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: string
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    error,
  } as ApiResponse<null>);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'Success'
): void => {
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  } as ApiResponse<T>);
};

export const generateOtp = (length: number = 6): string => {
  const crypto = require('crypto') as typeof import('crypto');
  const bytes = crypto.randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
};

export const generateUsername = (name?: string, phone?: string): string => {
  if (name) {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 20);
    if (base.length >= 3) {
      return `${base}_${Math.floor(Math.random() * 99)}`;
    }
  }
  if (phone) {
    return `kavi_${phone.slice(-4)}${Math.floor(Math.random() * 99)}`;
  }
  return `kavi_${Date.now().toString(36)}`;
};

/**
 * Clamp a pagination limit to a safe range to prevent DoS via unbounded queries.
 */
export const clampLimit = (value: number, max: number = 100): number => {
  return Math.min(Math.max(1, value), max);
};

export const generateDeepLinkCode = (): string => {
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
};