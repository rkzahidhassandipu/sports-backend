// src/modules/blog/blog.routes.ts
import { Router } from "express";
import { authenticate, optionalAuth, isAdminOrCoach } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createBlogSchema, updateBlogSchema } from "../../utils/validators";
import * as ctrl from "./blog.controller";

const router = Router();

router.get("/",        optionalAuth, ctrl.getPosts);
router.get("/search",  optionalAuth, ctrl.searchPosts);
router.get("/:slug",   optionalAuth, ctrl.getPost);

router.use(authenticate);
router.post("/",       isAdminOrCoach, validate(createBlogSchema), ctrl.createPost);
router.put ("/:id",    isAdminOrCoach, validate(updateBlogSchema), ctrl.updatePost);
router.patch("/:id/publish",  isAdminOrCoach, ctrl.publishPost);
router.patch("/:id/unpublish",isAdminOrCoach, ctrl.unpublishPost);
router.delete("/:id",  isAdminOrCoach, ctrl.deletePost);

export default router;
