const express = require("express");
const ctrl = require("../controllers/userDataController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/favorites", protect, ctrl.getFavorites);
router.put("/favorites", protect, ctrl.saveFavorites);
router.get("/cart", protect, ctrl.getCart);
router.put("/cart", protect, ctrl.saveCart);

module.exports = router;
