const ApiError = require("../utils/ApiError");

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// every error leaves the API in the same shape: { success, message, errors? }
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors;

  if (err.name === "ValidationError") {
    status = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = "Invalid input";
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    message = "This email is already registered";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON";
  }

  if (status === 500) {
    console.error(err);
    message = "Internal server error";
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
