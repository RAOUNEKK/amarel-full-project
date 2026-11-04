const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const cleanIds = (list) => [...new Set((list || []).map(String))].filter((id) => mongoose.isValidObjectId(id));

// ---- favourites ----

exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const found = await Product.find({ _id: { $in: user.favorites } }).select("_id");
    res.status(200).json({ success: true, favorites: found.map((p) => p._id.toString()) });
  } catch (err) {
    next(err);
  }
};

// the whole list is sent each time, simpler than add/remove calls
exports.saveFavorites = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.favorites)) throw new ApiError(400, "Invalid input", ["favorites must be an array"]);
    const ids = cleanIds(req.body.favorites);
    const found = await Product.find({ _id: { $in: ids } }).select("_id");
    const valid = found.map((p) => p._id);
    await User.updateOne({ _id: req.user._id }, { favorites: valid });
    res.status(200).json({ success: true, favorites: valid.map(String) });
  } catch (err) {
    next(err);
  }
};

// ---- cart ----

async function readCart(userId) {
  const user = await User.findById(userId).populate("cart.product");
  // a product that was deleted in the meantime just disappears from the cart
  return user.cart.filter((l) => l.product).map((l) => ({ quantity: l.quantity, product: l.product }));
}

exports.getCart = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, items: await readCart(req.user._id) });
  } catch (err) {
    next(err);
  }
};

exports.saveCart = async (req, res, next) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items)) throw new ApiError(400, "Invalid input", ["items must be an array"]);

    const wanted = new Map();
    for (const it of items) {
      const id = String(it?.productId);
      const qty = Number(it?.quantity);
      if (!mongoose.isValidObjectId(id)) continue;
      if (!Number.isInteger(qty) || qty < 1) continue;
      wanted.set(id, Math.min(99, (wanted.get(id) || 0) + qty));
    }

    const found = await Product.find({ _id: { $in: [...wanted.keys()] } }).select("_id");
    const cart = found.map((p) => ({ product: p._id, quantity: wanted.get(p._id.toString()) }));
    await User.updateOne({ _id: req.user._id }, { cart });

    res.status(200).json({ success: true, items: await readCart(req.user._id) });
  } catch (err) {
    next(err);
  }
};
