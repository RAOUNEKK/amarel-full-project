const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

// asks Google if an OAuth access token is real (for the Postman OAuth2 test)
async function verifyGoogleAccessToken(token) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const info = await res.json();
  return info.email && info.email_verified !== false ? info : null;
}

// turns a bearer token into a user, or null when the token is not valid.
// The role always comes from the database, never from the token or the browser.
async function userFromToken(token) {
  // 1) our own JWT
  let payload = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    // not one of our tokens, maybe a Google one
  }
  if (payload) return User.findById(payload.id);

  // 2) Google OAuth access token (only if configured)
  if (process.env.GOOGLE_CLIENT_ID) {
    const info = await verifyGoogleAccessToken(token);
    if (info) {
      let user = await User.findOne({ email: info.email.toLowerCase() });
      if (!user) {
        // new accounts are always customers (role has its default value)
        user = await User.create({
          name: info.name || info.email,
          email: info.email,
          passwordHash: "oauth-google-no-password",
        });
      }
      return user;
    }
  }
  return null;
}

function readBearer(req) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// 401 when there is no valid login
async function protect(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) throw new ApiError(401, "Missing token. Use: Authorization: Bearer <token>");

    const user = await userFromToken(token);
    if (!user) throw new ApiError(401, "Invalid or expired token");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// guests are allowed (used to place an order without an account).
// A valid token still identifies the customer, a missing or stale one just means "guest".
async function optionalAuth(req, res, next) {
  try {
    const token = readBearer(req);
    if (token) {
      const user = await userFromToken(token).catch(() => null);
      if (user) req.user = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

// 403 when logged in but not an administrator. Always used after `protect`.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return next(new ApiError(403, "Access denied"));
  next();
}

module.exports = { protect, optionalAuth, requireAdmin, adminOnly: requireAdmin };
