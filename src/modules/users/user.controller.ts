// src/modules/users/user.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./user.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getProfile(req.user!.id));
});
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.updateProfile(req.user!.id, req.body), "Profile updated");
});
export const updateProfileDetails = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.updateProfileDetails(req.user!.id, req.body), "Details updated");
});
export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error("No file uploaded");
  ApiResponse.success(res, await svc.uploadAvatar(req.user!.id, req.file.buffer), "Avatar updated");
});
export const deleteOwnAccount = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteOwnAccount(req.user!.id);
  ApiResponse.success(res, null, "Account deleted");
});
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getNotifications(req.user!.id, skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await svc.markRead(id, req.user!.id);
  ApiResponse.success(res, null, "Marked as read");
});
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await svc.markAllRead(req.user!.id);
  ApiResponse.success(res, null, "All marked as read");
});
export const getActivityLog = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { data, total } = await svc.getActivityLog(req.user!.id, skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, orderBy } = getPagination(req);
  const { data, total } = await svc.getAllUsers({ skip, take: limit, orderBy }, {
    search: req.query.search as string,
    role:   req.query.role as string,
    status: req.query.status as string,
  });
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.getUserById(id));
});
export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.assignRole(id, req.body.role), "Role updated");
});
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  ApiResponse.success(res, await svc.updateStatus(id, req.body.status), "Status updated");
});
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await svc.deleteUser(id);
  ApiResponse.noContent(res);
});
