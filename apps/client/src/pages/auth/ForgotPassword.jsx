import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { emailOnlySchema } from "@vidya/shared";
import AuthShell from "@/components/layout/AuthShell";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";

export default function ForgotPassword() {
  useTitle("Forgot password");
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(emailOnlySchema) });
  return (
    <AuthShell>
      {sent ? (
        <div className="grid gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground"><MailCheck /></span>
          <h1 className="text-3xl font-extrabold">Check your inbox</h1>
          <p className="text-muted-foreground">If an account exists for that email, a reset link is on its way. It works for 30 minutes.</p>
          <Button variant="outline" asChild><Link to="/sign-in">Back to sign in</Link></Button>
        </div>
      ) : (
        <>
          <div className="grid gap-1.5">
            <h1 className="text-3xl font-extrabold">Forgot your password?</h1>
            <p className="text-muted-foreground">Enter your account email and we will send a reset link.</p>
          </div>
          <form
            noValidate
            className="grid gap-4"
            onSubmit={handleSubmit(async (v) => {
              try {
                await post("/auth/forgot-password", v);
                setSent(true);
              } catch (e) {
                setError("email", { message: errorMessage(e) });
              }
            })}
          >
            <Field label="Email" htmlFor="fp-email" error={errors.email?.message}>
              <Input id="fp-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
            </Field>
            <Button size="lg" type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />} Send reset link</Button>
          </form>
          <Link to="/sign-in" className="text-center text-sm font-semibold text-primary">← Back to sign in</Link>
        </>
      )}
    </AuthShell>
  );
}
