// src/index.ts
import "dotenv/config";
import app from "./app";
import { connectDatabase, prisma } from "./config/database";
import { logger } from "./config/logger";

const PORT = parseInt(process.env.PORT || "5000", 10);

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`🚀  Server        → http://localhost:${PORT}`);
      logger.info(`🏥  Health check  → http://localhost:${PORT}/api/v1/health`);
      logger.info(`📦  Environment   → ${process.env.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`\n[${signal}] Shutting down gracefully…`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database disconnected. Goodbye. 👋");
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
    process.on("uncaughtException",  (err)    => { logger.error("Uncaught Exception:",   err); process.exit(1); });
    process.on("unhandledRejection", (reason) => { logger.error("Unhandled Rejection:", reason); process.exit(1); });

  } catch (err) {
    logger.error("Bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();
