const rateLimit = require("express-rate-limit");

const windowMs = 15 * 60 * 1000;

function makeLimiter(max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });
}

// 100 requests / 15 min for the whole API
const apiLimiter = makeLimiter(
  Number(process.env.API_RATE_LIMIT) || 100,
  "Too many requests, please try again in 15 minutes"
);

// 5 login attempts / 15 min per IP
const loginLimiter = makeLimiter(
  Number(process.env.LOGIN_RATE_LIMIT) || 5,
  "Too many login attempts, please try again in 15 minutes"
);

// orders need no login, so limit them per IP to stop fake-order spam
const orderLimiter = makeLimiter(
  Number(process.env.ORDER_RATE_LIMIT) || 10,
  "Too many orders from this connection, please try again later"
);

module.exports = { apiLimiter, loginLimiter, orderLimiter };
