const mongoose = require("mongoose");

// product photos uploaded by the admin, stored in the database so they survive
// restarts and redeploys (no extra file storage service needed)
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
