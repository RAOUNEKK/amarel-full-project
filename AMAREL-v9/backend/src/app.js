require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const orderRoutes = require("./routes/orderRoutes");
const imageRoutes = require("./routes/imageRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// needed so the rate limiter sees the real client IP behind a proxy (Render, etc.)
app.set("trust proxy", 1);

const origins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// While developing, the frontend can run on any local port (3000, 5173, 8080...), so
// any localhost origin is accepted. In production only CLIENT_ORIGIN is allowed.
const isLocal = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const allowDevOrigins = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin(origin, cb) {
      // no Origin header = Postman, curl or server-to-server, not a browser page
      if (!origin || origins.includes(origin) || (allowDevOrigins && isLocal(origin))) return cb(null, true);
      cb(null, false);
    },
  })
);
app.use(express.json());

app.get("/", (req, res) => res.json({ success: true, message: "AMAREL API is running" }));

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api", userDataRoutes); // /api/cart and /api/favorites
app.use("/api/orders", orderRoutes);
app.use("/api/images", imageRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
