// src/modules/sessions/session.service.ts
import slugify from "slugify";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { uploadToCloudinary } from "../../config/cloudinary";
import { buildSearch } from "../../utils/pagination";
import { notify } from "../../lib/audit";

const SESSION_INCLUDE = {
  coach: { select: { id: true, name: true, avatar: true, bio: true } },
  _count: { select: { bookings: true, reviews: true } },
};

export async function getSessions(opts: { skip: number; take: number; orderBy: object }, filters: {
  search?: string; category?: string; level?: string; status?: string; coachId?: string;
  minPrice?: number; maxPrice?: number; dateFrom?: string; dateTo?: string;
}) {
  const where: any = {};
  if (!filters.status) where.status = { in: ["SCHEDULED", "ACTIVE"] };
  else where.status = filters.status;

  if (filters.search) Object.assign(where, buildSearch(filters.search, ["title", "description", "category"]));
  if (filters.category) where.category = { contains: filters.category, mode: "insensitive" };
  if (filters.level)    where.level    = filters.level;
  if (filters.coachId)  where.coachId  = filters.coachId;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }
  if (filters.dateFrom) where.date = { ...where.date, gte: new Date(filters.dateFrom) };
  if (filters.dateTo)   where.date = { ...where.date, lte: new Date(filters.dateTo) };

  const [data, total] = await prisma.$transaction([
    prisma.session.findMany({ where, include: SESSION_INCLUDE, ...opts }),
    prisma.session.count({ where }),
  ]);
  return { data, total };
}

export async function getSession(id: string) {
  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      ...SESSION_INCLUDE,
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        take: 5, orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!s) throw AppError.notFound("Session not found");
  return s;
}

export async function getMySessions(coachId: string, skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.session.findMany({
      where: { coachId },
      include: { _count: { select: { bookings: true, reviews: true } } },
      orderBy: { date: "desc" }, skip, take,
    }),
    prisma.session.count({ where: { coachId } }),
  ]);
  return { data, total };
}

export async function createSession(data: any, coachId: string) {
  return prisma.session.create({
    data: { ...data, coachId },
    include: SESSION_INCLUDE,
  });
}

export async function updateSession(id: string, data: any, userId: string, role: string) {
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) throw AppError.notFound("Session not found");
  if (s.coachId !== userId && role !== "ADMIN") throw AppError.forbidden("Not authorized to edit this session");
  return prisma.session.update({ where: { id }, data, include: SESSION_INCLUDE });
}

export async function updateStatus(id: string, status: string) {
  const s = await prisma.session.update({ where: { id }, data: { status: status as any }, include: SESSION_INCLUDE });

  if (status === "CANCELLED") {
    // Notify all booked members
    const bookings = await prisma.booking.findMany({
      where: { sessionId: id, status: { not: "CANCELLED" } },
      include: { user: { select: { email: true, name: true } } },
    });
    await prisma.booking.updateMany({ where: { sessionId: id }, data: { status: "CANCELLED" } });
    for (const b of bookings) {
      await notify(b.userId, "Session Cancelled", `"${s.title}" has been cancelled.`, "SESSION_CANCELLED", `/sessions`);
    }
  }
  return s;
}

export async function uploadCover(id: string, buffer: Buffer) {
  const result = await uploadToCloudinary(buffer, "sessions");
  return prisma.session.update({ where: { id }, data: { coverImage: result.url } });
}
export async function deleteSession(id: string) {
  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) throw AppError.notFound("Session not found");
  const hasBookings = await prisma.booking.count({ where: { sessionId: id, status: "CONFIRMED" } });
  if (hasBookings > 0) throw AppError.conflict("Cannot delete session with active bookings");
  await prisma.session.delete({ where: { id } });
}

export async function getSessionReviews(sessionId: string, skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { sessionId, isHidden: false },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.review.count({ where: { sessionId, isHidden: false } }),
  ]);
  // avg rating
  const agg = await prisma.review.aggregate({ where: { sessionId }, _avg: { rating: true } });
  return { data, total, avgRating: agg._avg.rating ?? 0 };
}

export async function createReview(sessionId: string, userId: string, data: { rating: number; comment?: string }) {
  const booked = await prisma.booking.findFirst({ where: { userId, sessionId, status: "COMPLETED" } });
  if (!booked) throw AppError.forbidden("You can only review sessions you have completed");
  const exists = await prisma.review.findUnique({ where: { userId_sessionId: { userId, sessionId } } });
  if (exists) throw AppError.conflict("You have already reviewed this session");
  return prisma.review.create({ data: { userId, sessionId, ...data } });
}

export async function searchSessions(q: string, skip: number, take: number) {
  const where = q ? buildSearch(q, ["title", "description", "category", "location"]) : {};
  const [data, total] = await prisma.$transaction([
    prisma.session.findMany({
      where: { ...where, status: { in: ["SCHEDULED", "ACTIVE"] } },
      include: SESSION_INCLUDE, skip, take,
    }),
    prisma.session.count({ where: { ...where, status: { in: ["SCHEDULED", "ACTIVE"] } } }),
  ]);
  return { data, total };
}
