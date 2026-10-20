import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { registerSchema } from "@vidya/shared";
import AuthShell from "@/components/layout/AuthShell";
import { Button, Chip, Field, Input, Spinner } from "@/components/ui";
import GoogleButton from "@/features/auth/GoogleButton";
import { errorMessage, fieldErrors, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

function strength(pw = "") {
  return [pw.length >= 8, /\d/.test(pw), /[^A-Za-z0-9]/.test(pw), /[A-Z]/.test(pw) && /[a-z]/.test(pw)].filter(Boolean).length;
}
const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];

export default function SignUp() {
  useTitle("Create account");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: params.get("role") === "instructor" ? "instructor" : "student" },
  });
  const role = watch("role");
  const s = strength(watch("password"));

  const onSubmit = async (values) => {
    try {
      const res = await post("/auth/register", values);
      toast.success(res.message);
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}${params.get("next") ? `&next=${encodeURIComponent(params.get("next"))}` : ""}`);
    } catch (e) {
      const fe = fieldErrors(e);
      if (Object.keys(fe).length) Object.entries(fe).forEach(([k, m]) => setError(k, { message: m }));
      else setError("email", { message: errorMessage(e) });
    }
  };

  return (
    <AuthShell tabs title="Start learning with Vidya">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-extrabold">Create your account</h1>
        <p className="text-muted-foreground">Free forever. No card needed.</p>
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Account type">
        <Chip active={role === "student"} onClick={() => setValue("role", "student")}>I want to learn</Chip>
        <Chip active={role === "instructor"} onClick={() => setValue("role", "instructor")}>I want to teach</Chip>
      </div>
      <GoogleButton />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label="Full name" htmlFor="su-name" error={errors.name?.message}>
          <Input id="su-name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="su-email" error={errors.email?.message}>
          <Input id="su-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="su-pass" error={errors.password?.message}>
          <div className="relative">
            <Input id="su-pass" type={show ? "text" : "password"} autoComplete="new-password" className="pr-10" invalid={!!errors.password} {...register("password")} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1 rounded-full bg-border", i < s && (s < 2 ? "bg-destructive" : s < 3 ? "bg-warning" : "bg-primary"))} />)}
          </div>
          <span className="text-xs text-muted-foreground" aria-live="polite">{watch("password") ? `${LABELS[s]} password` : "Use 8+ characters with a letter and a number."}</span>
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting && <Spinner />} Create account</Button>
        <p className="text-center text-xs text-muted-foreground">By signing up you agree to the Terms and Privacy Policy.</p>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
