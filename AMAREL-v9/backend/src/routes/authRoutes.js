const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, me);

module.exports = router;
