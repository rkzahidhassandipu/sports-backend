// src/modules/support/support.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { emailService } from "../../lib/email";

const TICKET_INCLUDE = {
  user: { select: { id: true, name: true, email: true, avatar: true } },
  replies: { orderBy: { createdAt: "asc" as const } },
};

export async function createTicket(userId: string, data: { subject: string; message: string; priority?: string }) {
  return prisma.supportTicket.create({ data: { userId, ...data } as any, include: TICKET_INCLUDE });
}

export async function getMyTickets(userId: string, skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.supportTicket.findMany({ where: { userId }, include: TICKET_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.supportTicket.count({ where: { userId } }),
  ]);
  return { data, total };
}

export async function getTicket(id: string, userId: string, role: string) {
  const t = await prisma.supportTicket.findUnique({ where: { id }, include: TICKET_INCLUDE });
  if (!t) throw AppError.notFound("Ticket not found");
  if (t.userId !== userId && !["ADMIN", "RECEPTIONIST", "COACH"].includes(role)) throw AppError.forbidden("Access denied");
  return t;
}

export async function replyTicket(id: string, senderId: string, message: string, isStaff: boolean) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { user: true } });
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (ticket.status === "CLOSED") throw AppError.badRequest("Ticket is closed");

  const reply = await prisma.ticketReply.create({ data: { ticketId: id, senderId, message, isStaff } });

  // Move to IN_PROGRESS if staff replies
  if (isStaff && ticket.status === "OPEN") {
    await prisma.supportTicket.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    await emailService.ticketUpdate(ticket.user.email, ticket.user.name, id, "In Progress");
  }
  return reply;
}

export async function updateStatus(id: string, status: string, assignedTo?: string) {
  const t = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: status as any,
      assignedTo,
      ...(status === "RESOLVED" && { resolvedAt: new Date() }),
    },
    include: { user: true },
  });
  await emailService.ticketUpdate(t.user.email, t.user.name, id, status);
  return t;
}

export async function closeTicket(id: string, userId: string, role: string) {
  const t = await prisma.supportTicket.findUnique({ where: { id } });
  if (!t) throw AppError.notFound("Ticket not found");
  if (t.userId !== userId && !["ADMIN"].includes(role)) throw AppError.forbidden("Access denied");
  return prisma.supportTicket.update({ where: { id }, data: { status: "CLOSED" } });
}

export async function getAllTickets(skip: number, take: number, status?: string) {
  const where: any = {};
  if (status) where.status = status;
  const [data, total] = await prisma.$transaction([
    prisma.supportTicket.findMany({ where, include: TICKET_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.supportTicket.count({ where }),
  ]);
  return { data, total };
}

export async function deleteTicket(id: string) {
  const t = await prisma.supportTicket.findUnique({ where: { id } });
  if (!t) throw AppError.notFound("Ticket not found");
  await prisma.supportTicket.delete({ where: { id } });
}
