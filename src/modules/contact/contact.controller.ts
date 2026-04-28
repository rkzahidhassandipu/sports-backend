// src/modules/contact/contact.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./contact.service";

export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  await svc.submitContact(req.body);
  ApiResponse.created(res, null, "Message received. We'll get back to you soon.");
});

export const getAllContacts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getAllContacts(skip, limit, req.query.isRead as string);
  ApiResponse.paginated(res, data, { page, limit, total });
});

export const getContact = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.getContact(id));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.markRead(id), "Marked as read");
});

export const deleteContact = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await svc.deleteContact(id);
  ApiResponse.noContent(res);
});
