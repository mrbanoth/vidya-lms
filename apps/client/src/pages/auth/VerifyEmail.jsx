import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import AuthShell from "@/components/layout/AuthShell";
import { Badge, Button, Spinner } from "@/components/ui";
import { startSession } from "@/features/auth/session";
import { errorMessage, post } from "@/lib/api";
import { homeFor } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";

export default function VerifyEmail() {
  useTitle("Verify your email");
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const navigate = useNavigate();
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const refs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async (code = digits.join("")) => {
    if (code.length !== 6) return setError("Enter all 6 digits.");
    setBusy(true);
    setError("");
    try {
      const res = await post("/auth/verify-email", { email, code });
      await startSession(res.data);
      toast.success("Email verified. Welcome to Vidya!");
      const next = params.get("next");
      navigate(next && next.startsWith("/") ? next : homeFor(res.data.user.role), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const setAt = (i, v) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      const filled = [...next, ...Array(6 - next.length).fill("")];
      setDigits(filled);
      refs.current[Math.min(5, next.length)]?.focus();
      if (next.length === 6) submit(next.join(""));
      return;
    }
    const nextDigits = digits.map((d, k) => (k === i ? clean : d));
    setDigits(nextDigits);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (nextDigits.every(Boolean)) submit(nextDigits.join(""));
  };

  return (
    <AuthShell>
      <Badge className="justify-self-start">Last step</Badge>
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-extrabold">Check your email</h1>
        <p className="text-muted-foreground">
          We sent a 6-digit code to <b className="text-foreground">{email || "your email"}</b>. It expires in 10 minutes.
        </p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4">
        <div className="grid grid-cols-6 gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={6}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && refs.current[i - 1]?.focus()}
              className="h-14 w-full min-w-0 rounded-xl border border-input bg-card text-center font-mono text-2xl font-bold focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
            />
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button size="lg" type="submit" disabled={busy}>{busy && <Spinner />} Verify email</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Did not get it?{" "}
        <button
          className="cursor-pointer font-semibold text-primary disabled:cursor-default disabled:text-muted-foreground"
          disabled={cooldown > 0 || !email}
          onClick={async () => {
            try {
              await post("/auth/resend-code", { email });
              toast.success("New code sent");
              setCooldown(45);
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        >
          {cooldown > 0 ? `Resend in 0:${String(cooldown).padStart(2, "0")}` : "Resend code"}
        </button>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        In development without SMTP, the code is printed in the server terminal. <Link to="/sign-in" className="text-primary">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
