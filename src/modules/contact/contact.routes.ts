// src/modules/contact/contact.routes.ts
import { Router } from "express";
import { publicRateLimit } from "../../middleware/rateLimiter";
import { authenticate, isAdmin, isStaff } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { contactSchema } from "../../utils/validators";
import * as ctrl from "./contact.controller";

const router = Router();

router.post("/",         publicRateLimit, validate(contactSchema), ctrl.submitContact);
router.get ("/",         authenticate, isStaff, ctrl.getAllContacts);
router.get ("/:id",      authenticate, isStaff, ctrl.getContact);
router.patch("/:id/read",authenticate, isStaff, ctrl.markRead);
router.delete("/:id",   authenticate, isAdmin,  ctrl.deleteContact);

export default router;
