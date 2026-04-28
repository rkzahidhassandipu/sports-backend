// src/modules/users/user.routes.ts
import { Router } from "express";
import { authenticate, isAdmin, isStaff } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { upload } from "../../config/cloudinary";
import { updateUserSchema, updateProfileSchema, assignRoleSchema, updateStatusSchema } from "../../utils/validators";
import * as ctrl from "./user.controller";

const router = Router();
router.use(authenticate);

// Own profile
router.get   ("/profile",               ctrl.getProfile);
router.put   ("/profile",  validate(updateUserSchema), ctrl.updateProfile);
router.put   ("/profile/details", validate(updateProfileSchema), ctrl.updateProfileDetails);
router.post  ("/profile/avatar", upload.single("avatar"), ctrl.uploadAvatar);
router.delete("/account",               ctrl.deleteOwnAccount);

// Notifications
router.get   ("/notifications",             ctrl.getNotifications);
router.patch ("/notifications/:id/read",    ctrl.markRead);
router.patch ("/notifications/read-all",    ctrl.markAllRead);

// Activity
router.get("/activity", ctrl.getActivityLog);

// Admin-only
router.get   ("/",         isAdmin, ctrl.getAllUsers);
router.get   ("/:id",      isStaff, ctrl.getUserById);
router.patch ("/:id/role", isAdmin, validate(assignRoleSchema),  ctrl.assignRole);
router.patch ("/:id/status", isAdmin, validate(updateStatusSchema), ctrl.updateStatus);
router.delete("/:id",      isAdmin, ctrl.deleteUser);

export default router;
