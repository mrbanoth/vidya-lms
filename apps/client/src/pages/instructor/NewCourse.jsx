import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { courseBasicsSchema, LANGUAGES, LEVELS } from "@vidya/shared";
import { Button, Card, Field, Input, PageHeader, Select, Spinner } from "@/components/ui";
import { errorMessage, get, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";

export default function NewCourse() {
  useTitle("New course");
  const navigate = useNavigate();
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => get("/categories").then((r) => r.data) });
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(courseBasicsSchema),
    defaultValues: { level: "Beginner", language: "English" },
  });
  const title = watch("title") || "";
  return (
    <>
      <PageHeader eyebrow="Step 1 of 5" title="Create a course" description="Start with the basics. You can change everything later." />
      <Card
        as="form"
        noValidate
        className="grid max-w-2xl gap-5 p-6"
        onSubmit={handleSubmit(async (v) => {
          try {
            const res = await post("/instructor/courses", v);
            toast.success("Draft created");
            navigate(`/studio/courses/${res.data._id}/details`);
          } catch (e) {
            toast.error(errorMessage(e));
          }
        })}
      >
        <Field label="Course title" htmlFor="nc-title" error={errors.title?.message} hint={`${title.length}/90 · Be specific, e.g. “GraphQL with Apollo and Node”`}>
          <Input id="nc-title" maxLength={90} invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Subtitle" htmlFor="nc-sub" error={errors.subtitle?.message}><Input id="nc-sub" placeholder="One line on what learners will build" {...register("subtitle")} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" htmlFor="nc-cat" error={errors.category && "Choose a category"}>
            <Select id="nc-cat" defaultValue="" {...register("category")}>
              <option value="" disabled>Choose…</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Level" htmlFor="nc-level"><Select id="nc-level" {...register("level")}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
          <Field label="Language" htmlFor="nc-lang"><Select id="nc-lang" {...register("language")}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        </div>
        <Button type="submit" size="lg" className="justify-self-start" disabled={isSubmitting}>{isSubmitting && <Spinner />} Create draft</Button>
      </Card>
    </>
  );
}
