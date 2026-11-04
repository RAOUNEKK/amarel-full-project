require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("../src/models/Product");
const User = require("../src/models/User");
const products = require("./products.json");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const reset = process.argv.includes("--reset");
  if (reset) await Product.deleteMany({});

  const count = await Product.countDocuments();
  if (count === 0) {
    // insert one by one so createdAt keeps the original catalogue order
    for (const p of products) await Product.create(p);
    console.log(`Inserted ${products.length} products`);
  } else {
    console.log(`Products already there (${count}), skipping. Use --reset to start over.`);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      // The explicitly configured seed credentials are the source of truth
      // for the store-owner account, even if this email registered earlier.
      existing.role = "admin";
      existing.passwordHash = passwordHash;
      existing.name = existing.name || "AMAREL Admin";
      await existing.save();
      console.log("Admin account ensured");
    } else {
      await User.create({
        name: "AMAREL Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      });
      console.log("Admin user created");
    }
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
