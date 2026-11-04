const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { findCity } = require("../config/delivery");

const { STATUSES } = Order;

function readAddress(a = {}) {
  const out = {};
  const problems = [];
  for (const key of ["fullName", "phone", "address", "city"]) {
    const v = typeof a[key] === "string" ? a[key].trim() : "";
    if (!v) problems.push(`${key} is required`);
    out[key] = v;
  }
  if (out.phone && !/^[0-9+\s().-]{8,20}$/.test(out.phone)) problems.push("phone number is not valid");
  out.notes = typeof a.notes === "string" ? a.notes.trim().slice(0, 300) : "";

  // the city decides the delivery fee, so it must be one we deliver to
  let deliveryFee = 0;
  if (out.city) {
    const known = findCity(out.city);
    if (!known) problems.push(`we do not deliver to "${out.city}"`);
    else { out.city = known.city; deliveryFee = known.fee; }
  }
  return { out, problems, deliveryFee };
}

async function giveStockBack(lines) {
  for (const l of lines) await Product.updateOne({ _id: l.product }, { $inc: { stock: l.quantity } });
}

exports.createOrder = async (req, res, next) => {
  const taken = []; // lines whose stock we already removed, in case we need to undo
  let order = null;
  try {
    const { items, shippingAddress } = req.body || {};
    const problems = [];

    if (!Array.isArray(items) || items.length === 0) problems.push("items must be a non-empty array");
    const { out: address, problems: addrProblems, deliveryFee } = readAddress(shippingAddress);
    problems.push(...addrProblems);

    // merge duplicates and check every line
    const wanted = new Map();
    for (const it of Array.isArray(items) ? items : []) {
      const id = String(it?.productId);
      const qty = Number(it?.quantity);
      if (!mongoose.isValidObjectId(id)) { problems.push(`invalid productId: ${id}`); continue; }
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) { problems.push(`quantity for ${id} must be between 1 and 99`); continue; }
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }
    if (problems.length) throw new ApiError(400, "Invalid input", problems);

    const lines = [];
    for (const [id, quantity] of wanted) {
      // only takes the stock if there is enough, so two buyers can't both get the last one
      const product = await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { returnDocument: "after" }
      );
      if (!product) {
        const exists = await Product.findById(id);
        if (!exists) throw new ApiError(404, `Product not found: ${id}`);
        throw new ApiError(409, `Not enough stock for "${exists.name}" (only ${exists.stock} left)`);
      }
      taken.push({ product: product._id, quantity });
      // price comes from the database, never from the client
      lines.push({ product: product._id, name: product.name, price: product.price, image: product.imageUrl, quantity });
    }

    // full final price = products + delivery to the chosen city, all computed here
    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    const total = subtotal + deliveryFee;
    // req.user is only set when the buyer is logged in; guests order with user = null
    order = await Order.create({ user: req.user?._id ?? null, items: lines, subtotal, deliveryFee, total, shippingAddress: address });

    if (req.user) await User.updateOne({ _id: req.user._id }, { cart: [] });
    res.status(201).json({ success: true, order });
  } catch (err) {
    // if the order was saved, the stock is rightfully gone
    if (!order) await giveStockBack(taken).catch(() => {});
    next(err);
  }
};

// Guests have no account, so their browser remembers (order id, phone) pairs and asks for
// the current status here. An order is only returned when the phone matches the one typed
// at checkout (the id alone is not enough), and no email or account data is ever sent.
const lastDigits = (v) => String(v || "").replace(/\D/g, "").slice(-9);

exports.lookupOrders = async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.orders) ? req.body.orders.slice(0, 20) : null;
    if (!list) throw new ApiError(400, "Invalid input", ["orders must be an array of { id, phone }"]);

    const phones = new Map();
    for (const o of list) {
      if (mongoose.isValidObjectId(o?.id) && lastDigits(o?.phone).length >= 8) phones.set(String(o.id), lastDigits(o.phone));
    }
    const found = phones.size ? await Order.find({ _id: { $in: [...phones.keys()] } }).sort({ createdAt: -1 }) : [];
    const orders = found.filter((o) => lastDigits(o.shippingAddress.phone) === phones.get(o.id));
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

exports.allOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email");
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, `Invalid order id: ${req.params.id}`);
    const order = await Order.findById(req.params.id).populate("user", "name email");
    // someone else's order looks the same as one that doesn't exist
    const mine = order?.user && order.user._id.toString() === req.user._id.toString();
    if (!order || (req.user.role !== "admin" && !mine)) {
      throw new ApiError(404, "Order not found");
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, `Invalid order id: ${req.params.id}`);
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) throw new ApiError(400, "Invalid input", [`status must be one of: ${STATUSES.join(", ")}`]);

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "Cancelled") throw new ApiError(409, "A cancelled order can't be changed");

    if (status === "Cancelled") await giveStockBack(order.items);
    order.status = status;
    await order.save();
    await order.populate("user", "name email");
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
// admin only: delete an order for good
exports.deleteOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, `Invalid order id: ${req.params.id}`);
    // delete first (atomic), so the stock can never be given back twice
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");
    // an order that was never shipped puts its items back on the shelf.
    // Cancelled orders already did it, and shipped/delivered ones have left the shop.
    if (order.status === "Pending" || order.status === "Processing") await giveStockBack(order.items);
    res.status(200).json({ success: true, message: "Order deleted" });
  } catch (err) {
    next(err);
  }
};