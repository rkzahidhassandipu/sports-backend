// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { authRateLimit } from "../../middleware/rateLimiter";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, changePasswordSchema, resendVerifySchema,
} from "../../utils/validators";
import * as ctrl from "./auth.controller";

const router = Router();

// Public
router.post("/register",             validate(registerSchema),       ctrl.register);
router.post("/login",                validate(loginSchema),          ctrl.login);
router.post("/logout",                                                              ctrl.logout);
router.post("/refresh-token",                                                       ctrl.refreshToken);
router.post("/forgot-password",     authRateLimit, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post("/reset-password",      authRateLimit, validate(resetPasswordSchema),  ctrl.resetPassword);
router.get ("/verify-email",                                                        ctrl.verifyEmail);
router.post("/resend-verification", authRateLimit, validate(resendVerifySchema),   ctrl.resendVerification);
router.get ("/demo-credentials",                                                    ctrl.getDemoCredentials);

// Social
router.get("/social/:provider",          ctrl.socialLogin);
router.get("/social/:provider/callback", ctrl.socialCallback);

// Protected
router.use(authenticate);
router.get  ("/me",                    ctrl.getMe);
router.post ("/change-password",  validate(changePasswordSchema), ctrl.changePassword);
router.get  ("/sessions",              ctrl.getSessions);
router.delete("/sessions/:id",         ctrl.revokeSession);
router.post ("/revoke-all-sessions",   ctrl.revokeAllSessions);

export default router;
