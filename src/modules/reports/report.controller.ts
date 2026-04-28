// src/modules/reports/report.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./report.service";

export const getOverview     = asyncHandler(async (_req, res) => { ApiResponse.success(res, await svc.getOverview()); });
export const getRevenueChart = asyncHandler(async (req, res)  => { ApiResponse.success(res, await svc.getRevenueChart(req.query.period as string || "30d")); });
export const getBookingsChart= asyncHandler(async (req, res)  => { ApiResponse.success(res, await svc.getBookingsChart(req.query.period as string || "30d")); });
export const getMembersChart = asyncHandler(async (req, res)  => { ApiResponse.success(res, await svc.getMembersChart(req.query.period as string || "30d")); });
export const getSessionsChart= asyncHandler(async (_req, res) => { ApiResponse.success(res, await svc.getSessionsChart()); });

export const getBookingsTable = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getBookingsTable(skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getUsersTable = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getUsersTable(skip, limit, req.query.search as string);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getPaymentsTable = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getPaymentsTable(skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getAuditLogs(skip, limit, req.query.action as string, req.query.userId as string);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getActivityLogs(skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getReports(skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const { type, period } = req.body;
  ApiResponse.created(res, await svc.generateReport(type, period || "30d", req.user!.id), "Report generated");
});
