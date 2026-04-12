// src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode    = statusCode;
    this.status        = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true;
    this.code          = code;
    this.details       = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, code?: string, details?: unknown) { return new AppError(msg, 400, code, details); }
  static unauthorized(msg = "Unauthorized")                        { return new AppError(msg, 401, "UNAUTHORIZED"); }
  static forbidden(msg = "Forbidden")                              { return new AppError(msg, 403, "FORBIDDEN"); }
  static notFound(msg = "Not found")                               { return new AppError(msg, 404, "NOT_FOUND"); }
  static conflict(msg: string, code?: string)                      { return new AppError(msg, 409, code ?? "CONFLICT"); }
  static validationError(msg: string, details?: unknown)           { return new AppError(msg, 422, "VALIDATION_ERROR", details); }
  static tooManyRequests(msg = "Too many requests")                { return new AppError(msg, 429, "RATE_LIMITED"); }
  static internal(msg = "Internal server error")                   { return new AppError(msg, 500, "INTERNAL"); }
}
