// src/app.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middleware/errorHandler";
import { notFoundHandler }    from "./middleware/notFound";
import { requestLogger }      from "./middleware/requestLogger";
import { globalRateLimit }    from "./middleware/rateLimiter";
import authRoutes        from "./modules/auth/auth.routes";
import userRoutes        from "./modules/users/user.routes";
import sessionRoutes     from "./modules/sessions/session.routes";
import fitnessRoutes     from "./modules/fitness/fitness.routes";
import bookingRoutes     from "./modules/bookings/booking.routes";
import paymentRoutes     from "./modules/payments/payment.routes";
import reportRoutes      from "./modules/reports/report.routes";
import blogRoutes        from "./modules/blog/blog.routes";
import supportRoutes     from "./modules/support/support.routes";
import newsletterRoutes  from "./modules/newsletter/newsletter.routes";
import contactRoutes     from "./modules/contact/contact.routes";
import contentRoutes     from "./modules/content/content.routes";
import { logger } from "./config/logger";

const app: Application = express();

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", "data:", "res.cloudinary.com"] } },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: [
    "https://sports-club-self.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true
}));

// Stripe webhook needs raw body — mount BEFORE json middleware
app.post("/api/v1/bookings/webhook/stripe", express.raw({ type: "application/json" }));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

// Morgan-কে Winston-এর সাথে কানেক্ট করার স্ট্রিম
const stream = {
  write: (message: string) => logger.info(message.trim()),
};

app.use(morgan(logFormat, { stream }));
app.use(requestLogger);
app.use(globalRateLimit);

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", version: "1.0.0", environment: process.env.NODE_ENV, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

const API = "/api/v1";
app.use(`${API}/auth`,       authRoutes);
app.use(`${API}/users`,      userRoutes);
app.use(`${API}/sessions`,   sessionRoutes);
app.use(`${API}/fitness`,    fitnessRoutes);
app.use(`${API}/bookings`,   bookingRoutes);
app.use(`${API}/payments`,   paymentRoutes);
app.use(`${API}/reports`,    reportRoutes);
app.use(`${API}/blog`,       blogRoutes);
app.use(`${API}/support`,    supportRoutes);
app.use(`${API}/newsletter`, newsletterRoutes);
app.use(`${API}/contact`,    contactRoutes);
app.use(`${API}/content`,    contentRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
