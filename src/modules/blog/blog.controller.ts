// src/modules/blog/blog.controller.ts
import { Request, Response } from "express";
import { asyncHandler, ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import * as svc from "./blog.service";

export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const tag = req.query.tag as string | undefined;
  const published = req.query.published === "false" ? false : true;
  const search = (req.query.search as string)?.trim() || undefined; // ✅ undefined not ""

  console.log("search:", search); // debug

  const { data, total } = await svc.getPosts(skip, limit, tag, published, search);
  ApiResponse.paginated(res, data, { page, limit, total });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, await svc.getPost(req.params.slug));
});
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  console.log("🔍 search hit:", req.query.q); // add this

  const { page, limit, skip } = getPagination(req);
  const q = (req.query.q as string)?.trim() || "";

  console.log("q:", q); // add this

  const { data, total } = await svc.searchPosts(q, skip, limit);
  ApiResponse.paginated(res, data, { page, limit, total });
});
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.created(
    res,
    await svc.createPost(req.body, req.user!.id),
    "Post created",
  );
});
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    await svc.updatePost(req.params.id, req.body, req.user!.id, req.user!.role),
    "Post updated",
  );
});
export const publishPost = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(
    res,
    await svc.setPublished(req.params.id, true),
    "Post published",
  );
});
export const unpublishPost = asyncHandler(
  async (req: Request, res: Response) => {
    ApiResponse.success(
      res,
      await svc.setPublished(req.params.id, false),
      "Post unpublished",
    );
  },
);
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletePost(req.params.id, req.user!.id, req.user!.role);
  ApiResponse.noContent(res);
});
