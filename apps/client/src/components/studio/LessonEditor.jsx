import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/kokonut/file-upload";
import { Button, Field, Input, Modal, Select, Spinner, Switch, Textarea } from "@/components/ui";
import { errorMessage, patch } from "@/lib/api";
import { uploadTo } from "./uploadTo";

const blankQ = () => ({ text: "", options: ["", ""], answer: 0, explanation: "" });

/** Edits one lesson: video/article/quiz content, preview flag and resources. */
export default function LessonEditor({ lesson, open, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: lesson.title,
    type: lesson.type,
    videoUrl: lesson.videoUrl || "",
    duration: Math.round((lesson.duration || 0) / 60),
    content: lesson.content || "",
    isPreview: lesson.isPreview,
    resources: lesson.resources || [],
    quiz: lesson.quiz?.questions?.length ? lesson.quiz : { passScore: 80, questions: [blankQ()] },
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setQ = (i, patchQ) => set("quiz", { ...form.quiz, questions: form.quiz.questions.map((q, k) => (k === i ? { ...q, ...patchQ } : q)) });

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        title: form.title,
        type: form.type,
        isPreview: form.isPreview,
        duration: Number(form.duration) * 60,
        resources: form.resources.filter((r) => r.name && r.url),
      };
      if (form.type === "video") body.videoUrl = form.videoUrl;
      if (form.type === "article") body.content = form.content;
      if (form.type === "quiz") body.quiz = { passScore: Number(form.quiz.passScore), questions: form.quiz.questions.map((q) => ({ ...q, options: q.options.filter((o) => o.trim()) })) };
      const res = await patch(`/instructor/lessons/${lesson._id}`, body);
      toast.success("Lesson saved");
      onSaved(res.data);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Edit lesson"
      className="w-[min(760px,calc(100%-2rem))]"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving || form.title.trim().length < 2}>{saving && <Spinner />} Save lesson</Button></>}
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Title" htmlFor="le-title"><Input id="le-title" value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Type" htmlFor="le-type">
            <Select id="le-type" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="video">Video</option><option value="article">Article</option><option value="quiz">Quiz</option>
            </Select>
          </Field>
        </div>

        {form.type === "video" && (
          <>
            <FileUpload
              acceptedFileTypes={["video/mp4", "video/webm", "video/quicktime"]}
              maxFileSize={500 * 1024 * 1024}
              multiple={false}
              maxFiles={1}
              onUpload={uploadTo(`/instructor/lessons/${lesson._id}/upload/video`, (l) => {
                set("videoUrl", l.videoUrl);
                if (l.duration) set("duration", Math.round(l.duration / 60));
              })}
            />
            <Field label="…or paste a video link" htmlFor="le-url" hint="MP4 link or YouTube URL">
              <Input id="le-url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://" />
            </Field>
          </>
        )}
        {form.type === "article" && (
          <Field label="Article (Markdown)" htmlFor="le-content"><Textarea id="le-content" rows={10} value={form.content} onChange={(e) => set("content", e.target.value)} className="font-mono text-[13px]" /></Field>
        )}
        {form.type !== "quiz" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (minutes)" htmlFor="le-dur"><Input id="le-dur" type="number" min={0} value={form.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3">
              <label htmlFor="le-prev" className="text-sm font-semibold">Free preview</label>
              <Switch id="le-prev" checked={form.isPreview} onChange={(v) => set("isPreview", v)} label="Free preview" />
            </div>
          </div>
        )}

        {form.type === "quiz" && (
          <div className="grid gap-4">
            <Field label="Pass mark (%)" htmlFor="le-pass" className="max-w-[160px]"><Input id="le-pass" type="number" min={0} max={100} value={form.quiz.passScore} onChange={(e) => set("quiz", { ...form.quiz, passScore: e.target.value })} /></Field>
            {form.quiz.questions.map((q, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between"><b className="text-sm">Question {i + 1}</b>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete question" disabled={form.quiz.questions.length === 1} onClick={() => set("quiz", { ...form.quiz, questions: form.quiz.questions.filter((_, k) => k !== i) })}><Trash2 /></Button>
                </div>
                <Input aria-label="Question text" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="Question" />
                {q.options.map((o, n) => (
                  <div key={n} className="flex items-center gap-2">
                    <input type="radio" name={`ans-${i}`} aria-label={`Mark option ${n + 1} correct`} checked={q.answer === n} onChange={() => setQ(i, { answer: n })} className="size-4 accent-[var(--primary)]" />
                    <Input aria-label={`Option ${n + 1}`} value={o} onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === n ? e.target.value : x)) })} placeholder={`Option ${n + 1}`} />
                    <Button variant="ghost" size="icon-sm" aria-label="Remove option" disabled={q.options.length <= 2} onClick={() => setQ(i, { options: q.options.filter((_, k) => k !== n), answer: q.answer >= n && q.answer > 0 ? q.answer - 1 : q.answer })}><Trash2 /></Button>
                  </div>
                ))}
                {q.options.length < 6 && <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setQ(i, { options: [...q.options, ""] })}><Plus /> Option</Button>}
                <Input aria-label="Explanation" value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Explanation shown after answering (optional)" />
              </div>
            ))}
            <Button variant="outline" className="justify-self-start" onClick={() => set("quiz", { ...form.quiz, questions: [...form.quiz.questions, blankQ()] })}><Plus /> Add question</Button>
          </div>
        )}

        <div className="grid gap-2">
          <span className="text-[13px] font-semibold">Resources</span>
          {form.resources.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label="Resource name" value={r.name} onChange={(e) => set("resources", form.resources.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" className="max-w-[200px]" />
              <Input aria-label="Resource link" value={r.url} onChange={(e) => set("resources", form.resources.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} placeholder="https://" />
              <Button variant="ghost" size="icon" aria-label="Remove resource" onClick={() => set("resources", form.resources.filter((_, k) => k !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => set("resources", [...form.resources, { name: "", url: "" }])}><Plus /> Add link</Button>
        </div>
      </div>
    </Modal>
  );
}
