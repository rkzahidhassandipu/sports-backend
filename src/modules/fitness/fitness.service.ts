// src/modules/fitness/fitness.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export async function createRecord(data: any, trainerId: string) {
  // Auto-calc BMI if weight+height provided
  let bmi: number | undefined;
  if (data.weight && data.height) {
    const hm = data.height / 100;
    bmi = parseFloat((data.weight / (hm * hm)).toFixed(2));
  }
  return prisma.fitnessRecord.create({
    data: { ...data, trainerId, bmi },
    include: {
      member:  { select: { id: true, name: true, avatar: true } },
      trainer: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function getMyRecords(memberId: string, skip: number, take: number, type?: string) {
  const where: any = { memberId };
  if (type) where.recordType = type;
  const [data, total] = await prisma.$transaction([
    prisma.fitnessRecord.findMany({
      where, include: { trainer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { date: "desc" }, skip, take,
    }),
    prisma.fitnessRecord.count({ where }),
  ]);
  return { data, total };
}

export async function getMemberRecords(memberId: string, skip: number, take: number) {
  const user = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, name: true, avatar: true } });
  if (!user) throw AppError.notFound("Member not found");
  const [data, total] = await prisma.$transaction([
    prisma.fitnessRecord.findMany({
      where: { memberId }, include: { trainer: { select: { id: true, name: true } } },
      orderBy: { date: "desc" }, skip, take,
    }),
    prisma.fitnessRecord.count({ where: { memberId } }),
  ]);
  return { member: user, data, total };
}

export async function updateRecord(id: string, data: any, trainerId: string, role: string) {
  const record = await prisma.fitnessRecord.findUnique({ where: { id } });
  if (!record) throw AppError.notFound("Record not found");
  if (record.trainerId !== trainerId && role !== "ADMIN") throw AppError.forbidden("Not authorized");
  return prisma.fitnessRecord.update({ where: { id }, data });
}

export async function deleteRecord(id: string, trainerId: string, role: string) {
  const record = await prisma.fitnessRecord.findUnique({ where: { id } });
  if (!record) throw AppError.notFound("Record not found");
  if (record.trainerId !== trainerId && role !== "ADMIN") throw AppError.forbidden("Not authorized");
  await prisma.fitnessRecord.delete({ where: { id } });
}

export async function getPerformanceReport(memberId: string) {
  const records = await prisma.fitnessRecord.findMany({
    where: { memberId },
    orderBy: { date: "asc" },
  });

  const byType: Record<string, any[]> = {};
  records.forEach(r => {
    if (!byType[r.recordType]) byType[r.recordType] = [];
    byType[r.recordType].push({ date: r.date, data: r.data, weight: r.weight, bmi: r.bmi });
  });

  // Weight trend
  const weightTrend = records.filter(r => r.weight).map(r => ({ date: r.date, weight: Number(r.weight) }));

  const member = await prisma.user.findUnique({
    where: { id: memberId }, select: { name: true, avatar: true },
  });

  return { member, totalRecords: records.length, byType, weightTrend, lastUpdated: records.at(-1)?.date };
}

export async function getMyProgress(memberId: string) {
  const records = await prisma.fitnessRecord.findMany({
    where: { memberId }, orderBy: { date: "desc" }, take: 30,
  });

  const latest = records[0];
  const previous = records.find(r => r.recordType === latest?.recordType && r.id !== latest?.id);

  return {
    latest,
    previous,
    totalSessions: await prisma.booking.count({ where: { userId: memberId, status: "COMPLETED" } }),
    streak: records.length,
  };
}

export async function getTrainerSummary(trainerId: string) {
  const [totalRecords, members, recentRecords] = await prisma.$transaction([
    prisma.fitnessRecord.count({ where: { trainerId } }),
    prisma.fitnessRecord.groupBy({ by: ["memberId"], where: { trainerId }, _count: { memberId: true } }),
    prisma.fitnessRecord.findMany({
      where: { trainerId }, take: 10, orderBy: { createdAt: "desc" },
      include: { member: { select: { id: true, name: true, avatar: true } } },
    }),
  ]);
  return { totalRecords, uniqueMembers: members.length, recentRecords };
}
