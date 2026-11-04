import { useState } from "react";
import { toast } from "sonner";
import { ApiError, loginApi, type AuthUser } from "@/lib/api";

// store-owner login, only used on the /admin page (customers never log in)
export function AuthForm({ onDone }: { onDone: (u: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await loginApi(email, password);
      toast.success(`Welcome, ${u.name}`);
      onDone(u);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="input-glow" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className="input-glow" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="btn-glow w-full justify-center">{busy ? "Please wait…" : "Log in"}</button>
      </form>
    </div>
  );
}
