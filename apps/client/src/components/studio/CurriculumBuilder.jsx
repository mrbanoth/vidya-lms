import { useEffect, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, HelpCircle, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";
import { del, errorMessage, patch, post, put } from "@/lib/api";
import { duration } from "@/lib/format";
import { cn } from "@/lib/utils";
import LessonEditor from "./LessonEditor";

const ICON = { video: PlayCircle, article: FileText, quiz: HelpCircle };

function LessonRow({ lesson, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson._id });
  const Icon = ICON[lesson.type];
  const empty = lesson.type === "video" ? !lesson.videoUrl : lesson.type === "article" ? !lesson.content : !lesson.quiz?.questions?.length;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 border-t border-border bg-card px-3 py-2.5 text-sm", isDragging && "relative z-10 opacity-80 shadow-lg")}>
      <button className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing" aria-label={`Drag ${lesson.title}`} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
      <Icon className="size-4 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
      {lesson.isPreview && <Badge tone="blue">Preview</Badge>}
      {empty && <Badge tone="amber">Needs content</Badge>}
      <span className="hidden text-xs text-muted-foreground sm:inline">{lesson.type === "quiz" ? `${lesson.quiz?.questions?.length || 0} Q` : duration(lesson.duration)}</span>
      <Button variant="ghost" size="icon-sm" aria-label="Edit lesson" onClick={onEdit}><Pencil /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Delete lesson" onClick={onDelete}><Trash2 /></Button>
    </li>
  );
}

export default function CurriculumBuilder({ course, refresh }) {
  const [sections, setSections] = useState(course.sections);
  const [editing, setEditing] = useState(null);
  const [newSection, setNewSection] = useState("");
  const [newLesson, setNewLesson] = useState({});
  useEffect(() => setSections(course.sections), [course.sections]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const persistOrder = async (next) => {
    setSections(next);
    try {
      await put(`/instructor/courses/${course._id}/order`, { sections: next.map((s) => ({ id: s._id, lessons: s.lessons.map((l) => l._id) })) });
      toast.success("Order saved");
    } catch (e) {
      toast.error(errorMessage(e));
      refresh();
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.lessons.some((l) => l._id === active.id));
    const to = sections.findIndex((s) => s.lessons.some((l) => l._id === over.id));
    if (from < 0 || to < 0) return;
    const next = sections.map((s) => ({ ...s, lessons: [...s.lessons] }));
    const ai = next[from].lessons.findIndex((l) => l._id === active.id);
    const oi = next[to].lessons.findIndex((l) => l._id === over.id);
    if (from === to) next[from].lessons = arrayMove(next[from].lessons, ai, oi);
    else next[to].lessons.splice(oi, 0, next[from].lessons.splice(ai, 1)[0]);
    persistOrder(next);
  };

  const moveSection = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    persistOrder(arrayMove(sections, i, j));
  };

  const run = (fn, msg) => async (...a) => {
    try {
      await fn(...a);
      if (msg) toast.success(msg);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Drag lessons to reorder them, even between sections. Changes save automatically.</p>
      {sections.length === 0 && <EmptyState title="No sections yet" body="Add your first section below." />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {sections.map((s, i) => (
          <Card key={s._id} className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center gap-2 bg-muted px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Section {i + 1}</span>
              <input
                aria-label="Section title"
                defaultValue={s.title}
                onBlur={(e) => e.target.value.trim() && e.target.value !== s.title && run(() => patch(`/instructor/courses/${course._id}/sections/${s._id}`, { title: e.target.value.trim() }), "Section renamed")()}
                className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 font-semibold focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <Button variant="ghost" size="icon-sm" aria-label="Move section up" disabled={i === 0} onClick={() => moveSection(i, -1)}>↑</Button>
              <Button variant="ghost" size="icon-sm" aria-label="Move section down" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)}>↓</Button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete section" onClick={run(() => del(`/instructor/courses/${course._id}/sections/${s._id}`), "Section deleted")}><Trash2 /></Button>
            </div>
            <SortableContext items={s.lessons.map((l) => l._id)} strategy={verticalListSortingStrategy}>
              <ul>
                {s.lessons.map((l) => (
                  <LessonRow key={l._id} lesson={l} onEdit={() => setEditing(l)} onDelete={run(() => del(`/instructor/lessons/${l._id}`), "Lesson deleted")} />
                ))}
              </ul>
            </SortableContext>
            <form
              className="flex flex-wrap gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = newLesson[s._id] || { title: "", type: "video" };
                if (v.title.trim().length < 2) return;
                run(async () => {
                  const res = await post(`/instructor/courses/${course._id}/sections/${s._id}/lessons`, { title: v.title.trim(), type: v.type });
                  setNewLesson((n) => ({ ...n, [s._id]: { title: "", type: v.type } }));
                  setEditing(res.data);
                })();
              }}
            >
              <Input aria-label="New lesson title" placeholder="New lesson title" value={newLesson[s._id]?.title || ""} onChange={(e) => setNewLesson((n) => ({ ...n, [s._id]: { type: "video", ...n[s._id], title: e.target.value } }))} className="min-w-[180px] flex-1" />
              <select aria-label="Lesson type" className="h-10 rounded-lg border border-input bg-card px-2 text-sm" value={newLesson[s._id]?.type || "video"} onChange={(e) => setNewLesson((n) => ({ ...n, [s._id]: { title: "", ...n[s._id], type: e.target.value } }))}>
                <option value="video">Video</option><option value="article">Article</option><option value="quiz">Quiz</option>
              </select>
              <Button type="submit" variant="outline"><Plus /> Add lesson</Button>
            </form>
          </Card>
        ))}
      </DndContext>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); newSection.trim().length >= 2 && run(async () => { await post(`/instructor/courses/${course._id}/sections`, { title: newSection.trim() }); setNewSection(""); }, "Section added")(); }}>
        <Input aria-label="New section title" placeholder="New section title" value={newSection} onChange={(e) => setNewSection(e.target.value)} className="max-w-sm" />
        <Button type="submit"><Plus /> Add section</Button>
      </form>
      {editing && <LessonEditor key={editing._id} lesson={editing} open onClose={() => setEditing(null)} onSaved={() => refresh()} />}
    </div>
  );
}
