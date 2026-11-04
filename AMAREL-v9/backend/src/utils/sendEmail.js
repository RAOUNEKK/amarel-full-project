const ApiError = require("./ApiError");

// Sends one email through the Resend REST API (https://resend.com/docs/api-reference/emails/send-email).
// Needs Node 18+ (global fetch), so no extra package is installed.
async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new ApiError(503, "The contact form is not configured yet");

  const from = process.env.CONTACT_FROM_EMAIL || "AMAREL <onboarding@resend.dev>";

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, html, reply_to: replyTo }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("Resend request failed:", err.message);
    throw new ApiError(502, "Could not send your message right now, please try again later");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Resend error", res.status, data);
    throw new ApiError(502, "Could not send your message right now, please try again later");
  }
  return res.json().catch(() => ({}));
}

module.exports = { sendEmail };
