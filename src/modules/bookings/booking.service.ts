// src/modules/bookings/booking.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { createCheckoutSession, constructWebhookEvent } from "../../config/stripe";
import { emailService } from "../../lib/email";
import { notify, audit } from "../../lib/audit";
import Stripe from "stripe";

const BOOKING_INCLUDE = {
  session: { include: { coach: { select: { id: true, name: true, avatar: true } } } },
  payments: { select: { id: true, amount: true, status: true, method: true, paidAt: true } },
  user: { select: { id: true, name: true, email: true, avatar: true } },
};

export async function createBooking(userId: string, data: { sessionId: string; notes?: string }) {
  const session = await prisma.session.findUnique({ where: { id: data.sessionId } });
  if (!session) throw AppError.notFound("Session not found");
  if (session.status === "CANCELLED") throw AppError.badRequest("Session is cancelled");
  if (session.status === "COMPLETED") throw AppError.badRequest("Session already completed");

  // Check capacity
  const booked = await prisma.booking.count({
    where: { sessionId: data.sessionId, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (booked >= session.capacity) throw AppError.conflict("Session is fully booked");

  // Prevent duplicate
  const existing = await prisma.booking.findUnique({
    where: { userId_sessionId: { userId, sessionId: data.sessionId } },
  });
  if (existing) throw AppError.conflict("You have already booked this session");

  const booking = await prisma.booking.create({
    data: { userId, sessionId: data.sessionId, notes: data.notes, totalAmount: session.price } as any,
    include: BOOKING_INCLUDE,
  });

  await notify(userId, "Booking Created", `Your booking for "${session.title}" is pending payment.`, "BOOKING", `/bookings/${booking.id}`);
  return booking;
}

export async function getMyBookings(userId: string, skip: number, take: number, status?: string) {
  const where: any = { userId };
  if (status) where.status = status;
  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { session: { include: { coach: { select: { id: true, name: true } } } }, payments: true },
      orderBy: { createdAt: "desc" }, skip, take,
    }),
    prisma.booking.count({ where }),
  ]);
  return { data, total };
}

export async function getBooking(id: string, userId: string, role: string) {
  const b = await prisma.booking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
  if (!b) throw AppError.notFound("Booking not found");
  if (b.userId !== userId && !["ADMIN", "COACH", "TRAINER", "RECEPTIONIST"].includes(role)) {
    throw AppError.forbidden("Access denied");
  }
  return b;
}

export async function cancelBooking(id: string, userId: string, role: string, reason?: string) {
  const b = await prisma.booking.findUnique({ where: { id }, include: { session: true } });
  if (!b) throw AppError.notFound("Booking not found");
  if (b.userId !== userId && !["ADMIN", "RECEPTIONIST"].includes(role)) throw AppError.forbidden("Access denied");
  if (b.status === "CANCELLED") throw AppError.badRequest("Already cancelled");
  if (b.status === "COMPLETED") throw AppError.badRequest("Cannot cancel a completed booking");

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", paymentStatus: "PENDING", cancelledAt: new Date(), cancelReason: reason },
  });

  await notify(userId, "Booking Cancelled", `Your booking for "${b.session.title}" has been cancelled.`, "BOOKING");
}

export async function getAllBookings(skip: number, take: number, filters: { status?: string; sessionId?: string; userId?: string }) {
  const where: any = {};
  if (filters.status)    where.status    = filters.status;
  if (filters.sessionId) where.sessionId = filters.sessionId;
  if (filters.userId)    where.userId    = filters.userId;

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({ where, include: BOOKING_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.booking.count({ where }),
  ]);
  return { data, total };
}

export async function updateStatus(id: string, status: string, reason?: string) {
  const b = await prisma.booking.findUnique({ where: { id }, include: { session: true, user: true } });
  if (!b) throw AppError.notFound("Booking not found");

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: status as any,
      ...(status === "CONFIRMED"  && { confirmedAt: new Date() }),
      ...(status === "CANCELLED"  && { cancelledAt: new Date(), cancelReason: reason }),
    },
    include: BOOKING_INCLUDE,
  });

  await notify(b.userId, `Booking ${status}`, `Your booking for "${b.session.title}" is now ${status.toLowerCase()}.`, "BOOKING");
  return updated;
}

export async function createCheckout(bookingId: string, userId: string) {
  const b = await prisma.booking.findFirst({ where: { id: bookingId, userId }, include: { session: true } });
  if (!b) throw AppError.notFound("Booking not found");
  if (b.paymentStatus === "PAID") throw AppError.badRequest("Already paid");

  const session = await createCheckoutSession({
    userId,
    bookingId,
    name: b.session.title,
    description: `${b.session.date.toDateString()} — ${b.session.startTime}`,
    amount: Number(b.session.price),
    quantity: 1,
    successUrl: `${process.env.CLIENT_URL}/bookings/${bookingId}?payment=success`,
    cancelUrl:  `${process.env.CLIENT_URL}/bookings/${bookingId}?payment=cancelled`,
  });

  return { checkoutUrl: session.url, sessionId: session.id };
}

export async function handleStripeWebhook(payload: Buffer, sig: string) {
  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, sig);
  } catch {
    throw AppError.badRequest("Webhook signature verification failed");
  }

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const bookingId = cs.metadata?.bookingId;
    const userId    = cs.metadata?.userId;
    if (!bookingId || !userId) return;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { session: true, user: true } });
    if (!booking) return;

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", paymentStatus: "PAID", confirmedAt: new Date() },
      }),
      prisma.payment.create({
        data: {
          bookingId,
          userId,
          amount: (cs.amount_total || 0) / 100,
          currency: cs.currency || "usd",
          method: "STRIPE",
          status: "PAID",
          stripeSessionId: cs.id,
          stripePaymentId: cs.payment_intent as string,
          paidAt: new Date(),
          invoiceNumber: `INV-${Date.now()}`,
          description: `Payment for ${booking.session.title}`,
        },
      }),
    ]);

    await emailService.bookingConfirmed(booking.user.email, booking.user.name, {
      session:  booking.session.title,
      date:     booking.session.date.toDateString(),
      time:     `${booking.session.startTime} – ${booking.session.endTime}`,
      location: booking.session.location ?? undefined,
      amount:   `$${Number(booking.session.price).toFixed(2)}`,
    });

    await notify(userId, "Payment Successful", `Payment for "${booking.session.title}" confirmed.`, "PAYMENT", `/bookings/${bookingId}`);
  }
}
