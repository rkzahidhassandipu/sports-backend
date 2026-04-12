// src/modules/fitness/fitness.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./fitness.service";

export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(res, await svc.createRecord(req.body, req.user!.id), "Record created");
});
export const getMyRecords = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getMyRecords(req.user!.id, skip, limit, req.query.type as string);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getMemberRecords = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const result = await svc.getMemberRecords(req.params.memberId, skip, limit);
  ApiResponse.paginated(res, result.data, { page, limit, total: result.total });
});
export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.updateRecord(req.params.id, req.body, req.user!.id, req.user!.role), "Record updated");
});
export const deleteRecord = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteRecord(req.params.id, req.user!.id, req.user!.role);
  ApiResponse.noContent(res);
});
export const getPerformanceReport = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getPerformanceReport(req.params.memberId), "Performance report");
});
export const getMyProgress = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getMyProgress(req.user!.id), "Progress retrieved");
});
export const getTrainerSummary = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getTrainerSummary(req.user!.id), "Summary retrieved");
});
