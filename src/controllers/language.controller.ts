import { NextFunction, Request, Response } from 'express';
import { LanguageService } from '../services/language.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse } from '../utils/response';

export const getLanguages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const languages = await LanguageService.getLanguages();
    successResponse(res, languages);
  } catch (error) {
    next(error);
  }
};

export const createLanguage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, nativeName } = req.body;
    const language = await LanguageService.createLanguage({ code, name, nativeName });
    successResponse(res, language, 'Language created', 201);
  } catch (error) {
    next(error);
  }
};