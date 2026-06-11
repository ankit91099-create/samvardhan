/**
 * routes/bookingRoutes.js
 *
 * Public:  POST /api/bookings           — submit booking form
 * Admin:   GET  /api/admin/bookings     — list all (paginated)
 *          GET  /api/admin/bookings/stats
 *          GET  /api/admin/bookings/:id
 *          PATCH /api/admin/bookings/:id
 *          DELETE /api/admin/bookings/:id
 */

const express = require("express");
const { body } = require("express-validator");

const bookingController = require("../controllers/bookingController");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

// ── Public Router ─────────────────────────────────────────────────────────────
const publicRouter = express.Router();

const bookingValidation = [
  body("name")
    .trim().notEmpty().withMessage("Name is required")
    .isLength({ max: 150 }).withMessage("Name too long"),
  body("age")
    .isInt({ min: 0, max: 120 }).withMessage("Age must be between 0 and 120"),
  body("phone")
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian phone number"),
  body("email")
    .optional().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("service")
    .optional()
    .isIn(["adhd","autism","speech_therapy","learning_disability","behavioural_therapy","occupational_therapy","other"])
    .withMessage("Invalid service type"),
  body("message")
    .optional().isLength({ max: 1000 }).withMessage("Message too long"),
];

publicRouter.post("/", bookingValidation, validate, bookingController.createBooking);

// ── Admin Router ──────────────────────────────────────────────────────────────
const adminRouter = express.Router();

adminRouter.use(protect); // JWT required for all admin booking routes

adminRouter.get ("/stats",  bookingController.getBookingStats);
adminRouter.get ("/",       bookingController.getAllBookings);
adminRouter.get ("/:id",    bookingController.getBookingById);
adminRouter.patch("/:id",   bookingController.updateBooking);
adminRouter.delete("/:id",  restrictTo("superadmin"), bookingController.deleteBooking);

module.exports = { publicRouter, adminRouter };
