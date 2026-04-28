// src/lib/audit.ts
import { Request } from "express";
import { prisma } from "../config/database";
import { logger } from "../config/logger";

export async function audit(opts: {
  userId?: string; action: string; resource: string;
  resourceId?: string; oldData?: unknown; newData?: unknown; req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     opts.userId,
        action:     opts.action,
        resource:   opts.resource,
        resourceId: opts.resourceId,
        oldData:    opts.oldData  ? (opts.oldData  as object) : undefined,
        newData:    opts.newData  ? (opts.newData  as object) : undefined,
        ipAddress:  opts.req?.ip,
        userAgent:  opts.req?.get("user-agent"),
      },
    });
  } catch (e) { logger.error("Audit log failed:", e); }
}

export async function activity(userId: string, description: string, type: string, req?: Request, metadata?: unknown) {
  try {
    await prisma.activityLog.create({
      data: { userId, description, type, ipAddress: req?.ip, metadata: metadata as object | undefined },
    });
  } catch (e) { logger.error("Activity log failed:", e); }
}

export async function notify(userId: string, title: string, message: string, type: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, title, message, type, link } });
  } catch (e) { logger.error("Notification failed:", e); }
}
