// src/modules/newsletter/newsletter.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./newsletter.service";

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.subscribe(req.body.email, req.body.name);
  ApiResponse.success(res, result, "Subscription initiated. Please check your email.");
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const ok = await svc.confirm(req.query.token as string);
  if (ok) {
    res.redirect(`${process.env.CLIENT_URL}/newsletter/confirmed`);
  } else {
    ApiResponse.success(res, null, "Invalid or expired token.");
  }
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  await svc.unsubscribe(req.body.email);
  ApiResponse.success(res, null, "Unsubscribed successfully.");
});

export const getSubscribers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getSubscribers(skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
