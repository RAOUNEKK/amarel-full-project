const express = require("express");
const ctrl = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// public
router.get("/", ctrl.getProducts);
router.get("/:id", ctrl.getProduct);

// need a token
router.post("/", protect, adminOnly, ctrl.createProduct);
router.put("/:id", protect, adminOnly, ctrl.updateProduct);
router.delete("/:id", protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
