const { validationResult } = require("express-validator");
const ApiResponse = require("../utils/ApiResponse");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => `${e.param || e.path || "field"}: ${e.msg}`)
      .join("; ");
    return ApiResponse.error(res, 422, "Validation failed: " + messages);
  }
  next();
};

module.exports = validate;
