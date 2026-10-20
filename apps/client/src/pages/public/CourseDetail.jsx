import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Clock, FileText, Globe, Heart, HelpCircle, PlayCircle, RefreshCw, ShoppingCart, Smartphone, Trophy } from "lucide-react";
import ParticleButton from "@/components/kokonut/particle-button";
import { Avatar, Badge, Button, Card, Modal, Pagination, Progress, Skeleton, Stars } from "@/components/ui";
import CourseThumb from "@/components/course/CourseThumb";
import Price from "@/components/course/Price";
import { CourseGrid } from "@/components/course/CourseCard";
import VideoPlayer from "@/components/player/VideoPlayer";
import Markdown from "@/components/shared/Markdown";
import { get } from "@/lib/api";
import { compact, date, duration, num, pctOff, timeAgo } from "@/lib/format";
import { useCart, useWishlist } from "@/features/cart/useCart";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

const ICON = { video: PlayCircle, article: FileText, quiz: HelpCircle };

function Curriculum({ course, onPreview }) {
  const [open, setOpen] = useState(() => new Set([course.sections[0]?._id]));
  const all = open.size === course.sections.length;
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-bold">Course content</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono text-xs">
            {course.sections.length} sections · {course.totalLessons} lessons · {duration(course.totalDuration)}
          </span>
          <button className="cursor-pointer font-semibold text-primary" onClick={() => setOpen(all ? new Set() : new Set(course.sections.map((s) => s._id)))}>
            {all ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {course.sections.map((s, i) => {
          const isOpen = open.has(s._id);
          return (
            <div key={s._id} className="border-b border-border last:border-0">
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-3 bg-muted/60 px-4 py-3.5 text-left font-semibold"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => { const n = new Set(o); n.has(s._id) ? n.delete(s._id) : n.add(s._id); return n; })}
              >
                <span className="flex items-center gap-2">
                  <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                  {i + 1}. {s.title}
                </span>
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {s.lessons.length} lessons · {duration(s.lessons.reduce((t, l) => t + l.duration, 0))}
                </span>
              </button>
              {isOpen &&
                s.lessons.map((l) => {
                  const Icon = ICON[l.type] || PlayCircle;
                  return (
                    <div key={l._id} className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 pl-10 text-sm">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{l.title}</span>
                        {l.isPreview && l.videoUrl && (
                          <button className="cursor-pointer font-semibold text-primary hover:underline" onClick={() => onPreview(l)}>
                            Preview
                          </button>
                        )}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {l.type === "quiz" ? "Quiz" : duration(l.duration)}
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Reviews({ course }) {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ["reviews", course.slug, page],
    queryFn: () => get(`/courses/${course.slug}/reviews`, { page }),
  });
  const total = course.ratingDistribution.reduce((t, r) => t + r.count, 0) || 1;
  return (
    <section className="grid gap-5">
      <h2 className="text-2xl font-bold">Student reviews</h2>
      <div className="grid items-center gap-6 sm:grid-cols-[160px_1fr]">
        <div className="grid justify-items-center gap-1 text-center">
          <b className="font-display text-6xl font-extrabold text-warning">{course.ratingAvg?.toFixed(1) || "–"}</b>
          <Stars value={course.ratingAvg} />
          <span className="text-xs text-muted-foreground">{num(course.ratingCount)} ratings</span>
        </div>
        <div className="grid gap-1.5 text-sm">
          {course.ratingDistribution.map((r) => (
            <div key={r.star} className="grid grid-cols-[36px_1fr_40px] items-center gap-3">
              <span className="font-mono text-xs">{r.star} ★</span>
              <Progress value={(r.count / total) * 100} barClassName="bg-warning" label={`${r.star} star`} />
              <span className="text-right font-mono text-xs text-muted-foreground">{Math.round((r.count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        {data?.data.map((r) => (
          <Card key={r._id} className="grid gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={r.user?.name} src={r.user?.avatar} size={36} />
              <div>
                <b className="block text-sm">{r.user?.name}</b>
                <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              <Stars value={r.rating} className="ml-auto" />
            </div>
            {r.comment && <p className="text-[15px]">{r.comment}</p>}
          </Card>
        ))}
        {data?.data.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Enrolled learners can leave one from the course player.</p>}
      </div>
      <Pagination page={page} pages={data?.meta.pages} onChange={setPage} />
    </section>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const cart = useCart();
  const wishlist = useWishlist();
  const [preview, setPreview] = useState(null);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["course", slug, Boolean(user)],
    queryFn: () => get(`/courses/${slug}`).then((r) => r.data),
  });
  const { data: related = [] } = useQuery({
    queryKey: ["related", slug],
    queryFn: () => get(`/courses/${slug}/related`).then((r) => r.data),
  });
  useTitle(course?.title);

  if (isError) return <NotFound />;
  if (isLoading)
    return (
      <div className="container-page grid gap-4 py-10">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const v = course.viewer;
  const inCart = cart.has(course._id);
  const saved = wishlist.has(course._id);
  const off = pctOff(course);
  const firstPreview = course.sections.flatMap((s) => s.lessons).find((l) => l.isPreview && l.videoUrl);

  const buyNow = async () => {
    if (!user) return navigate(`/sign-in?next=/courses/${slug}`);
    if (!inCart) await cart.add.mutateAsync(course);
    navigate("/checkout");
  };

  const buyBox = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_24px_60px_-30px_rgba(10,30,20,.5)]">
      <button className="group relative block w-full cursor-pointer" onClick={() => firstPreview && setPreview(firstPreview)} aria-label="Preview this course">
        <CourseThumb course={course} large>
          {firstPreview && (
            <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-90 transition group-hover:bg-black/35">
              <span className="grid justify-items-center gap-2 text-sm font-semibold text-white">
                <PlayCircle className="size-14" strokeWidth={1.4} />
                Preview this course
              </span>
            </span>
          )}
        </CourseThumb>
      </button>
      <div className="grid gap-3 p-5">
        {v.enrolled || v.isOwner ? (
          <>
            {v.enrolled && (
              <div className="grid gap-1.5">
                <span className="text-sm text-muted-foreground">Your progress · {v.progress}%</span>
                <Progress value={v.progress} />
              </div>
            )}
            <Button size="lg" onClick={() => navigate(`/learn/${course._id}`)}>
              {v.progress > 0 ? "Continue learning" : v.isOwner ? "Open as instructor" : "Start learning"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <Price course={course} size="lg" />
              {off > 0 && <Badge tone="red">{off}% off</Badge>}
            </div>
            {course.isFree ? (
              <Button size="lg" onClick={buyNow}>Enroll for free</Button>
            ) : inCart ? (
              <Button size="lg" onClick={() => navigate("/cart")}><ShoppingCart /> Go to cart</Button>
            ) : (
              <div className="flex gap-2">
                <ParticleButton
                  className="h-12 rounded-xl px-5 text-[15px]"
                  icon={<ShoppingCart className="size-4" />}
                  successLabel="Added"
                  onClick={() => cart.add.mutateAsync(course)}
                  onSuccess={() => qc.invalidateQueries({ queryKey: ["cart"] })}
                >
                  Add to cart
                </ParticleButton>
                <Button size="lg" variant="outline" className="flex-1" onClick={buyNow}>Buy now</Button>
              </div>
            )}
            {!course.isFree && inCart && <Button size="lg" variant="outline" onClick={buyNow}>Buy now</Button>}
          </>
        )}
        {!v.isOwner && (
          <Button
            variant="ghost"
            onClick={() => (user ? wishlist.toggle.mutate({ course, on: !saved }) : navigate(`/sign-in?next=/courses/${slug}`))}
          >
            <Heart className={cn(saved && "fill-current text-destructive")} /> {saved ? "In your wishlist" : "Add to wishlist"}
          </Button>
        )}
        {!course.isFree && !v.enrolled && <p className="text-center text-xs text-muted-foreground">30-day money-back guarantee</p>}
        <ul className="grid gap-2 border-t border-border pt-4 text-sm">
          {[
            [Clock, `${duration(course.totalDuration)} on-demand video`],
            [FileText, `${course.totalLessons} lessons and quizzes`],
            [Smartphone, "Access on mobile and desktop"],
            [Trophy, "Certificate of completion"],
            [RefreshCw, "Lifetime access and updates"],
          ].map(([Icon, text]) => (
            <li key={text} className="flex items-center gap-2.5">
              <Icon className="size-4 text-muted-foreground" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-ink text-ink-foreground">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
          <div className="grid min-w-0 content-start gap-4">
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 font-mono text-xs text-ink-foreground/65">
              <Link to="/courses" className="hover:text-ink-foreground">Courses</Link> /
              <Link to={`/categories/${course.category.slug}`} className="hover:text-ink-foreground">{course.category.name}</Link>
            </nav>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-tight">{course.title}</h1>
            <p className="max-w-[60ch] text-lg text-ink-foreground/75">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {course.bestseller && <Badge tone="amber">Bestseller</Badge>}
              {course.status !== "published" && <Badge tone="grey">{course.status}</Badge>}
              <span className="flex items-center gap-1.5">
                <b className="text-warning">{course.ratingAvg?.toFixed(1)}</b>
                <Stars value={course.ratingAvg} size={13} />
                <span className="text-ink-foreground/65">({num(course.ratingCount)} ratings)</span>
              </span>
              <span className="text-ink-foreground/65">{num(course.studentsCount)} learners</span>
            </div>
            <p className="text-sm">
              Created by{" "}
              <Link to={`/instructors/${course.instructor._id}`} className="font-semibold text-primary hover:underline">
                {course.instructor.name}
              </Link>
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-ink-foreground/65">
              <span className="flex items-center gap-1.5"><RefreshCw className="size-4" /> Updated {date(course.updatedAt, { month: "short", year: "numeric" })}</span>
              <span className="flex items-center gap-1.5"><Globe className="size-4" /> {course.language}</span>
              <span>{course.level}</span>
            </div>
          </div>
          <div className="lg:row-span-2 lg:-mb-72">{buyBox}</div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-10 lg:grid-cols-[1fr_360px]">
        <div className="grid min-w-0 content-start gap-12">
          {course.outcomes?.length > 0 && (
            <Card className="grid gap-4 p-6">
              <h2 className="text-2xl font-bold">What you will learn</h2>
              <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {o}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Curriculum course={course} onPreview={setPreview} />
          {course.requirements?.length > 0 && (
            <section className="grid gap-3">
              <h2 className="text-2xl font-bold">Requirements</h2>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {course.requirements.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}
          <section className="grid gap-3">
            <h2 className="text-2xl font-bold">Description</h2>
            <Markdown>{course.description}</Markdown>
          </section>
          <section className="grid gap-4">
            <h2 className="text-2xl font-bold">Instructor</h2>
            <Card className="grid gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={course.instructor.name} src={course.instructor.avatar} size={64} />
                <div className="grid gap-0.5">
                  <Link to={`/instructors/${course.instructor._id}`} className="font-display text-lg font-bold text-primary hover:underline">
                    {course.instructor.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">{course.instructor.headline}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ★ {course.instructorStats.rating} · {compact(course.instructorStats.students)} learners · {course.instructorStats.courses} courses
                  </span>
                </div>
              </div>
              {course.instructor.bio && <p className="text-muted-foreground">{course.instructor.bio}</p>}
            </Card>
          </section>
          <Reviews course={course} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page grid gap-5">
          <h2 className="text-2xl font-bold">Learners also bought</h2>
          <CourseGrid courses={related} />
        </section>
      )}

      <Modal open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)} title={preview?.title} description={`Free preview · ${course.title}`} className="w-[min(860px,calc(100%-2rem))]">
        {preview && <VideoPlayer url={preview.videoUrl} title={preview.title} />}
      </Modal>
    </>
  );
}
