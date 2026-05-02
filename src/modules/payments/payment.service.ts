// src/modules/payments/payment.service.ts
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { createRefund, stripe } from "../../config/stripe";

const PAYMENT_INCLUDE = {
  booking: {
    include: {
      session: { select: { title: true, date: true, startTime: true } },
    },
  },
  user: { select: { id: true, name: true, email: true } },
};

export async function getMyPayments(
  userId: string,
  skip: number,
  take: number,
) {
  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where: { userId },
      include: {
        booking: {
          include: { session: { select: { title: true, date: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where: { userId } }),
  ]);
  return { data, total };
}

export async function getPayment(id: string, userId: string, role: string) {
  const p = await prisma.payment.findUnique({
    where: { id },
    include: PAYMENT_INCLUDE,
  });
  if (!p) throw AppError.notFound("Payment not found");
  if (p.userId !== userId && !["ADMIN", "RECEPTIONIST"].includes(role))
    throw AppError.forbidden("Access denied");
  return p;
}

export async function getAllPayments(
  skip: number,
  take: number,
  filters: { status?: string; method?: string },
) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.method) where.method = filters.method;
  const [data, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: PAYMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
  ]);
  return { data, total };
}

export async function refundPayment(id: string, amount?: number) {
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) throw AppError.notFound("Payment not found");
  if (p.status !== "PAID")
    throw AppError.badRequest("Only paid payments can be refunded");
  if (!p.stripePaymentId) throw AppError.badRequest("No Stripe payment ID");

  const refund = await createRefund(p.stripePaymentId, amount);
  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: "REFUNDED",
      refundId: refund.id,
      refundAmount: amount ?? Number(p.amount),
    },
  });

  // Update booking
  if (p.bookingId) {
    await prisma.booking.update({
      where: { id: p.bookingId },
      data: { paymentStatus: "REFUNDED" },
    });
  }
  return updated;
}


export async function createCheckoutSession(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { session: true },
  });
  if (!booking) throw AppError.notFound("Booking not found");

  const price = Number(booking.session.price);

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: Math.round(price * 100), // cents
        product_data: {
          name: booking.session.title,
        },
      },
      quantity: 1,
    }],
    metadata: { bookingId, userId },
    success_url: `${process.env.CLIENT_URL}/booking/success?bookingId=${bookingId}`,
    cancel_url:  `${process.env.CLIENT_URL}/booking/cancel?bookingId=${bookingId}`,
  });

  // Payment record create করো
  await prisma.payment.create({
    data: {
      userId,
      bookingId,
      amount:          price,
      currency:        "USD",
      method:          "STRIPE",
      status:          "PENDING",
      stripePaymentId: checkoutSession.payment_intent as string,
    },
  });

  return { url: checkoutSession.url };
}
export async function getPaymentStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [totalRev, monthRev, lastMonthRev, byMethod, recent] =
    await prisma.$transaction([
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: { method: true },
        orderBy: {
          method: "asc", // ✅ required
        },
      }),
      prisma.payment.findMany({
        where: { status: "PAID" },
        include: PAYMENT_INCLUDE,
        orderBy: { paidAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    totalRevenue: totalRev._sum.amount ?? 0,
    totalTransactions: totalRev._count,
    monthlyRevenue: monthRev._sum.amount ?? 0,
    monthlyTransactions: monthRev._count,
    lastMonthRevenue: lastMonthRev._sum.amount ?? 0,
    revenueGrowth: lastMonthRev._sum.amount
      ? (
          ((Number(monthRev._sum.amount) - Number(lastMonthRev._sum.amount)) /
            Number(lastMonthRev._sum.amount)) *
          100
        ).toFixed(1)
      : null,
    byMethod,
    recentPayments: recent,
  };
}

export async function generateInvoiceData(id: string, userId: string) {
  const p = await prisma.payment.findFirst({
    where: { id, userId },
    include: {
      booking: {
        include: {
          session: { include: { coach: { select: { name: true } } } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!p) throw AppError.notFound("Payment not found");

  return {
    invoiceNumber: p.invoiceNumber ?? `INV-${p.id.slice(-8).toUpperCase()}`,
    date: p.paidAt ?? p.createdAt,
    customer: p.user,
    session: p.booking?.session,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
  };
}
