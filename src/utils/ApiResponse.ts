// src/utils/ApiResponse.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

export interface Meta {
  page: number; limit: number; total: number;
  totalPages: number; hasNext: boolean; hasPrev: boolean;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = "Success", status = 200, meta?: object) {
    return res.status(status).json({ success: true, message, data, ...(meta && { meta }), timestamp: new Date().toISOString() });
  }
  static created<T>(res: Response, data: T, message = "Created successfully") {
    return this.success(res, data, message, 201);
  }
  static noContent(res: Response) { return res.status(204).send(); }

  static paginated<T>(res: Response, data: T[], p: { page: number; limit: number; total: number }, message = "Success") {
    const totalPages = Math.ceil(p.total / p.limit);
    const meta: Meta = { ...p, totalPages, hasNext: p.page < totalPages, hasPrev: p.page > 1 };
    return this.success(res, data, message, 200, meta);
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
