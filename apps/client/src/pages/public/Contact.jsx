import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema } from "@vidya/shared";
import { Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { errorMessage, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";

export default function Contact() {
  useTitle("Contact");
  const config = useConfig();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: "Course question" },
  });
  const onSubmit = async (values) => {
    try {
      const res = await post("/contact", values);
      toast.success(res.message);
      reset({ topic: values.topic, name: "", email: "", message: "" });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <div className="container-page grid items-start gap-10 py-12 lg:grid-cols-2">
      <div className="grid gap-5">
        <span className="eyebrow">Contact</span>
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-extrabold">Talk to us</h1>
        <p className="text-muted-foreground">We reply within one working day.</p>
        <Card className="grid gap-4">
          {[["Support email", config.supportEmail || "Use the form"], ["Response time", "Within one working day"]].map(([k, v]) => (
            <div key={k} className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="select-all font-mono text-sm">{v}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 p-7">
        <Field label="Full name" htmlFor="c-name" error={errors.name?.message}>
          <Input id="c-name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
          <Input id="c-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Topic" htmlFor="c-topic">
          <Select id="c-topic" {...register("topic")}>
            {["Course question", "Billing", "Teams plan", "Teaching on Vidya", "Something else"].map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Message" htmlFor="c-msg" error={errors.message?.message}>
          <Textarea id="c-msg" rows={5} invalid={!!errors.message} {...register("message")} />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting && <Spinner />} Send message</Button>
      </Card>
    </div>
  );
}
