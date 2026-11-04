const express = require("express");
const ctrl = require("../controllers/imageController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// admin only: upload a product photo (raw image body, 4 MB max)
router.post(
  "/",
  protect,
  requireAdmin,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "4mb" }),
  ctrl.upload
);
// public: anyone can see product photos
router.get("/:id", ctrl.get);

module.exports = router;
