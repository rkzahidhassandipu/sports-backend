// src/modules/content/content.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import * as svc from "./content.service";

export const getPrivacy = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getByKey("privacy-policy"));
});

export const getTerms = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getByKey("terms-of-service"));
});

export const getContent = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  ApiResponse.success(res, await svc.getByKey(key));
});

export const getAllContent = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getAllContent());
});

export const createContent = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(res, await svc.createContent(req.body), "Content created");
});

export const updateContent = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  ApiResponse.success(res, await svc.updateContent(key, req.body), "Content updated");
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  await svc.deleteContent(key);
  ApiResponse.noContent(res);
});
