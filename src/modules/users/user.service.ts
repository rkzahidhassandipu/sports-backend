// src/modules/users/user.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { uploadToCloudinary } from "../../config/cloudinary";
import { buildSearch } from "../../utils/pagination";

const SAFE = {
  id: true, name: true, email: true, emailVerified: true,
  avatar: true, phone: true, bio: true, role: true, status: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
};

export async function getProfile(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { ...SAFE, profile: true } });
  if (!u) throw AppError.notFound("User not found");
  return u;
}

export async function updateProfile(userId: string, data: object) {
  return prisma.user.update({ where: { id: userId }, data, select: SAFE });
}

export async function updateProfileDetails(userId: string, data: object) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...(data as any) },
    update: data,
  });
}

export async function uploadAvatar(userId: string, buffer: Buffer) {
  const result = await uploadToCloudinary(buffer, "avatars", "image");
  return prisma.user.update({ where: { id: userId }, data: { avatar: result.url }, select: SAFE });
}

export async function deleteOwnAccount(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { status: "DELETED", email: `deleted_${Date.now()}_${userId}@deleted.com` } });
}

export async function getNotifications(userId: string, skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { data, total };
}

export async function markRead(id: string, userId: string) {
  await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}

export async function getActivityLog(userId: string, skip: number, take: number) {
  const [data, total] = await prisma.$transaction([
    prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.activityLog.count({ where: { userId } }),
  ]);
  return { data, total };
}

// Admin
export async function getAllUsers(opts: { skip: number; take: number; orderBy: object }, filters: { search?: string; role?: string; status?: string }) {
  const where: any = {};
  if (filters.search) Object.assign(where, buildSearch(filters.search, ["name", "email"]));
  if (filters.role)   where.role   = filters.role;
  if (filters.status) where.status = filters.status;

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: { ...SAFE, _count: { select: { bookings: true } } }, ...opts }),
    prisma.user.count({ where }),
  ]);
  return { data, total };
}

export async function getUserById(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: { ...SAFE, profile: true, _count: { select: { bookings: true, reviews: true, fitnessRecords: true } } },
  });
  if (!u) throw AppError.notFound("User not found");
  return u;
}

export async function assignRole(id: string, role: string) {
  return prisma.user.update({ where: { id }, data: { role: role as any }, select: SAFE });
}

export async function updateStatus(id: string, status: string) {
  return prisma.user.update({ where: { id }, data: { status: status as any }, select: SAFE });
}

export async function deleteUser(id: string) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw AppError.notFound("User not found");
  await prisma.user.delete({ where: { id } });
}
