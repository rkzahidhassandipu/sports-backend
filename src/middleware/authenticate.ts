// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/ApiResponse";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; role: Role; status: string; };
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies?.access_token ?? null;
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized("Authentication required");

  let decoded: { sub: string; email: string; role: Role };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  if (!user) throw AppError.unauthorized("Account not found");
  if (user.status === "SUSPENDED") throw AppError.forbidden("Account suspended");
  if (user.status === "DELETED")   throw AppError.forbidden("Account deleted");

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    if (user?.status === "ACTIVE") req.user = user;
  } catch { /* silent */ }
  next();
});

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden(`Access denied. Required: ${roles.join(", ")}`);
    next();
  };
}

// Shorthand guards
export const isAdmin       = authorize(Role.ADMIN);
export const isAdminOrCoach = authorize(Role.ADMIN, Role.COACH);
export const isStaff       = authorize(Role.ADMIN, Role.COACH, Role.TRAINER, Role.RECEPTIONIST);
export const isTrainerOrAbove = authorize(Role.ADMIN, Role.COACH, Role.TRAINER);
