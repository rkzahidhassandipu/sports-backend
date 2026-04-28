// src/modules/contact/contact.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export async function submitContact(data: {
  name: string; email: string; phone?: string; subject: string; message: string;
}) {
  return prisma.contactForm.create({ data });
}

export async function getAllContacts(skip: number, take: number, isRead?: string) {
  const where: any = {};
  if (isRead === "true")  where.isRead = true;
  if (isRead === "false") where.isRead = false;

  const [data, total] = await prisma.$transaction([
    prisma.contactForm.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.contactForm.count({ where }),
  ]);
  return { data, total };
}

export async function getContact(id: string) {
  const c = await prisma.contactForm.findUnique({ where: { id } });
  if (!c) throw AppError.notFound("Contact not found");
  // Auto-mark as read when viewed
  if (!c.isRead) {
    await prisma.contactForm.update({ where: { id }, data: { isRead: true } });
  }
  return c;
}

export async function markRead(id: string) {
  return prisma.contactForm.update({ where: { id }, data: { isRead: true } });
}

export async function deleteContact(id: string) {
  const c = await prisma.contactForm.findUnique({ where: { id } });
  if (!c) throw AppError.notFound("Contact not found");
  await prisma.contactForm.delete({ where: { id } });
}
