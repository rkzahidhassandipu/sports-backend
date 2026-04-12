// src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import * as svc from "./auth.service";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.register(req.body, req);
  ApiResponse.created(res, data, "Registration successful. Please verify your email.");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await svc.login(req.body, req);

  res.cookie("refresh_token", refreshToken, COOKIE_OPTS);

  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTS,
    maxAge: 120 * 60 * 1000, 
  });

  ApiResponse.success(res, { user }, "Login successful");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  
  if (token) {
    await svc.logout(token);
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
  
  ApiResponse.success(res, null, "Logged out successfully");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  const result = await svc.refreshAccessToken(token);
  res.cookie("refresh_token", result.refreshToken, COOKIE_OPTS);
  ApiResponse.success(res, { accessToken: result.accessToken }, "Token refreshed");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await svc.forgotPassword(req.body.email);
  ApiResponse.success(res, null, "If this email exists, a reset link has been sent.");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await svc.resetPassword(req.body.token, req.body.password);
  ApiResponse.success(res, null, "Password reset successfully. Please log in.");
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await svc.verifyEmail(req.query.token as string);
  ApiResponse.success(res, null, "Email verified successfully.");
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await svc.resendVerification(req.body.email);
  ApiResponse.success(res, null, "Verification email sent if account exists.");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getMe(req.user!.id);
  ApiResponse.success(res, data);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await svc.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  ApiResponse.success(res, null, "Password changed successfully.");
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getSessions(req.user!.id);
  ApiResponse.success(res, data, "Sessions retrieved");
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  await svc.revokeSession(req.user!.id);
  ApiResponse.success(res, null, "Session revoked");
});

export const revokeAllSessions = asyncHandler(async (req: Request, res: Response) => {
  await svc.revokeAllSessions(req.user!.id);
  res.clearCookie("refresh_token");
  ApiResponse.success(res, null, "All sessions revoked");
});

export const getDemoCredentials = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, {
    admin:   { email: process.env.DEMO_ADMIN_EMAIL   || "admin@gym.com",   password: process.env.DEMO_ADMIN_PASSWORD   || "Admin@123456",   role: "ADMIN" },
    coach:   { email: process.env.DEMO_COACH_EMAIL   || "coach@gym.com",   password: process.env.DEMO_COACH_PASSWORD   || "Coach@123456",   role: "COACH" },
    trainer: { email: process.env.DEMO_TRAINER_EMAIL || "trainer@gym.com", password: process.env.DEMO_TRAINER_PASSWORD || "Trainer@123456", role: "TRAINER" },
    member:  { email: process.env.DEMO_MEMBER_EMAIL  || "member@gym.com",  password: process.env.DEMO_MEMBER_PASSWORD  || "Member@123456",  role: "MEMBER" },
  }, "Demo credentials");
});

export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
  const url = svc.getSocialAuthUrl(req.params.provider);
  res.redirect(url);
});

export const socialCallback = asyncHandler(async (_req: Request, res: Response) => {
  // Delegate to Better Auth in production integration
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=not_configured`);
});
