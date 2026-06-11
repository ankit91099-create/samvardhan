/**
 * utils/jwt.js
 * Centralized JWT helper — generate, verify, and refresh tokens.
 */

const jwt = require("jsonwebtoken");
const logger = require("./logger");

/**
 * Generate a short-lived access token.
 * @param {Object} payload  - { id, email, role }
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "samvardhan-bloom",
    audience: "samvardhan-client",
  });
};

/**
 * Generate a long-lived refresh token.
 * @param {Object} payload  - { id }
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    issuer: "samvardhan-bloom",
  });
};

/**
 * Verify an access token. Returns decoded payload or null.
 * @param {string} token
 * @returns {Object|null}
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "samvardhan-bloom",
      audience: "samvardhan-client",
    });
  } catch (err) {
    logger.warn(`Access token verification failed: ${err.message}`);
    return null;
  }
};

/**
 * Verify a refresh token. Returns decoded payload or null.
 * @param {string} token
 * @returns {Object|null}
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: "samvardhan-bloom",
    });
  } catch (err) {
    logger.warn(`Refresh token verification failed: ${err.message}`);
    return null;
  }
};

/**
 * Decode a token without verifying (for reading exp before validation).
 * @param {string} token
 * @returns {Object|null}
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
