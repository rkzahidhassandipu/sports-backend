// src/utils/pagination.ts
import { Request } from "express";

export function getPagination(req: Request) {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip  = (page - 1) * limit;

  const SORTABLE = ["createdAt","updatedAt","title","price","date","rating","name","email"];
  const sortBy    = SORTABLE.includes(req.query.sortBy as string) ? req.query.sortBy as string : "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
  const orderBy   = { [sortBy]: sortOrder };

  return { page, limit, skip, orderBy };
}

export function buildSearch(q: string, fields: string[]) {
  return { OR: fields.map(f => ({ [f]: { contains: q, mode: "insensitive" as const } })) };
}
