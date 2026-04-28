// src/modules/sessions/session.routes.ts
import { Router } from "express";
import { authenticate, optionalAuth, isAdminOrCoach, isAdmin } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { upload } from "../../config/cloudinary";
import { createSessionSchema, updateSessionSchema, sessionStatusSchema, createReviewSchema } from "../../utils/validators";
import * as ctrl from "./session.controller";

const router = Router();

// Public / optional auth
router.get("/",         ctrl.getSessions);
router.get("/search",  optionalAuth, ctrl.searchSessions);
router.get("/:id",     optionalAuth, ctrl.getSession);
router.get("/:id/reviews", ctrl.getSessionReviews);

// Protected - any authenticated
router.use(authenticate);
router.post("/:id/reviews", validate(createReviewSchema), ctrl.createReview);

// Coach/Admin only
router.post  ("/",          isAdminOrCoach, validate(createSessionSchema), ctrl.createSession);
router.put   ("/:id",       isAdminOrCoach, validate(updateSessionSchema), ctrl.updateSession);
router.patch ("/:id/status",isAdminOrCoach, validate(sessionStatusSchema), ctrl.updateStatus);
router.post  ("/:id/cover", isAdminOrCoach, upload.single("image"),        ctrl.uploadCover);
router.delete("/:id",       isAdmin,                                        ctrl.deleteSession);

// My sessions (coach)
router.get("/coach/my-sessions", isAdminOrCoach, ctrl.getMySessions);

export default router;
