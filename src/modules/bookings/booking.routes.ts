// src/modules/bookings/booking.routes.ts
import { Router } from "express";
import { authenticate, isAdmin, isStaff } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createBookingSchema, updateBookingSchema, cancelBookingSchema } from "../../utils/validators";
import * as ctrl from "./booking.controller";

const router = Router();
router.use(authenticate);

// Member routes
router.post("/",          validate(createBookingSchema), ctrl.createBooking);
router.get  ("/my",                                      ctrl.getMyBookings);
router.get  ("/:id",                                     ctrl.getBooking);
router.post ("/:id/cancel", validate(cancelBookingSchema), ctrl.cancelBooking);
router.post ("/:id/checkout",                            ctrl.createCheckout);

// Staff routes
router.get  ("/",          isStaff, ctrl.getAllBookings);
router.patch("/:id/status", isStaff, validate(updateBookingSchema), ctrl.updateStatus);

// Stripe webhook (raw body — mounted before json middleware in app.ts)
router.post("/webhook/stripe", ctrl.stripeWebhook);

export default router;
