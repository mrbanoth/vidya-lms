import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { glyph } from "@/lib/format";

/**
 * Uploaded thumbnail when present; otherwise a calm tile tinted with the
 * course colour, showing the course initials and category.
 */
export default function CourseThumb({ course, className, children, large }) {
  const color = course.color || "#0f7a5c";
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
            className={cn(
              "relative grid place-items-center rounded-2xl font-bold tracking-tight text-white shadow-sm",
              large ? "size-24 text-4xl" : "size-14 text-xl"
            )}
            style={{ background: color }}
          >
            {glyph(course.title)}
          </span>
          {course.category?.name && (
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
