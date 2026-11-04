const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const problems = [];
    if (!name || typeof name !== "string" || !name.trim()) problems.push("name is required");
    if (!email || !emailRegex.test(email)) problems.push("a valid email is required");
    if (!password || typeof password !== "string" || password.length < 6) {
      problems.push("password must be at least 6 characters");
    }
    if (problems.length) throw new ApiError(400, "Invalid input", problems);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new ApiError(409, "This email is already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    // role is never taken from the request, new accounts are always customers
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({ success: true, user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ApiError(400, "Invalid input", ["email and password are required"]);

    const user = await User.findOne({ email: String(email).toLowerCase() });
    const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!ok) throw new ApiError(401, "Invalid email or password");

    res.status(200).json({ success: true, user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

// who am I, handy to check a token in Postman
exports.me = (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};
