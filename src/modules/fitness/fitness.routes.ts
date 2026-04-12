// src/modules/fitness/fitness.routes.ts
import { Router } from "express";
import { authenticate, isTrainerOrAbove, isAdminOrCoach } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createFitnessSchema, updateFitnessSchema } from "../../utils/validators";
import * as ctrl from "./fitness.controller";

const router = Router();
router.use(authenticate);

// Member: view own records
router.get("/my-records",      ctrl.getMyRecords);
router.get("/my-progress",     ctrl.getMyProgress);

// Trainer/Coach: manage records
router.post("/",               isTrainerOrAbove, validate(createFitnessSchema), ctrl.createRecord);
router.get("/member/:memberId",isTrainerOrAbove, ctrl.getMemberRecords);
router.put("/:id",             isTrainerOrAbove, validate(updateFitnessSchema), ctrl.updateRecord);
router.delete("/:id",          isTrainerOrAbove, ctrl.deleteRecord);

// Coach/Admin: performance reports
router.get("/performance/:memberId", isAdminOrCoach, ctrl.getPerformanceReport);
router.get("/trainer-summary",       isTrainerOrAbove, ctrl.getTrainerSummary);

export default router;
