// src/modules/content/content.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export async function getByKey(key: string) {
  const c = await prisma.staticContent.findUnique({ where: { key } });
  if (!c || !c.isActive) throw AppError.notFound(`Content '${key}' not found`);
  return c;
}

export async function getAllContent() {
  return prisma.staticContent.findMany({ orderBy: { key: "asc" } });
}

export async function createContent(data: { key: string; title: string; content: string }) {
  const existing = await prisma.staticContent.findUnique({ where: { key: data.key } });
  if (existing) throw AppError.conflict(`Content with key '${data.key}' already exists`);
  return prisma.staticContent.create({ data });
}

export async function updateContent(key: string, data: { title?: string; content?: string; isActive?: boolean }) {
  const c = await prisma.staticContent.findUnique({ where: { key } });
  if (!c) throw AppError.notFound(`Content '${key}' not found`);
  return prisma.staticContent.update({ where: { key }, data });
}

export async function deleteContent(key: string) {
  const c = await prisma.staticContent.findUnique({ where: { key } });
  if (!c) throw AppError.notFound(`Content '${key}' not found`);
  await prisma.staticContent.delete({ where: { key } });
}
