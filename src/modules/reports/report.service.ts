// src/modules/reports/report.service.ts
import { prisma } from "../../config/database";

function periodStart(p: string): Date {
  const d = new Date();
  if (p === "7d")  { d.setDate(d.getDate() - 7);   return d; }
  if (p === "90d") { d.setDate(d.getDate() - 90);   return d; }
  if (p === "1y")  { d.setFullYear(d.getFullYear() - 1); return d; }
  d.setDate(d.getDate() - 30); // default 30d
  return d;
}

function growth(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return +((( current - prev) / prev) * 100).toFixed(1);
}

export async function getOverview() {
  const now   = new Date();
  const som   = new Date(now.getFullYear(), now.getMonth(), 1);
  const solm  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const eolm  = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalMembers, newThisMonth, newLastMonth,
    totalSessions, activeSessions,
    totalBookings, bookingsThisMonth, bookingsLastMonth,
    revenueThis, revenueLast,
    openTickets,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: som } } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: solm, lte: eolm } } }),
    prisma.session.count(),
    prisma.session.count({ where: { status: { in: ["SCHEDULED", "ACTIVE"] } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: som } } }),
    prisma.booking.count({ where: { createdAt: { gte: solm, lte: eolm } } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: som } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: solm, lte: eolm } }, _sum: { amount: true } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  const rev  = Number(revenueThis._sum.amount ?? 0);
  const revL = Number(revenueLast._sum.amount ?? 0);

  return {
    kpis: {
      members:        { value: totalMembers,   growth: growth(newThisMonth, newLastMonth), thisMonth: newThisMonth },
      sessions:       { value: totalSessions,  active: activeSessions },
      bookings:       { value: totalBookings,  growth: growth(bookingsThisMonth, bookingsLastMonth), thisMonth: bookingsThisMonth },
      revenue:        { value: rev,            growth: growth(rev, revL), formatted: `$${rev.toFixed(2)}` },
      openTickets:    { value: openTickets },
    },
  };
}

export async function getRevenueChart(period: string) {
  const since = periodStart(period);
  const rows = await prisma.payment.findMany({
    where: { status: "PAID", paidAt: { gte: since } },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });
  const map: Record<string, number> = {};
  rows.forEach(r => {
    if (!r.paidAt) return;
    const k = r.paidAt.toISOString().slice(0, 10);
    map[k] = (map[k] ?? 0) + Number(r.amount);
  });
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue: +revenue.toFixed(2) }));
}

export async function getBookingsChart(period: string) {
  const since = periodStart(period);
  const rows  = await prisma.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } });
  const map: Record<string, { date: string; total: number; confirmed: number; cancelled: number }> = {};
  rows.forEach(r => {
    const k = r.createdAt.toISOString().slice(0, 10);
    if (!map[k]) map[k] = { date: k, total: 0, confirmed: 0, cancelled: 0 };
    map[k].total++;
    if (r.status === "CONFIRMED") map[k].confirmed++;
    if (r.status === "CANCELLED") map[k].cancelled++;
  });
  return Object.values(map);
}

export async function getMembersChart(period: string) {
  const since = periodStart(period);
  const rows  = await prisma.user.findMany({ where: { role: "MEMBER", createdAt: { gte: since } }, select: { createdAt: true } });
  const map: Record<string, number> = {};
  rows.forEach(r => { const k = r.createdAt.toISOString().slice(0, 10); map[k] = (map[k] ?? 0) + 1; });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

export async function getSessionsChart() {
  const rows = await prisma.session.groupBy({ by: ["category"], _count: { category: true } });
  return rows.map(r => ({ category: r.category || "Other", count: r._count.category }));
}

export async function getBookingsTable(skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      include: {
        user:    { select: { id: true, name: true, email: true, avatar: true } },
        session: { select: { id: true, title: true, date: true, startTime: true } },
        payments: { select: { status: true, amount: true, method: true } },
      },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.booking.count(),
  ]);
  return { data, total };
}

export async function getUsersTable(skip: number, take: number, search?: string) {
  const where: any = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, avatar: true, createdAt: true, lastLoginAt: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.user.count({ where }),
  ]);
  return { data, total };
}

export async function getPaymentsTable(skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, booking: { include: { session: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.payment.count(),
  ]);
  return { data, total };
}

export async function getAuditLogs(skip: number, take: number, action?: string, userId?: string) {
  const where: any = {};
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (userId) where.userId = userId;
  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { data, total };
}

export async function getActivityLogs(skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.activityLog.count(),
  ]);
  return { data, total };
}

export async function getReports(skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
    prisma.report.count(),
  ]);
  return { data, total };
}

export async function generateReport(type: string, period: string, generatedBy: string) {
  let data: unknown;
  if (type === "FINANCE")  data = await getRevenueChart(period);
  else if (type === "ACTIVITY") data = await getBookingsChart(period);
  else data = await getOverview();

  return prisma.report.create({
    data: { type: type as any, title: `${type} Report — ${period}`, data: data as any, period, generatedBy },
  });
}
