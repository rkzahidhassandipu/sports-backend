// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function validate(schema: ZodSchema, target: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(AppError.validationError("Validation failed", err.errors.map(e => ({ field: e.path.join("."), message: e.message }))));
      }
      next(err);
    }
  };
}
