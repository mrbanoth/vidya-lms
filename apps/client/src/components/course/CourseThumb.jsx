import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BarChart3, Briefcase, Cloud, Code2, Database, Palette, Smartphone, Sparkles } from "lucide-react";

const ICONS = [
  [/react|node|javascript|typescript|web|mern|html|css|frontend|backend|full.?stack|api/i, Code2],
  [/mongo|sql|database|data(?! science)/i, Database],
  [/machine|python|ai\b|llm|data science|analytics/i, BarChart3],
  [/design|figma|ui|ux|tailwind/i, Palette],
  [/mobile|android|ios|react native|flutter|kotlin/i, Smartphone],
  [/docker|devops|cloud|aws|kubernetes|ci\b/i, Cloud],
  [/career|interview|system design|business|marketing/i, Briefcase],
];
const iconFor = (course) =>
  ICONS.find(([rx]) => rx.test(`${course.title} ${course.category?.name || ""}`))?.[1] || Sparkles;

/**
 * Uploaded thumbnail when present; otherwise a solid tile in the course
 * colour with a large category icon, like a designed course cover.
 */
export default function CourseThumb({ course, className, children, large, compact }) {
  const color = course.color || "#4338f5";
  const Icon = iconFor(course);
  return (
    <div
      className={cn("relative grid aspect-video w-full max-w-full place-items-center overflow-hidden", className)}
      style={{ background: `color-mix(in srgb, ${color} 78%, #0b1020)` }}
    >
      {course.thumbnail ? (
        <img src={assetUrl(course.thumbnail)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <svg aria-hidden className="absolute inset-0 size-full text-white" preserveAspectRatio="none">
            <defs>
              <pattern id={`grid-${course._id}`} width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="currentColor" strokeOpacity=".07" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${course._id})`} />
          </svg>
          <span aria-hidden className="absolute -right-[8%] -top-[30%] aspect-square w-[55%] rounded-full bg-white/[.06]" />
          <span aria-hidden className="absolute -bottom-[35%] -left-[10%] aspect-square w-[45%] rounded-full bg-black/10" />
          <span
            aria-hidden
            className={cn(
              "relative grid place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20",
              compact ? "size-8 rounded-lg" : large ? "size-28" : "size-[4.5rem]"
            )}
          >
            <Icon className={compact ? "size-4" : large ? "size-14" : "size-9"} strokeWidth={1.5} />
          </span>
          {course.category?.name && !compact && (
            <span className="absolute bottom-3 left-3 text-[11px] font-semibold uppercase tracking-wider text-white/75">
              {course.category.name}
            </span>
          )}
        </>
      )}
      {children}
    </div>
  );
}
