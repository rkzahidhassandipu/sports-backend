// src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import { AppError } from "../utils/AppError";

const make = (max: number, msg: string) =>
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(AppError.tooManyRequests(msg)),
    skip: req => req.path === "/api/v1/health",
  });

export const globalRateLimit  = make(parseInt(process.env.RATE_LIMIT_MAX || "100"), "Too many requests. Try again later.");
export const authRateLimit    = make(parseInt(process.env.AUTH_RATE_LIMIT_MAX || "10"), "Too many auth attempts. Wait 15 minutes.");
export const uploadRateLimit  = make(20, "Too many uploads. Try again later.");
export const publicRateLimit  = make(5,  "Too many submissions. Try again later.");
