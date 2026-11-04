const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/contactController");

const router = express.Router();

// public form, so limit it per IP to stop email spam (default 5 messages / 15 min)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: "Too many messages from this connection, please try again later" }),
});

router.post("/", contactLimiter, ctrl.sendMessage);

module.exports = router;
