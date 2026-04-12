// src/modules/newsletter/newsletter.service.ts
import crypto from "crypto";
import { prisma } from "../../config/database";
import { emailService } from "../../lib/email";

const APP_URL = process.env.APP_URL || "http://localhost:5000";

export async function subscribe(email: string, name?: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, name, token, isActive: false },
    update: { name, token, isActive: false },
  });
  const url = `${APP_URL}/api/v1/newsletter/confirm?token=${token}`;
  await emailService.newsletterConfirm(email, url).catch(() => null);
  return { message: "Check your email to confirm subscription." };
}

export async function confirm(token: string) {
  const sub = await prisma.newsletterSubscriber.findFirst({ where: { token } });
  if (!sub) return false;
  await prisma.newsletterSubscriber.update({ where: { id: sub.id }, data: { isActive: true, confirmedAt: new Date(), token: null } });
  return true;
}

export async function unsubscribe(email: string) {
  await prisma.newsletterSubscriber.updateMany({ where: { email }, data: { isActive: false } });
}

export async function getSubscribers(skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
    prisma.newsletterSubscriber.count(),
  ]);
  return { data, total };
}
