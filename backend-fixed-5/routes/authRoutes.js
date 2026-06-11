/**
 * routes/authRoutes.js
 * All authentication endpoints.
 *
 * Public:   POST /api/auth/login
 *           POST /api/auth/refresh
 * Protected: GET  /api/auth/me
 *            POST /api/auth/logout
 *            PATCH /api/auth/change-password
 */

const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// ── Validation chains ─────────────────────────────────────────────────────────

const loginValidation = [
  body("email")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Must contain at least one number"),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// Public
router.post("/login",          loginValidation, validate, authController.login);
router.post("/refresh",        authController.refreshToken);

// Protected
router.use(protect); // all routes below require valid JWT

router.get ("/me",             authController.getProfile);
router.post("/logout",         authController.logout);
router.patch("/change-password", changePasswordValidation, validate, authController.changePassword);

module.exports = router;
