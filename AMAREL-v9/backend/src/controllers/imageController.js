const mongoose = require("mongoose");
const Image = require("../models/Image");
const ApiError = require("../utils/ApiError");

// checks the first bytes of the file, so a renamed .exe can't pass as a picture
function sniffType(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

// body is the raw image (see the express.raw in imageRoutes)
exports.upload = async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new ApiError(400, "Invalid input", ["send the image file as the request body (JPEG, PNG or WebP, max 4 MB)"]);
    }
    const contentType = sniffType(req.body);
    if (!contentType) throw new ApiError(400, "Invalid input", ["the file must be a JPEG, PNG or WebP image"]);

    const image = await Image.create({ data: req.body, contentType });
    res.status(201).json({ success: true, url: `/api/images/${image.id}` });
  } catch (err) {
    next(err);
  }
};

// public: product pages need to show the picture
exports.get = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Image not found");
    const image = await Image.findById(req.params.id);
    if (!image) throw new ApiError(404, "Image not found");
    res.set({
      "Content-Type": image.contentType,
      // an image never changes once uploaded, so browsers can keep it for a long time
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    });
    res.send(image.data);
  } catch (err) {
    next(err);
  }
};
