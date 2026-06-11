/**
 * middleware/auth.js
 * JWT-based authentication and role-based authorization middleware.
 */

const Admin = require("../models/Admin");
const { verifyAccessToken } = require("../utils/jwt");
const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");

/**
 * protect
 * Verifies the JWT access token present in the Authorization header.
 * Attaches the admin document to req.admin on success.
 *
 * Usage: router.get("/route", protect, handler)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from "Authorization: Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ApiResponse.error(res, 401, "Access denied. No token provided.");
    }

    // 2. Verify token signature and expiry
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return ApiResponse.error(res, 401, "Invalid or expired token. Please login again.");
    }

    // 3. Check admin still exists in DB
    const admin = await Admin.findById(decoded.id).select("+passwordChangedAt +isActive");

    if (!admin) {
      return ApiResponse.error(res, 401, "Admin account no longer exists.");
    }

    // 4. Check if admin is still active
    if (!admin.isActive) {
      return ApiResponse.error(res, 403, "Admin account has been deactivated.");
    }

    // 5. Check if password was changed after token was issued
    if (admin.passwordChangedAfter(decoded.iat)) {
      return ApiResponse.error(
        res,
        401,
        "Password was changed recently. Please login again."
      );
    }

    // 6. Attach admin to request
    req.admin = admin;
    next();

  } catch (err) {
    logger.error("Auth middleware error:", err);
    return ApiResponse.error(res, 500, "Authentication error.");
  }
};

/**
 * restrictTo
 * Role-based access control — use AFTER protect.
 * Example: router.delete("/admin/:id", protect, restrictTo("superadmin"), handler)
 *
 * @param {...string} roles - allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return ApiResponse.error(
        res,
        403,
        "You do not have permission to perform this action."
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
