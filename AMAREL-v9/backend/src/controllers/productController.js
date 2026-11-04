const mongoose = require("mongoose");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const fields = ["name", "description", "price", "category", "imageUrl", "stock", "badge", "bestseller"];

// the old frontend calls the image field `image`, accept both
function pickBody(body = {}) {
  const data = {};
  const source = { ...body };
  if (source.image && !source.imageUrl) source.imageUrl = source.image;
  for (const f of fields) if (source[f] !== undefined) data[f] = source[f];
  return data;
}

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid product id: ${id}`);
}

exports.getProducts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.bestseller === "true") filter.bestseller = true;
    const products = await Product.find(filter).sort({ createdAt: 1, _id: 1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    checkId(req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, "Product not found");
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(pickBody(req.body));
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    checkId(req.params.id);
    const product = await Product.findByIdAndUpdate(req.params.id, pickBody(req.body), {
      returnDocument: "after",
      runValidators: true,
    });
    if (!product) throw new ApiError(404, "Product not found");
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    checkId(req.params.id);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new ApiError(404, "Product not found");
    res.status(200).json({ success: true, message: "Product deleted", product });
  } catch (err) {
    next(err);
  }
};
