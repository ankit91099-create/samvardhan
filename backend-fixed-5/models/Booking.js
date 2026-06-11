/**
 * models/Booking.js
 * Patient appointment booking schema.
 */

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      maxlength: [150, "Name cannot exceed 150 characters"],
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
      max: [120, "Age seems invalid"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    service: {
      type: String,
      enum: [
        "adhd",
        "autism",
        "speech_therapy",
        "learning_disability",
        "behavioural_therapy",
        "occupational_therapy",
        "other",
      ],
      default: "other",
    },

    preferredDate: {
      type: Date,
    },

    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    notes: {
      type: String, // Admin internal notes
      trim: true,
      maxlength: [2000],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster admin queries
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ phone: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
