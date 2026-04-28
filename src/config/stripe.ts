// src/config/stripe.ts
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY environment variable. Copy .env.example to .env and set STRIPE_SECRET_KEY before starting the app."
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  maxNetworkRetries: 3,
});

export async function createCheckoutSession(opts: {
  userId: string;
  bookingId: string;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: opts.currency || process.env.STRIPE_CURRENCY || "usd",
        product_data: { name: opts.name, ...(opts.description && { description: opts.description }) },
        unit_amount: Math.round(opts.amount * 100),
      },
      quantity: opts.quantity,
    }],
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url:  opts.cancelUrl,
    metadata: { userId: opts.userId, bookingId: opts.bookingId },
    payment_intent_data: { metadata: { userId: opts.userId, bookingId: opts.bookingId } },
  });
}

export function constructWebhookEvent(payload: Buffer, sig: string) {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
}

export async function createRefund(paymentIntentId: string, amount?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount: Math.round(amount * 100) }),
  });
}
