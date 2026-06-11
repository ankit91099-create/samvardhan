/**
 * utils/ApiResponse.js
 * Standardized JSON response shape for every API endpoint.
 *
 * Success:  { success: true,  data: {...},   message: "..." }
 * Error:    { success: false, error: "...",  message: "..." }
 */

class ApiResponse {
  /**
   * Send a 2xx success response.
   * @param {Response} res - Express response object
   * @param {number}   statusCode
   * @param {string}   message
   * @param {*}        data
   */
  static success(res, statusCode = 200, message = "Success", data = null) {
    const payload = { success: true, message };
    if (data !== null && data !== undefined) payload.data = data;
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a 4xx / 5xx error response.
   * @param {Response} res
   * @param {number}   statusCode
   * @param {string}   message
   * @param {string|null} error  - optional technical detail (omit in prod)
   */
  static error(res, statusCode = 500, message = "Something went wrong", error = null) {
    const payload = { success: false, message };
    if (error && process.env.NODE_ENV !== "production") payload.error = error;
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
