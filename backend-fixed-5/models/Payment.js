/**
 * models/Payment.js — updated for Razorpay integration
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    name:     { type: String, required: [true, "Patient name is required"], trim: true },
    phone:    { type: String, trim: true, default: "" },
    email:    { type: String, trim: true, lowercase: true, default: "" },
    service:  {
      type: String,
      enum: ["adhd","autism","speech_therapy","learning_disability","behavioural_therapy","occupational_therapy","other"],
      default: "other",
    },
    amount:   { type: Number, required: [true, "Amount is required"], min: [0, "Cannot be negative"] },
    currency: { type: String, default: "INR" },
    method:   {
      type: String,
      enum: ["cash", "upi", "card", "netbanking", "cheque", "online", "other"],
      default: "other",
    },
    status:   { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
    transactionId:     { type: String, trim: true, default: "" },
    // Razorpay-specific fields
    razorpayOrderId:   { type: String, trim: true, default: "" },
    razorpayPaymentId: { type: String, trim: true, default: "" },
    razorpaySignature: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, maxlength: [1000], default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ phone: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
