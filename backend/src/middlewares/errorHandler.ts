import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 'Validation failed for request payload', 422, formatted);
  }

  // 2. Custom Application Errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // 3. Prisma Known Request Errors
  if ('code' in err && typeof err.code === 'string') {
    if (err.code === 'P2002') {
      return sendError(res, 'A record with this unique identifier already exists.', 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Requested database record not found.', 404);
    }
  }

  // 4. Default Internal Server Error
  console.error('[Unhandled Error]:', err);
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message,
    500
  );
};
