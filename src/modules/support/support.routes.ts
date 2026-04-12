// src/modules/support/support.routes.ts
import { Router } from "express";
import { authenticate, isAdmin, isStaff } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createTicketSchema, replyTicketSchema, updateTicketStatusSchema } from "../../utils/validators";
import * as ctrl from "./support.controller";

const router = Router();
router.use(authenticate);

router.post("/",              validate(createTicketSchema), ctrl.createTicket);
router.get ("/my",            ctrl.getMyTickets);
router.get ("/:id",           ctrl.getTicket);
router.post("/:id/reply",     validate(replyTicketSchema), ctrl.replyTicket);
router.post("/:id/close",     ctrl.closeTicket);

router.get ("/admin/all",     isStaff, ctrl.getAllTickets);
router.patch("/:id/status",   isStaff, validate(updateTicketStatusSchema), ctrl.updateStatus);
router.delete("/:id",         isAdmin, ctrl.deleteTicket);

export default router;
