// src/modules/reports/report.routes.ts
import { Router } from "express";
import { authenticate, isAdmin, isAdminOrCoach, isTrainerOrAbove } from "../../middleware/authenticate";
import * as ctrl from "./report.controller";

const router = Router();
router.use(authenticate);

// Dashboard overview (admin/coach)
router.get("/dashboard/overview",    isAdminOrCoach,    ctrl.getOverview);
router.get("/dashboard/revenue",     isAdmin,           ctrl.getRevenueChart);
router.get("/dashboard/bookings",    isAdminOrCoach,    ctrl.getBookingsChart);
router.get("/dashboard/members",     isAdminOrCoach,    ctrl.getMembersChart);
router.get("/dashboard/sessions",    isAdminOrCoach,    ctrl.getSessionsChart);
router.get("/dashboard/tables/bookings", isAdminOrCoach, ctrl.getBookingsTable);
router.get("/dashboard/tables/users",   isAdmin,        ctrl.getUsersTable);
router.get("/dashboard/tables/payments", isAdmin,       ctrl.getPaymentsTable);

// Reports
router.get("/",              isAdmin,           ctrl.getReports);
router.post("/generate",     isAdmin,           ctrl.generateReport);
router.get ("/audit-logs",   isAdmin,           ctrl.getAuditLogs);
router.get ("/activity",     isAdmin,           ctrl.getActivityLogs);

export default router;
