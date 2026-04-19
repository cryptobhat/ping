import { NextFunction, Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { UploadService } from '../services/upload.service';
import { successResponse, errorResponse } from '../utils/response';

export const uploadImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, 'No image file provided', 400);
      return;
    }

    const type = (req.query.type as 'image' | 'cover' | 'avatar') || 'image';
    const url = await UploadService.processImage(req.file.buffer, type);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    successResponse(res, { url: fullUrl }, 'Image uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const uploadMultiple = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      errorResponse(res, 'No images provided', 400);
      return;
    }

    const type = (req.query.type as 'image' | 'cover' | 'avatar') || 'image';
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    const urls = await Promise.all(
      files.map(async (file) => {
        const url = await UploadService.processImage(file.buffer, type);
        return url.startsWith('http') ? url : `${baseUrl}${url}`;
      })
    );

    successResponse(res, { urls }, 'Images uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};
