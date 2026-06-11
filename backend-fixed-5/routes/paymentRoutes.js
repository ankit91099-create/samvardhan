/**
 * routes/paymentRoutes.js
 *
 * Public (no auth):
 *   POST /api/payments/create-order  — initiate Razorpay order
 *   POST /api/payments/verify        — verify payment signature
 *   POST /api/payments/webhook       — Razorpay server-to-server webhook
 *
 * Admin (JWT required):
 *   GET   /api/admin/payments
 *   GET   /api/admin/payments/stats
 *   POST  /api/admin/payments        — manual cash/cheque entry
 *   PATCH /api/admin/payments/:id
 */

const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

// ── Public router ─────────────────────────────────────────────────────────────
const publicRouter = express.Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many payment requests. Please try again later." },
});

const createOrderValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least ₹1"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("phone").matches(/^[6-9]\d{9}$/).withMessage("Valid 10-digit Indian phone number required"),
  body("email").optional().isEmail().withMessage("Valid email required"),
];

const verifyValidation = [
  body("razorpay_order_id").notEmpty().withMessage("Order ID required"),
  body("razorpay_payment_id").notEmpty().withMessage("Payment ID required"),
  body("razorpay_signature").notEmpty().withMessage("Signature required"),
];

publicRouter.post("/create-order", paymentLimiter, createOrderValidation, validate, paymentController.createOrder);
publicRouter.post("/verify", paymentLimiter, verifyValidation, validate, paymentController.verifyPayment);
// Webhook — raw body needed for signature verification
publicRouter.post("/webhook", express.raw({ type: "application/json" }), paymentController.handleWebhook);

// ── Admin router ──────────────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(protect);

adminRouter.get("/stats", paymentController.getPaymentStats);
adminRouter.get("/",      paymentController.getAllPayments);
adminRouter.post("/",     paymentController.createPayment);
adminRouter.patch("/:id", paymentController.updatePayment);

module.exports = { publicRouter, adminRouter };
