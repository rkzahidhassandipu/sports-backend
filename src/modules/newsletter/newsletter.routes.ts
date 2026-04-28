// src/modules/newsletter/newsletter.routes.ts
import { Router } from "express";
import { publicRateLimit } from "../../middleware/rateLimiter";
import { authenticate, isAdmin } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { newsletterSchema } from "../../utils/validators";
import * as ctrl from "./newsletter.controller";

const router = Router();
router.post("/subscribe",   publicRateLimit, validate(newsletterSchema), ctrl.subscribe);
router.get ("/confirm",     ctrl.confirm);
router.post("/unsubscribe", validate(newsletterSchema), ctrl.unsubscribe);
router.get ("/list",        authenticate, isAdmin, ctrl.getSubscribers);
export default router;
