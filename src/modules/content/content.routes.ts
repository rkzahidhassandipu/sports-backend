// src/modules/content/content.routes.ts
import { Router } from "express";
import { authenticate, isAdmin } from "../../middleware/authenticate";
import * as ctrl from "./content.controller";

const router = Router();

// Public
router.get("/privacy",      ctrl.getPrivacy);
router.get("/terms",        ctrl.getTerms);
router.get("/:key",         ctrl.getContent);

// Admin
router.use(authenticate, isAdmin);
router.get("/",             ctrl.getAllContent);
router.post("/",            ctrl.createContent);
router.put("/:key",         ctrl.updateContent);
router.delete("/:key",      ctrl.deleteContent);

export default router;
