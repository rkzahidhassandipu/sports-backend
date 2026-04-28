import {PrismaClient} from "@prisma/client"

import { logger } from "./logger";

declare global { var __prisma: PrismaClient | undefined; }

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? [{ emit: "event", level: "query" }, "info", "warn", "error"]
      : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

export async function connectDatabase() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  logger.info("📊  Database connected");
}
