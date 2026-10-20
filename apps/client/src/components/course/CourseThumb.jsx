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
 * Uploaded thumbnail when present; otherwise a calm tile tinted with the
 * course colour, showing the course initials and category.
 */
export default function CourseThumb({ course, className, children, large, compact }) {
  const color = course.color || "#4f46e5";
  const Icon = iconFor(course);
  return (
    <div
      className={cn("relative grid aspect-video w-full max-w-full place-items-center overflow-hidden", className)}
      style={{ background: `color-mix(in srgb, ${color} 12%, var(--card))` }}
    >
      {course.thumbnail ? (
        <img src={assetUrl(course.thumbnail)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <svg aria-hidden className="absolute inset-0 size-full" style={{ color }} preserveAspectRatio="none">
            <defs>
              <pattern id={`dots-${course._id}`} width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="currentColor" opacity=".18" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#dots-${course._id})`} />
          </svg>
          <span
            aria-hidden
            className={cn("relative grid place-items-center text-white shadow-lg", compact ? "size-8 rounded-lg" : large ? "size-24 rounded-2xl" : "size-16 rounded-2xl")}
            style={{ background: color, boxShadow: `0 12px 24px -12px ${color}` }}
          >
            <Icon className={compact ? "size-4" : large ? "size-11" : "size-8"} strokeWidth={1.75} />
          </span>
          <span aria-hidden className="absolute right-[14%] top-[18%] size-3 rounded-full opacity-40" style={{ background: color }} />
          <span aria-hidden className="absolute bottom-[22%] left-[16%] size-2 rounded-sm opacity-30" style={{ background: color }} />
          {course.category?.name && !compact && (
            <span className="absolute bottom-3 left-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
              {course.category.name}
            </span>
          )}
        </>
      )}
      {children}
    </div>
  );
}
