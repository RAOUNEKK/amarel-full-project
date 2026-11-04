const express = require("express");
const ctrl = require("../controllers/orderController");
const { protect, optionalAuth, requireAdmin } = require("../middleware/authMiddleware");
const { orderLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// no account needed to order: guests and logged-in customers can both check out
router.post("/", orderLimiter, optionalAuth, ctrl.createOrder);
// public: a guest checks the status of orders their browser remembers (needs the phone number)
router.post("/lookup", ctrl.lookupOrders);
router.get("/mine", protect, ctrl.myOrders);
router.get("/", protect, requireAdmin, ctrl.allOrders);
router.get("/:id", protect, ctrl.getOrder);
router.patch("/:id/status", protect, requireAdmin, ctrl.updateStatus);

module.exports = router;
