// src/middleware/notFound.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route '${req.method} ${req.originalUrl}' not found`));
}
