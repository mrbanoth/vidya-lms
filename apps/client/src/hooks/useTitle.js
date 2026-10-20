import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Vidya` : "Vidya — Learn the skill. Finish the course.";
  }, [title]);
}
