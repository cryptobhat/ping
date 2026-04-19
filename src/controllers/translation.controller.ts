import { NextFunction, Response } from 'express';
import { ContentTranslationService } from '../services/language.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const getTranslations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId } = req.params;
    const translations = await ContentTranslationService.getTranslations(contentId);
    successResponse(res, translations);
  } catch (error) {
    next(error);
  }
};

export const getTranslation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId, lang } = req.params;
    const translation = await ContentTranslationService.getTranslation(contentId, lang);

    if (!translation) {
      errorResponse(res, 'Translation not found', 404);
      return;
    }

    successResponse(res, translation);
  } catch (error) {
    next(error);
  }
};

export const createTranslation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { languageCode, title, body, isAutoTranslated } = req.body;
    const userId = req.userId!;

    const translation = await ContentTranslationService.createTranslation(
      contentId,
      languageCode,
      { title, body, isAutoTranslated },
      userId
    );
    successResponse(res, translation, 'Translation created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTranslation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId, lang } = req.params;
    const { title, body } = req.body;

    const translation = await ContentTranslationService.updateTranslation(contentId, lang, { title, body });
    successResponse(res, translation);
  } catch (error) {
    next(error);
  }
};

export const deleteTranslation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId, lang } = req.params;
    await ContentTranslationService.deleteTranslation(contentId, lang);
    successResponse(res, null, 'Translation deleted');
  } catch (error) {
    next(error);
  }
};