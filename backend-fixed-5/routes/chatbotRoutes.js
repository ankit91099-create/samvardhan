/**
 * routes/chatbotRoutes.js
 * Public route — no auth required.
 * Has its own tight rate limiter to prevent API key abuse.
 *
 *   POST /api/chat   →  chatbotController.chat
 */

const express    = require("express");
const rateLimit  = require("express-rate-limit");
const { body }   = require("express-validator");

const chatbotController = require("../controllers/chatbotController");
const validate          = require("../middleware/validate");

const router = express.Router();

// ── Dedicated rate limiter for chatbot ────────────────────────────────────────
// 30 messages per 10 minutes per IP — generous for real users, blocks scrapers
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: "Too many messages. Please wait a few minutes before continuing.",
  },
});

// ── Input validation ──────────────────────────────────────────────────────────
const chatValidation = [
  body("messages")
    .isArray({ min: 1, max: 40 })
    .withMessage("messages must be a non-empty array (max 40 items)"),
  body("messages.*.role")
    .isIn(["user", "assistant"])
    .withMessage("Each message role must be 'user' or 'assistant'"),
  body("messages.*.content")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Each message must have non-empty string content")
    .isLength({ max: 2000 })
    .withMessage("Each message content must be under 2000 characters"),
];

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/", chatLimiter, chatValidation, validate, chatbotController.chat);

module.exports = router;
