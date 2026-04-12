// src/modules/sessions/session.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./session.service";

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, orderBy } = getPagination(req);
  const { data, total } = await svc.getSessions({ skip, take: limit, orderBy }, {
    search:   req.query.search as string,
    category: req.query.category as string,
    level:    req.query.level as string,
    status:   req.query.status as string,
    coachId:  req.query.coachId as string,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    dateFrom: req.query.dateFrom as string,
    dateTo:   req.query.dateTo as string,
  });
  ApiResponse.paginated(res, data, { page, limit, total });
});

export const searchSessions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.searchSessions(req.query.q as string || "", skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getSession(req.params.id));
});

export const getMySessions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getMySessions(req.user!.id, skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(res, await svc.createSession(req.body, req.user!.id), "Session created");
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.updateSession(req.params.id, req.body, req.user!.id, req.user!.role), "Session updated");
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.updateStatus(req.params.id, req.body.status), "Status updated");
});

export const uploadCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error("No file provided");
  ApiResponse.success(res, await svc.uploadCover(req.params.id, req.file.buffer), "Cover uploaded");
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteSession(req.params.id);
  ApiResponse.noContent(res);
});

export const getSessionReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const result = await svc.getSessionReviews(req.params.id, skip, limit);
  ApiResponse.paginated(res, result.data, { page, limit, total: result.total }, "Reviews retrieved");
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(res, await svc.createReview(req.params.id, req.user!.id, req.body), "Review submitted");
});
