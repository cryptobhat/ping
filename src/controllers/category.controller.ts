import { NextFunction, Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const getAllCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await CategoryService.getAllCategories();
    successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    // Try UUID first, then slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const category = isUuid
      ? await CategoryService.getCategoryById(id)
      : await CategoryService.getCategoryBySlug(id);

    if (!category) {
      successResponse(res, null);
      return;
    }

    successResponse(res, category);
  } catch (error) {
    next(error);
  }
};

export const getCategoryContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const language = req.query.language as string | undefined;

    // Resolve slug to UUID if needed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let categoryId = id;
    if (!isUuid) {
      const cat = await CategoryService.getCategoryBySlug(id);
      if (!cat) { successResponse(res, []); return; }
      categoryId = cat.id;
    }

    const { content, total } = await CategoryService.getCategoryContent(categoryId, page, limit, language);
    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};