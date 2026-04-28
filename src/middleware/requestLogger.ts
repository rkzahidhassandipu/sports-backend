// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const lvl = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[lvl](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      ip: req.ip, uid: (req as any).user?.id,
    });
  });
  next();
}
