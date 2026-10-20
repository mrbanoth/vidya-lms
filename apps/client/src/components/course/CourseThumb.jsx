import { assetUrl } from "@/lib/api";
import { glyph } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CourseThumb({ course, className, children, large }) {
  return (
    <div
      className={cn("relative grid aspect-video w-full max-w-full place-items-center overflow-hidden", className)}
      style={{ background: course.color || "#0f7a5c" }}
    >
      {course.thumbnail ? (
        <img src={assetUrl(course.thumbnail)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <span
            className={cn("relative font-mono font-semibold text-white/90", large ? "text-5xl" : "text-[28px]")}
            aria-hidden
          >
            {glyph(course.title)}
          </span>
        </>
      )}
      {children}
    </div>
  );
}
