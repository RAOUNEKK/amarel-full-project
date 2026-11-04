const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing, check your .env file");
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Could not start the server:", err.message);
    process.exit(1);
  }
}

start();
