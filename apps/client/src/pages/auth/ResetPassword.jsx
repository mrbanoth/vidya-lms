import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { resetPasswordSchema } from "@vidya/shared";
import AuthShell from "@/components/layout/AuthShell";
import { Button, EmptyState, Field, Input, Spinner } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";

const schema = resetPasswordSchema
  .extend({ confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export default function ResetPassword() {
  useTitle("Reset password");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { token } });
  if (!token)
    return (
      <AuthShell>
        <EmptyState title="This reset link is incomplete" body="Open the link from your email again, or request a new one." action={<Button asChild><Link to="/forgot-password">Request a new link</Link></Button>} />
      </AuthShell>
    );
  return (
    <AuthShell>
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-extrabold">Set a new password</h1>
        <p className="text-muted-foreground">You will be signed out of other devices after this change.</p>
      </div>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={handleSubmit(async ({ password }) => {
          try {
            const res = await post("/auth/reset-password", { token, password });
            toast.success(res.message);
            navigate("/sign-in", { replace: true });
          } catch (e) {
            setError("password", { message: errorMessage(e) });
          }
        })}
      >
        <Field label="New password" htmlFor="rp-1" error={errors.password?.message}>
          <Input id="rp-1" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="rp-2" error={errors.confirm?.message}>
          <Input id="rp-2" type="password" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <Button size="lg" type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />} Update password</Button>
      </form>
    </AuthShell>
  );
}
