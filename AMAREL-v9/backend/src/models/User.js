const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    // saved on the server so they follow the user to any device
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
      },
    ],
  },
  { timestamps: true }
);

// never send the hash back to the client
userSchema.set("toJSON", {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    delete ret.cart;
    delete ret.favorites;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
