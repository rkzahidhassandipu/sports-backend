// src/modules/payments/payment.routes.ts
import { Router } from "express";
import { authenticate, isAdmin } from "../../middleware/authenticate";
import * as ctrl from "./payment.controller";

const router = Router();
router.use(authenticate);

router.get("/my",          ctrl.getMyPayments);
router.get("/my/invoice/:id", ctrl.downloadInvoice);
router.get("/",            isAdmin, ctrl.getAllPayments);
router.get("/:id",         ctrl.getPayment);
router.post("/:id/refund", isAdmin, ctrl.refundPayment);
router.get("/stats/summary", isAdmin, ctrl.getPaymentStats);

export default router;
