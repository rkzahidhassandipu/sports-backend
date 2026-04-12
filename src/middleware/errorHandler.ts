// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") error = AppError.conflict(`Duplicate value: ${(err.meta?.target as string[])?.join(", ")}`);
    else if (err.code === "P2025") error = AppError.notFound("Record not found");
    else error = new AppError(`Database error [${err.code}]`, 500);
  } else if (err instanceof ZodError) {
    const details = err.errors.map(e => ({ field: e.path.join("."), message: e.message }));
    error = AppError.validationError("Validation failed", details);
  } else if (err.name === "JsonWebTokenError") {
    error = AppError.unauthorized("Invalid token");
  } else if (err.name === "TokenExpiredError") {
    error = AppError.unauthorized("Token expired");
  } else if ((err as any).code === "LIMIT_FILE_SIZE") {
    error = AppError.badRequest("File too large (max 50MB)");
  } else {
    error = new AppError(err.message || "Internal server error", 500);
  }

  logger.error(`[${error.statusCode}] ${error.message}`, { code: error.code });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.code && { code: error.code }),
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
}
