// src/config/logger.ts
import winston from "winston";
import path from "path";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFmt = printf(({ level, message, timestamp: ts, stack }) =>
  `${ts} [${level}]: ${stack || message}`
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: "HH:mm:ss" }), errors({ stack: true }), devFmt),
    }),
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});
