/**
 * controllers/bookingController.js
 * Public booking submission + Admin CRUD + email notifications.
 */

const Booking = require("../models/Booking");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const { sendBookingNotification, sendBookingConfirmation } = require("../utils/email");

// ─── Public ──────────────────────────────────────────────────────────────────

exports.createBooking = async (req, res, next) => {
  try {
    const { name, age, phone, email, service, preferredDate, message } = req.body;

    const booking = await Booking.create({ name, age, phone, email, service, preferredDate, message });
    logger.info(`New booking: ${booking._id} by ${name}`);

    // Fire-and-forget emails
    sendBookingNotification(booking).catch(() => {});
    sendBookingConfirmation(booking).catch(() => {});

    return ApiResponse.success(res, 201, "Booking submitted successfully! Our team will contact you within 24 hours.", {
      bookingId: booking._id,
      status:    booking.status,
    });
  } catch (err) { next(err); }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

exports.getAllBookings = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const filter = {};

    if (req.query.status && ["pending","confirmed","cancelled","completed"].includes(req.query.status))
      filter.status = req.query.status;
    if (req.query.service) filter.service = req.query.service;
    if (req.query.search) {
      const re = new RegExp(req.query.search, "i");
      filter.$or = [{ name: re }, { phone: re }];
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to)   filter.createdAt.$lte = new Date(req.query.to);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Bookings fetched", {
      bookings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return ApiResponse.error(res, 404, "Booking not found.");
    return ApiResponse.success(res, 200, "Booking fetched", booking);
  } catch (err) { next(err); }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const allowed = ["status", "notes", "preferredDate"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!booking) return ApiResponse.error(res, 404, "Booking not found.");
    logger.info(`Booking ${booking._id} updated by ${req.admin.email}`);
    return ApiResponse.success(res, 200, "Booking updated", booking);
  } catch (err) { next(err); }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return ApiResponse.error(res, 404, "Booking not found.");

    if (req.query.hard === "true") {
      await Booking.findByIdAndDelete(req.params.id);
      logger.warn(`Booking ${req.params.id} hard-deleted by ${req.admin.email}`);
      return ApiResponse.success(res, 200, "Booking permanently deleted.");
    }

    booking.status = "cancelled";
    await booking.save();
    logger.info(`Booking ${booking._id} cancelled by ${req.admin.email}`);
    return ApiResponse.success(res, 200, "Booking cancelled.", booking);
  } catch (err) { next(err); }
};

exports.getBookingStats = async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const result = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    stats.forEach(({ _id, count }) => {
      if (_id in result) result[_id] = count;
      result.total += count;
    });
    const last7 = await Booking.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    return ApiResponse.success(res, 200, "Stats fetched", { ...result, last7Days: last7 });
  } catch (err) { next(err); }
};
