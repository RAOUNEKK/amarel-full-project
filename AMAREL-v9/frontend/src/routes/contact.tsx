import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import velvet from "@/assets/velvet-green.jpg";
import { ApiError, sendContactApi } from "@/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AMARÉL" },
      { name: "description", content: "Get in touch with the AMARÉL studio." },
      { property: "og:title", content: "Contact — AMARÉL" },
      { property: "og:description", content: "Get in touch with the AMARÉL studio." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  // hidden anti-spam field: people never see it, bots fill it
  const [website, setWebsite] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err["name"] = "Please share your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err["email"] = "Enter a valid email.";
    if (form.message.trim().length < 10) err["message"] = "A few more words, please (10+ characters).";
    setErrors(err);
    setServerError("");
    if (Object.keys(err).length) return;
    setSending(true);
    try {
      await sendContactApi({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), website });
      setSent(true);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Something went wrong, please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 md:px-8 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-5xl text-foreground md:text-6xl">Let's talk <span className="font-medium">rooms</span></h1>
        <p className="mt-5 text-muted-foreground">Questions about a piece, delivery or styling? Our studio replies within a day.</p>
        <ul className="mt-10 space-y-5 text-foreground/85">
          <li className="flex items-center gap-3"><Mail className="text-primary" size={18} /> hello@amarel.example</li>
          <li className="flex items-center gap-3"><Phone className="text-primary" size={18} /> +1 (555) 010-2026</li>
          <li className="flex items-center gap-3"><MapPin className="text-primary" size={18} /> 14 Linen Lane, Studio District</li>
        </ul>
      </div>
      <div className="card-glow rounded-3xl p-8 text-white md:p-10" style={{ backgroundColor: "#183024", backgroundImage: `url(${velvet})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        {sent ? (
          <div className="py-16 text-center">
            <p className="font-display text-4xl font-light">Thank you, {form.name.split(" ")[0]}.</p>
            <p className="mt-3 text-white/70">Your message has been sent. Our studio will reply within a day.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Leave this field empty</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {(["name", "email"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={k} className="mb-2 block text-sm capitalize text-white/85">{k}</label>
                <input id={k} type={k === "email" ? "email" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="input-glow" />
                {errors[k] && <p className="mt-1.5 text-sm text-red-300">{errors[k]}</p>}
              </div>
            ))}
            <div>
              <label htmlFor="message" className="mb-2 block text-sm text-white/85">Message</label>
              <textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-glow !rounded-2xl" />
              {errors["message"] && <p className="mt-1.5 text-sm text-red-300">{errors["message"]}</p>}
            </div>
            {serverError && <p role="alert" className="text-sm text-red-300">{serverError}</p>}
            <button disabled={sending} className="btn-glow w-full justify-center !bg-white !text-[#183024] hover:!bg-[#e9f2ee] disabled:opacity-60">{sending ? "Sending…" : "Send message"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
