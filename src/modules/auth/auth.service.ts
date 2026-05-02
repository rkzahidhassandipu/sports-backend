// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request } from "express";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { emailService } from "../../lib/email";
import { audit, activity } from "../../lib/audit";

const SECRET   = process.env.JWT_SECRET!;
const EXP      = process.env.JWT_EXPIRES_IN || "15m";
const REXP     = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const APP_URL  = process.env.APP_URL || "https://sports-plus-backend.vercel.app";
const CLI_URL  = process.env.CLIENT_URL || "https://sports-club-self.vercel.app";

const SAFE = {
  id: true, name: true, email: true, emailVerified: true,
  avatar: true, phone: true, bio: true, role: true, status: true,
  lastLoginAt: true, createdAt: true,
};

function tokens(id: string, email: string, role: string) {
  const accessToken  = jwt.sign({ sub: id, email, role }, SECRET, { expiresIn: EXP } as any);
  const refreshToken = jwt.sign({ sub: id, type: "refresh" }, SECRET, { expiresIn: REXP } as any);
  return { accessToken, refreshToken };
}

export async function register(data: { name: string; email: string; password: string; phone?: string }, req?: Request) {
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (exists) throw AppError.conflict("Email already registered", "EMAIL_TAKEN");

  const hashed = await bcrypt.hash(data.password, 12);
  const vToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      name: data.name, email: data.email.toLowerCase(),
      password: hashed, phone: data.phone,
      emailVerificationToken: vToken,
      profile: { create: {} },
    },
    select: SAFE,
  });

  const url = `${APP_URL}/api/v1/auth/verify-email?token=${vToken}`;
  await emailService.verifyEmail(user.email, url, user.name).catch(() => null);
  await audit({ userId: user.id, action: "REGISTER", resource: "User", resourceId: user.id, req });
  return user;
}

export async function login(data: { email: string; password: string; rememberMe?: boolean }, req?: Request) {
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user || !user.password) throw AppError.unauthorized("Invalid email or password");
  if (user.status === "SUSPENDED") throw AppError.forbidden("Account suspended. Contact support.");
  if (user.status === "DELETED")   throw AppError.forbidden("Account not found.");

  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw AppError.unauthorized("Invalid email or password");

  const { accessToken, refreshToken } = tokens(user.id, user.email, user.role);
  const exp = new Date(Date.now() + (data.rememberMe ? 30 : 7) * 86_400_000);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), refreshToken, refreshTokenExpiry: exp },
  });

  await activity(user.id, "Logged in", "LOGIN", req);
  const { password: _, emailVerificationToken: __, passwordResetToken: ___, refreshToken: ____, ...safe } = user;
  return { user: safe, accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  await prisma.user.updateMany({
    where: { refreshToken },
    data: { refreshToken: null, refreshTokenExpiry: null },
  });
}

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) throw AppError.unauthorized("Refresh token required");

  let decoded: { sub: string; type: string };
  try { decoded = jwt.verify(refreshToken, SECRET) as any; }
  catch { throw AppError.unauthorized("Invalid refresh token"); }

  if (decoded.type !== "refresh") throw AppError.unauthorized("Invalid token type");

  const user = await prisma.user.findFirst({
    where: { id: decoded.sub, refreshToken, refreshTokenExpiry: { gt: new Date() } },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user) throw AppError.unauthorized("Session expired. Please log in again.");
  if (user.status !== "ACTIVE") throw AppError.forbidden("Account inactive");

  const { accessToken, refreshToken: newRefresh } = tokens(user.id, user.email, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefresh, refreshTokenExpiry: new Date(Date.now() + 7 * 86_400_000) },
  });

  return { accessToken, refreshToken: newRefresh };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return; // silent

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetTokenExpiry: new Date(Date.now() + 3_600_000) },
  });

  const url = `${CLI_URL}/auth/reset-password?token=${token}`;
  await emailService.passwordReset(user.email, url, user.name).catch(() => null);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw AppError.badRequest("Invalid or expired reset token", "INVALID_TOKEN");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetTokenExpiry: null, refreshToken: null },
  });
}

export async function verifyEmail(token: string) {
  if (!token) throw AppError.badRequest("Token required");
  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) throw AppError.badRequest("Invalid token", "INVALID_TOKEN");
  if (user.emailVerified) throw AppError.badRequest("Email already verified");

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifiedAt: new Date(), emailVerificationToken: null },
  });
  await emailService.welcome(user.email, user.name).catch(() => null);
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.emailVerified) return;
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: token } });
  const url = `${APP_URL}/api/v1/auth/verify-email?token=${token}`;
  await emailService.verifyEmail(user.email, url, user.name).catch(() => null);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...SAFE, profile: true, _count: { select: { bookings: true, reviews: true } } },
  });
  if (!user) throw AppError.notFound("User not found");
  return user;
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password) throw AppError.badRequest("No password set");
  const ok = await bcrypt.compare(current, user.password);
  if (!ok) throw AppError.badRequest("Current password incorrect", "WRONG_PASSWORD");
  const hashed = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, refreshToken: null } });
}

export async function getSessions(userId: string) {
  // Using refresh token as session indicator
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { refreshToken: true, refreshTokenExpiry: true, lastLoginAt: true },
  });
  return user;
}

export async function revokeSession(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null, refreshTokenExpiry: null } });
}

export async function revokeAllSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null, refreshTokenExpiry: null } });
}

export function getSocialAuthUrl(provider: string): string {
  const urls: Record<string, string> = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${APP_URL}/api/v1/auth/social/google/callback&response_type=code&scope=email+profile`,
    github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${APP_URL}/api/v1/auth/social/github/callback&scope=user:email`,
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${APP_URL}/api/v1/auth/social/facebook/callback&scope=email,public_profile`,
  };
  if (!urls[provider]) throw AppError.badRequest(`Unsupported provider: ${provider}`);
  return urls[provider];
}
