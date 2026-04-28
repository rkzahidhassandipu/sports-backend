// src/modules/bookings/booking.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./booking.service";

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(res, await svc.createBooking(req.user!.id, req.body), "Booking created");
});
export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getMyBookings(req.user!.id, skip, limit, req.query.status as string);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.getBooking(id, req.user!.id, req.user!.role));
});
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await svc.cancelBooking(id, req.user!.id, req.user!.role, req.body.reason);
  ApiResponse.success(res, null, "Booking cancelled");
});
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getAllBookings(skip, limit, {
    status:    req.query.status    as string,
    sessionId: req.query.sessionId as string,
    userId:    req.query.userId    as string,
  });
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.updateStatus(id, req.body.status, req.body.reason), "Status updated");
});
export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.createCheckout(id, req.user!.id));
});
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  await svc.handleStripeWebhook(req.body as Buffer, req.headers["stripe-signature"] as string);
  res.json({ received: true });
});
