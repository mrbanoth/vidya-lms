import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/kokonut/file-upload";
import { Button, Card, Field, Input, Skeleton, Spinner, StatusPill } from "@/components/ui";
import EditorSteps from "@/components/course/EditorSteps";
import CourseThumb from "@/components/course/CourseThumb";
import DetailsForm from "@/components/studio/DetailsForm";
import CurriculumBuilder from "@/components/studio/CurriculumBuilder";
import { uploadTo } from "@/components/studio/uploadTo";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import { money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";
import { useConfig } from "@/hooks/useConfig";
import { cn } from "@/lib/utils";

function Pricing({ course, onSave }) {
  const config = useConfig();
  const [price, setPrice] = useState(course.price);
  const [discount, setDiscount] = useState(course.discountPrice ?? "");
  const [busy, setBusy] = useState(false);
  const paid = Number(price) > 0;
  const effective = discount !== "" && Number(discount) < Number(price) ? Number(discount) : Number(price);
  return (
    <Card className="grid max-w-2xl gap-5 p-6">
      <div className="flex gap-2">
        {[["Free", 0], ["Paid", course.price || 1999]].map(([l, v]) => (
          <button key={l} onClick={() => { setPrice(v); if (!v) setDiscount(""); }} aria-pressed={(l === "Paid") === paid} className={cn("cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold", (l === "Paid") === paid ? "border-foreground bg-foreground text-background" : "border-border")}>{l}</button>
        ))}
      </div>
      {paid && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="List price (₹)" htmlFor="pr-price"><Input id="pr-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="Sale price (₹)" htmlFor="pr-disc" hint="Leave empty for no sale"><Input id="pr-disc" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
        </div>
      )}
      <div className="grid gap-1 rounded-xl bg-muted p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Learner pays (before GST)</span><b>{money(effective)}</b></div>
        <div className="flex justify-between"><span className="text-muted-foreground">You earn per sale ({config.revenueShare}%)</span><b className="text-primary">{money((effective * config.revenueShare) / 100)}</b></div>
      </div>
      <Button
        className="justify-self-start"
        disabled={busy}
        onClick={async () => { setBusy(true); await onSave({ price: Number(price), discountPrice: paid && discount !== "" ? Number(discount) : null }); setBusy(false); }}
      >
        {busy && <Spinner />} Save pricing
      </Button>
    </Card>
  );
}

function Media({ course, refresh }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="grid content-start gap-4 p-6">
        <h3 className="text-lg font-bold">Thumbnail</h3>
        <CourseThumb course={course} className="rounded-xl" />
        <FileUpload acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]} maxFileSize={5 * 1024 * 1024} multiple={false} maxFiles={1} onUpload={uploadTo(`/instructor/courses/${course._id}/media/thumbnail`, refresh)} />
        <p className="text-xs text-muted-foreground">1280×720 JPG, PNG or WebP. Without one, the course shows its colour and icon.</p>
      </Card>
      <Card className="grid content-start gap-4 p-6">
        <h3 className="text-lg font-bold">Promo video</h3>
        <FileUpload acceptedFileTypes={["video/mp4", "video/webm"]} maxFileSize={500 * 1024 * 1024} multiple={false} maxFiles={1} onUpload={uploadTo(`/instructor/courses/${course._id}/media/promo`, refresh)} />
        <p className="text-xs text-muted-foreground">{course.promoVideo ? "A promo video is uploaded." : "Optional. One to two minutes works best."} Lessons marked “Free preview” also appear on the course page.</p>
      </Card>
    </div>
  );
}

function Publish({ course, refresh }) {
  const navigate = useNavigate();
  const { data: list = [] } = useQuery({ queryKey: ["checklist", course._id, course.updatedAt], queryFn: () => get(`/instructor/courses/${course._id}/checklist`).then((r) => r.data) });
  const act = useMutation({
    mutationFn: (a) => (a === "delete" ? del(`/instructor/courses/${course._id}`) : post(`/instructor/courses/${course._id}/${a}`)),
    onSuccess: (r, a) => { toast.success(r.message || "Done"); a === "delete" ? navigate("/studio/courses") : refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="grid max-w-2xl gap-5">
      <Card className="grid gap-3 p-6">
        <h3 className="text-lg font-bold">Before you submit</h3>
        <ul className="grid gap-2">
          {list.map((i) => (
            <li key={i.key} className="flex items-center gap-2.5 text-sm">
              {i.done ? <Check className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
              <span className={cn(!i.done && "text-muted-foreground")}>{i.label}</span>
            </li>
          ))}
        </ul>
        {course.status === "rejected" && course.reviewNote && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm"><b className="text-destructive">Reviewer notes</b><p className="mt-1">{course.reviewNote}</p></div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          {["draft", "rejected"].includes(course.status) && <Button onClick={() => act.mutate("submit")} disabled={act.isPending}>Submit for review</Button>}
          {course.status === "review" && <p className="text-sm text-muted-foreground">In review. We will notify you when it is approved.</p>}
          {course.status === "published" && <Button variant="outline" onClick={() => act.mutate("unpublish")}>Unpublish</Button>}
          {course.studentsCount === 0 && <Button variant="destructive-soft" onClick={() => act.mutate("delete")}>Delete course</Button>}
        </div>
      </Card>
    </div>
  );
}

const STEPS = [["details", "Details"], ["curriculum", "Curriculum"], ["pricing", "Pricing"], ["media", "Media"], ["publish", "Publish"]];

export default function CourseEditor() {
  const { id, tab = "curriculum" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: course, isLoading } = useQuery({ queryKey: ["studio-course", id], queryFn: () => get(`/instructor/courses/${id}`).then((r) => r.data) });
  useTitle(course ? `Edit · ${course.title}` : "Edit course");
  const refresh = () => qc.invalidateQueries({ queryKey: ["studio-course", id] });
  const save = async (body) => {
    try {
      await patch(`/instructor/courses/${id}`, body);
      toast.success("Saved");
      refresh();
      qc.invalidateQueries({ queryKey: ["instructor-courses"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  if (isLoading) return <Skeleton className="h-96" />;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <Link to="/studio/courses" className="text-sm font-semibold text-primary">← My courses</Link>
          <h1 className="text-2xl font-extrabold">{course.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><StatusPill status={course.status} /> {course.totalLessons} lessons</div>
        </div>
        <Button variant="outline" asChild><a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer"><ExternalLink /> Preview page</a></Button>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <Card className="p-2 lg:sticky lg:top-20">
          <EditorSteps
            steps={STEPS}
            value={tab}
            onSelect={(t) => navigate(`/studio/courses/${id}/${t}`)}
            done={[
              course.subtitle && course.category && "details",
              course.totalLessons > 0 && "curriculum",
              course.thumbnail && "media",
              course.status === "published" && "publish",
            ].filter(Boolean)}
          />
        </Card>
        <div className="grid min-w-0 gap-6">
          {tab === "details" && <DetailsForm key={course.updatedAt} course={course} onSave={save} />}
          {tab === "curriculum" && <CurriculumBuilder course={course} refresh={refresh} />}
          {tab === "pricing" && <Pricing course={course} onSave={save} />}
          {tab === "media" && <Media course={course} refresh={refresh} />}
          {tab === "publish" && <Publish course={course} refresh={refresh} />}
        </div>
      </div>
    </>
  );
}
