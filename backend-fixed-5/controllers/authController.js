const Admin = require("../models/Admin");
const ApiResponse = require("../utils/ApiResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");

// Helpers 

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  });
};

/**
 * Build the sanitized admin object to return to the client.
 */
const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  lastLogin: admin.lastLogin,
});

// Controllers

/**
 * POST /api/auth/login
 * Public route — authenticate admin and issue tokens.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find admin (explicitly select hidden fields we need)
    const admin = await Admin.findOne({ email })
      .select("+password +loginAttempts +lockUntil +refreshToken +isActive");

    if (!admin) {
      return ApiResponse.error(res, 401, "Invalid email or password.");
    }

    // 2. Check if account is active
    if (!admin.isActive) {
      return ApiResponse.error(res, 403, "Account deactivated. Contact superadmin.");
    }

    // 3. Check if account is locked
    if (admin.isLocked()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return ApiResponse.error(
        res,
        423,
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
      );
    }

    // 4. Verify password
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      await admin.incrementLoginAttempts();
      const remaining = Math.max(0, 5 - admin.loginAttempts);
      return ApiResponse.error(
        res,
        401,
        remaining > 0
          ? `Invalid email or password. ${remaining} attempt(s) remaining.`
          : "Account locked for 30 minutes."
      );
    }

    // 5. Reset failed attempts and update last login
    await admin.resetLoginAttempts();

    // 6. Generate tokens
    const tokenPayload = { id: admin._id, email: admin.email, role: admin.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: admin._id });

    // 7. Store hashed refresh token
    admin.refreshToken = await bcrypt.hash(refreshToken, 10);
    await admin.save({ validateBeforeSave: false });

    // 8. Set refresh token in httpOnly cookie
    setRefreshCookie(res, refreshToken);

    logger.info(`Admin logged in: ${admin.email}`);

    return ApiResponse.success(res, 200, "Login successful", {
      accessToken,
      admin: sanitizeAdmin(admin),
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Public route — issue a new access token using a valid refresh token cookie.
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return ApiResponse.error(res, 401, "No refresh token provided. Please login.");
    }

    // 1. Verify signature
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return ApiResponse.error(res, 401, "Invalid or expired refresh token. Please login.");
    }

    // 2. Find admin and compare stored hashed refresh token
    const admin = await Admin.findById(decoded.id).select("+refreshToken +isActive");

    if (!admin || !admin.refreshToken) {
      return ApiResponse.error(res, 401, "Session not found. Please login.");
    }

    if (!admin.isActive) {
      return ApiResponse.error(res, 403, "Account deactivated.");
    }

    const isValid = await bcrypt.compare(token, admin.refreshToken);
    if (!isValid) {
      // Potential token reuse — revoke all sessions
      admin.refreshToken = undefined;
      await admin.save({ validateBeforeSave: false });
      return ApiResponse.error(res, 401, "Refresh token reuse detected. Please login again.");
    }

    // 3. Rotate: issue new access + refresh tokens
    const tokenPayload = { id: admin._id, email: admin.email, role: admin.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ id: admin._id });

    admin.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await admin.save({ validateBeforeSave: false });

    setRefreshCookie(res, newRefreshToken);

    return ApiResponse.success(res, 200, "Token refreshed", {
      accessToken: newAccessToken,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Protected route — invalidate the admin's refresh token.
 */
exports.logout = async (req, res, next) => {
  try {
    // Clear DB refresh token
    req.admin.refreshToken = undefined;
    await req.admin.save({ validateBeforeSave: false });

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`Admin logged out: ${req.admin.email}`);

    return ApiResponse.success(res, 200, "Logged out successfully.");

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected route — return the current admin's profile.
 */
exports.getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return ApiResponse.error(res, 404, "Admin not found.");
    }

    return ApiResponse.success(res, 200, "Profile fetched", sanitizeAdmin(admin));

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 * Protected route — change admin password.
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id).select("+password");

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, 401, "Current password is incorrect.");
    }

    if (newPassword.length < 8) {
      return ApiResponse.error(res, 422, "New password must be at least 8 characters.");
    }

    admin.password = newPassword; // pre-save hook will hash it
    await admin.save();

    // Revoke all sessions to force re-login
    admin.refreshToken = undefined;
    await admin.save({ validateBeforeSave: false });

    res.clearCookie("refreshToken");

    logger.info(`Admin changed password: ${admin.email}`);

    return ApiResponse.success(res, 200, "Password changed. Please login again.");

  } catch (err) {
    next(err);
  }
};
