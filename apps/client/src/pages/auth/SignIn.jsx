import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginSchema } from "@vidya/shared";
import AuthShell from "@/components/layout/AuthShell";
import { Button, Field, Input, Spinner } from "@/components/ui";
import GoogleButton from "@/features/auth/GoogleButton";
import { startSession } from "@/features/auth/session";
import { api, errorMessage } from "@/lib/api";
import { homeFor } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";

const DEMO = [
  ["Student", "student@vidya.dev"],
  ["Instructor", "priya@vidya.dev"],
  ["Admin", "admin@vidya.dev"],
];

export default function SignIn() {
  useTitle("Sign in");
  const [params] = useSearchParams();
  const next = params.get("next");
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setFormError("");
    try {
      const res = await api.post("/auth/login", values);
      await startSession(res.data.data);
      toast.success(`Welcome back, ${res.data.data.user.name.split(" ")[0]}`);
      navigate(next && next.startsWith("/") ? next : homeFor(res.data.data.user.role), { replace: true });
    } catch (e) {
      if (e.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast.info(e.response.data.message);
        return navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }
      setFormError(errorMessage(e));
    }
  };

  return (
    <AuthShell>
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-extrabold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to continue learning.</p>
      </div>
      <GoogleButton next={next} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="si-email" error={errors.email?.message}>
          <Input id="si-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field
          label="Password"
          htmlFor="si-pass"
          error={errors.password?.message}
          action={<Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>}
        >
          <div className="relative">
            <Input id="si-pass" type={show ? "text" : "password"} autoComplete="current-password" className="pr-10" invalid={!!errors.password} {...register("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting && <Spinner />} Sign in</Button>
      </form>
      <div className="grid gap-2 rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        <span>Demo accounts (password <b className="font-mono">Password123</b>)</span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {DEMO.map(([label, email]) => (
            <button
              key={email}
              type="button"
              className="cursor-pointer rounded-md bg-muted px-2.5 py-1 font-semibold text-foreground hover:bg-accent"
              onClick={() => {
                setValue("email", email);
                setValue("password", "Password123");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        New to Vidya? <Link to={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
