const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, required: [true, "description is required"], trim: true },
    price: { type: Number, required: [true, "price is required"], min: [0, "price cannot be negative"] },
    category: {
      type: String,
      required: [true, "category is required"],
      enum: { values: ["Furniture", "Lighting", "Décor"], message: "category must be Furniture, Lighting or Décor" },
    },
    imageUrl: { type: String, required: [true, "imageUrl is required"], trim: true },
    stock: {
      type: Number,
      required: [true, "stock is required"],
      min: [0, "stock cannot be negative"],
      validate: { validator: Number.isInteger, message: "stock must be a whole number" },
    },
    badge: { type: String, default: "", trim: true },
    bestseller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// the React app expects `id` and `image`, so we send those too
productSchema.set("toJSON", {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    ret.image = ret.imageUrl;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
