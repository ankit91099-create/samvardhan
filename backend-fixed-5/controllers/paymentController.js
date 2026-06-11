/**
 * controllers/paymentController.js
 * Razorpay payment integration + admin payment management.
 *
 * Flow:
 *  1. Client calls POST /api/payments/create-order  → gets Razorpay order_id
 *  2. Client opens Razorpay checkout
 *  3. On success, client calls POST /api/payments/verify  → server verifies HMAC
 *  4. Razorpay sends webhook → POST /api/payments/webhook (optional but recommended)
 *
 * Admin:
 *  - GET  /api/admin/payments
 *  - POST /api/admin/payments        (manual cash/cheque entry)
 *  - PATCH /api/admin/payments/:id
 *  - GET  /api/admin/payments/stats
 */

const crypto  = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const { sendPaymentReceipt } = require("../utils/email");

// ── Razorpay client ──────────────────────────────────────────────────────────
let razorpayInstance = null;

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// ── Public: Create Razorpay Order ────────────────────────────────────────────
/**
 * POST /api/payments/create-order
 * Body: { amount (in rupees), name, phone, email, service, bookingId? }
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, name, phone, email, service, bookingId } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1) {
      return ApiResponse.error(res, 400, "Valid amount (in ₹) is required.");
    }
    if (!name || !phone) {
      return ApiResponse.error(res, 400, "name and phone are required.");
    }

    const rp = getRazorpay();

    const amountPaise = Math.round(Number(amount) * 100); // Razorpay needs paise

    const order = await rp.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes: {
        name,
        phone,
        service: service || "",
        bookingId: bookingId || "",
      },
    });

    // Create a pending payment record in DB
    const payment = await Payment.create({
      bookingId:      bookingId || undefined,
      name,
      phone,
      email:          email || "",
      amount:         Number(amount),
      currency:       "INR",
      method:         "online",
      status:         "pending",
      razorpayOrderId: order.id,
      service:        service || "other",
    });

    logger.info(`Razorpay order created: ${order.id} for ${name} ₹${amount}`);

    return ApiResponse.success(res, 201, "Order created", {
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      name,
      email: email || "",
      phone,
    });

  } catch (err) {
    if (err.message.includes("not configured")) {
      return ApiResponse.error(res, 503, "Payment service is not configured. Please call us at +91 95872 46814.");
    }
    next(err);
  }
};

// ── Public: Verify Payment ───────────────────────────────────────────────────
/**
 * POST /api/payments/verify
 * Called by client AFTER Razorpay checkout succeeds.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return ApiResponse.error(res, 400, "Payment verification data is incomplete.");
    }

    // ── HMAC-SHA256 signature verification ────────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.warn(`Payment signature mismatch: order=${razorpay_order_id}`);
      return ApiResponse.error(res, 400, "Payment verification failed. Signature mismatch.");
    }

    // ── Update payment record ─────────────────────────────────────────────────
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status:              "paid",
        razorpayPaymentId:   razorpay_payment_id,
        razorpaySignature:   razorpay_signature,
        transactionId:       razorpay_payment_id,
        method:              "online",
      },
      { new: true }
    );

    if (!payment) {
      return ApiResponse.error(res, 404, "Payment record not found.");
    }

    logger.info(`Payment verified: ${razorpay_payment_id} ₹${payment.amount}`);

    // Send receipt email (fire-and-forget)
    if (payment.email) {
      sendPaymentReceipt({
        name:          payment.name,
        email:         payment.email,
        amount:        payment.amount,
        method:        "Online (Razorpay)",
        transactionId: razorpay_payment_id,
        service:       payment.service,
      }).catch(() => {});
    }

    return ApiResponse.success(res, 200, "Payment verified successfully!", {
      paymentId:         payment._id,
      razorpayPaymentId: razorpay_payment_id,
      amount:            payment.amount,
      status:            "paid",
    });

  } catch (err) {
    next(err);
  }
};

// ── Public: Razorpay Webhook ─────────────────────────────────────────────────
/**
 * POST /api/payments/webhook
 * Razorpay sends this server-to-server after every payment event.
 * Configure in Razorpay Dashboard → Webhooks
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify webhook signature
      const signature = req.headers["x-razorpay-signature"];
      const digest = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (digest !== signature) {
        logger.warn("Invalid Razorpay webhook signature");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
    }

    const { event, payload } = req.body;

    logger.info(`Razorpay webhook received: ${event}`);

    if (event === "payment.captured") {
      const p = payload.payment?.entity;
      if (p) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: p.order_id },
          {
            status:            "paid",
            razorpayPaymentId: p.id,
            transactionId:     p.id,
            method:            p.method || "online",
          }
        );
        logger.info(`Webhook: payment.captured → ${p.id}`);
      }
    }

    if (event === "payment.failed") {
      const p = payload.payment?.entity;
      if (p) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: p.order_id },
          { status: "failed" }
        );
        logger.warn(`Webhook: payment.failed → ${p.id}`);
      }
    }

    res.json({ success: true, received: true });
  } catch (err) {
    next(err);
  }
};

// ── Admin: List Payments ─────────────────────────────────────────────────────
exports.getAllPayments = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.method) filter.method = req.query.method;
    if (req.query.search) {
      const re = new RegExp(req.query.search, "i");
      filter.$or = [{ name: re }, { phone: re }, { transactionId: re }];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate("bookingId", "name phone service")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Payments fetched", {
      payments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ── Admin: Create Payment (manual cash/cheque) ───────────────────────────────
exports.createPayment = async (req, res, next) => {
  try {
    const { name, phone, email, amount, method, service, bookingId, notes, transactionId } = req.body;
    const payment = await Payment.create({
      name, phone, email: email || "",
      amount, method: method || "cash",
      service: service || "other",
      bookingId: bookingId || undefined,
      status: "paid", // manual entries are already paid
      transactionId: transactionId || "",
      notes: notes || "",
    });

    // Send receipt if email provided
    if (payment.email) {
      sendPaymentReceipt({
        name: payment.name, email: payment.email,
        amount: payment.amount, method: payment.method,
        transactionId: payment.transactionId, service: payment.service,
      }).catch(() => {});
    }

    logger.info(`Manual payment recorded: ${payment._id} by ${req.admin.email}`);
    return ApiResponse.success(res, 201, "Payment recorded", payment);
  } catch (err) { next(err); }
};

// ── Admin: Update Payment ────────────────────────────────────────────────────
exports.updatePayment = async (req, res, next) => {
  try {
    const allowed = ["status", "notes", "transactionId", "method", "amount"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const payment = await Payment.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!payment) return ApiResponse.error(res, 404, "Payment not found.");
    return ApiResponse.success(res, 200, "Payment updated", payment);
  } catch (err) { next(err); }
};

// ── Admin: Payment Stats ─────────────────────────────────────────────────────
exports.getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const result = {
      totalRevenue: 0,
      paid:    { amount: 0, count: 0 },
      pending: { amount: 0, count: 0 },
      failed:  { amount: 0, count: 0 },
      refunded:{ amount: 0, count: 0 },
    };

    stats.forEach(({ _id, total, count }) => {
      if (_id in result) result[_id] = { amount: total, count };
      if (_id === "paid") result.totalRevenue += total;
    });

    // Method breakdown
    const byMethod = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$method", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    result.byMethod = byMethod;

    return ApiResponse.success(res, 200, "Stats fetched", result);
  } catch (err) { next(err); }
};
