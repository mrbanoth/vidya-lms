import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { LANGUAGES, LEVELS } from "@vidya/shared";
import { Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { get } from "@/lib/api";

export default function DetailsForm({ course, onSave }) {
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => get("/categories").then((r) => r.data) });
  const { register, handleSubmit, control, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      title: course.title,
      subtitle: course.subtitle,
      category: course.category?._id,
      level: course.level,
      language: course.language,
      description: course.description,
      outcomes: (course.outcomes.length ? course.outcomes : [""]).map((v) => ({ v })),
      requirements: (course.requirements.length ? course.requirements : [""]).map((v) => ({ v })),
    },
  });
  const outcomes = useFieldArray({ control, name: "outcomes" });
  const reqs = useFieldArray({ control, name: "requirements" });
  const submit = (v) =>
    onSave({
      ...v,
      outcomes: v.outcomes.map((o) => o.v.trim()).filter(Boolean),
      requirements: v.requirements.map((o) => o.v.trim()).filter(Boolean),
    });

  const list = (fa, name, label, placeholder) => (
    <div className="grid gap-2">
      <span className="text-[13px] font-semibold">{label}</span>
      {fa.fields.map((f, i) => (
        <div key={f.id} className="flex gap-2">
          <Input aria-label={`${label} ${i + 1}`} placeholder={placeholder} {...register(`${name}.${i}.v`)} />
          <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => fa.remove(i)} disabled={fa.fields.length === 1}><X /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => fa.append({ v: "" })}><Plus /> Add</Button>
    </div>
  );

  return (
    <Card as="form" onSubmit={handleSubmit(submit)} className="grid gap-5 p-6">
      <Field label="Title" htmlFor="d-title"><Input id="d-title" maxLength={90} {...register("title", { required: true, minLength: 5 })} /></Field>
      <Field label="Subtitle" htmlFor="d-sub"><Input id="d-sub" maxLength={160} {...register("subtitle")} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category" htmlFor="d-cat"><Select id="d-cat" {...register("category")}>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></Field>
        <Field label="Level" htmlFor="d-level"><Select id="d-level" {...register("level")}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Language" htmlFor="d-lang"><Select id="d-lang" {...register("language")}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</Select></Field>
      </div>
      <Field label="Description" htmlFor="d-desc" hint="Markdown works. Aim for 100+ characters.">
        <Textarea id="d-desc" rows={8} {...register("description")} />
      </Field>
      <div className="grid gap-6 md:grid-cols-2">
        {list(outcomes, "outcomes", "What learners will learn", "e.g. Build a REST API with Express")}
        {list(reqs, "requirements", "Requirements", "e.g. Basic JavaScript")}
      </div>
      <Button type="submit" className="justify-self-start" disabled={isSubmitting || !isDirty}>{isSubmitting && <Spinner />} Save details</Button>
    </Card>
  );
}
