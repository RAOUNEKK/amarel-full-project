const mongoose = require("mongoose");

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const orderSchema = new mongoose.Schema(
  {
    // empty for guest orders: nobody has to create an account to buy
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // name and price are copied at purchase time, so old orders never change
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    // subtotal + deliveryFee, the full price the customer pays on delivery
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: "Pending" },
    paymentMethod: { type: String, default: "Cash on delivery" },
    // everything the customer typed in the confirmation form
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      notes: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    ret.number = "AM-" + ret.id.slice(-6).toUpperCase();
    ret.itemCount = ret.items.reduce((n, i) => n + i.quantity, 0);
    ret.isGuest = !ret.user;
    // older orders were saved before delivery fees existed
    if (ret.subtotal == null) ret.subtotal = ret.total;
    if (ret.deliveryFee == null) ret.deliveryFee = 0;
    // when the user was populated, show who ordered
    if (ret.user && ret.user.email) {
      ret.customer = { name: ret.user.name, email: ret.user.email };
      // the User model already turned _id into id when it was populated
      ret.user = ret.user.id;
    }
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
module.exports.STATUSES = STATUSES;
