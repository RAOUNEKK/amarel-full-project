const ApiError = require("../utils/ApiError");
const { sendEmail } = require("../utils/sendEmail");

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const str = (v) => (typeof v === "string" ? v.trim() : "");

exports.sendMessage = async (req, res, next) => {
  try {
    const { name, email, message, website } = req.body || {};

    // hidden "website" field: real visitors never fill it, bots do. Pretend it worked.
    if (str(website)) return res.status(201).json({ success: true, message: "Message sent" });

    const data = { name: str(name), email: str(email), message: str(message) };
    const problems = [];
    if (!data.name) problems.push("name is required");
    else if (data.name.length > 100) problems.push("name is too long (100 characters max)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 200) problems.push("email is not valid");
    if (data.message.length < 10) problems.push("message must have at least 10 characters");
    else if (data.message.length > 3000) problems.push("message is too long (3000 characters max)");
    if (problems.length) throw new ApiError(400, "Invalid message", problems);

    const to = process.env.CONTACT_TO_EMAIL;
    if (!to) throw new ApiError(503, "The contact form is not configured yet");

    await sendEmail({
      to,
      replyTo: data.email,
      subject: `AMAREL contact: ${data.name}`.replace(/[\r\n]+/g, " "),
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
      html:
        `<p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
    });

    res.status(201).json({ success: true, message: "Message sent" });
  } catch (err) {
    next(err);
  }
};
