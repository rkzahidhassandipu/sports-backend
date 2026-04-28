// src/modules/payments/payment.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./payment.service";

export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getMyPayments(req.user!.id, skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.getPayment(id, req.user!.id, req.user!.role));
});
export const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getAllPayments(skip, limit, {
    status: req.query.status as string,
    method: req.query.method as string,
  });
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const amount = req.body.amount ? Number(req.body.amount) : undefined;
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.refundPayment(id, amount), "Refund initiated");
});
export const getPaymentStats = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getPaymentStats(), "Payment statistics");
});
export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const invoice = await svc.generateInvoiceData(id, req.user!.id);
  ApiResponse.success(res, invoice, "Invoice data");
});
