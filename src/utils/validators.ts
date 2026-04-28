// src/utils/validators.ts
import { z } from "zod";

const password = z
  .string().min(8).max(128)
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/[0-9]/, "Must contain digit")
  .regex(/[^A-Za-z0-9]/, "Must contain special character");

// ── Auth ──────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password,
  phone:    z.string().optional(),
  role:     z.enum(["MEMBER"]).default("MEMBER"),
});

export const loginSchema = z.object({
  email:      z.string().email(),
  password:   z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export const forgotPasswordSchema  = z.object({ email: z.string().email() });
export const resetPasswordSchema   = z.object({ token: z.string().min(1), password });
export const changePasswordSchema  = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const verifyEmailSchema     = z.object({ token: z.string().min(1) });
export const resendVerifySchema    = z.object({ email: z.string().email() });

// ── Users ─────────────────────────────────────────────────────────
export const updateUserSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio:   z.string().max(500).optional(),
});

export const updateProfileSchema = z.object({
  address:          z.string().optional(),
  city:             z.string().optional(),
  country:          z.string().optional(),
  dateOfBirth:      z.coerce.date().optional(),
  gender:           z.string().optional(),
  emergencyContact: z.string().optional(),
  specializations:  z.array(z.string()).optional(),
  certifications:   z.array(z.string()).optional(),
});

export const assignRoleSchema = z.object({
  role: z.enum(["ADMIN","COACH","TRAINER","RECEPTIONIST","MEMBER"]),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE","INACTIVE","SUSPENDED","DELETED"]),
});

// ── Sessions ──────────────────────────────────────────────────────
export const createSessionSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().optional(),
  date:        z.coerce.date(),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  duration:    z.coerce.number().int().min(10),
  capacity:    z.coerce.number().int().min(1).default(10),
  location:    z.string().optional(),
  price:       z.coerce.number().min(0),
  category:    z.string().optional(),
  level:       z.string().optional(),
  equipment:   z.array(z.string()).default([]),
});

export const updateSessionSchema  = createSessionSchema.partial();
export const sessionStatusSchema  = z.object({ status: z.enum(["ACTIVE","COMPLETED","CANCELLED","SCHEDULED"]) });

// ── Bookings ──────────────────────────────────────────────────────
export const createBookingSchema  = z.object({ sessionId: z.string().cuid(), notes: z.string().max(500).optional() });
export const updateBookingSchema  = z.object({ status: z.enum(["CONFIRMED","CANCELLED","COMPLETED","NO_SHOW"]), reason: z.string().optional() });
export const cancelBookingSchema  = z.object({ reason: z.string().max(500).optional() });

// ── Fitness ───────────────────────────────────────────────────────
export const createFitnessSchema = z.object({
  memberId:   z.string().cuid(),
  recordType: z.string().min(1),
  date:       z.coerce.date().default(() => new Date()),
  data:       z.record(z.unknown()),
  notes:      z.string().optional(),
  weight:     z.coerce.number().optional(),
  height:     z.coerce.number().optional(),
  bodyFat:    z.coerce.number().optional(),
  goals:      z.record(z.unknown()).optional(),
});

export const updateFitnessSchema = createFitnessSchema.partial().omit({ memberId: true });

// ── Blog ──────────────────────────────────────────────────────────
export const createBlogSchema = z.object({
  title:      z.string().min(3).max(255),
  excerpt:    z.string().max(500).optional(),
  content:    z.string().min(10),
  coverImage: z.string().url().optional(),
  tags:       z.array(z.string()).default([]),
  published:  z.boolean().default(false),
});
export const updateBlogSchema = createBlogSchema.partial();

// ── Support ───────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  subject:  z.string().min(5).max(255),
  message:  z.string().min(10).max(5000),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
});
export const replyTicketSchema       = z.object({ message: z.string().min(1).max(5000) });
export const updateTicketStatusSchema = z.object({
  status:     z.enum(["OPEN","IN_PROGRESS","RESOLVED","CLOSED"]),
  assignedTo: z.string().cuid().optional(),
});

// ── Review ────────────────────────────────────────────────────────
export const createReviewSchema = z.object({
  rating:  z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// ── Newsletter / Contact ──────────────────────────────────────────
export const newsletterSchema = z.object({ email: z.string().email(), name: z.string().optional() });
export const contactSchema    = z.object({
  name:    z.string().min(2).max(100),
  email:   z.string().email(),
  phone:   z.string().optional(),
  subject: z.string().min(3).max(255),
  message: z.string().min(10).max(5000),
});

// ── Pagination ────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(10),
  sortBy:    z.string().optional(),
  sortOrder: z.enum(["asc","desc"]).default("desc"),
  search:    z.string().optional(),
});
