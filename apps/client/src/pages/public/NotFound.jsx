import { Link } from "react-router";
import { Button } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <div className="grid justify-items-center gap-4">
        <span className="font-display text-[clamp(6rem,18vw,10rem)] font-extrabold leading-none text-primary">404</span>
        <h1 className="text-3xl font-bold">This page does not exist</h1>
        <p className="max-w-[44ch] text-muted-foreground">The link may have moved or has a typo. Search for a course, or head back home.</p>
        <div className="flex gap-2">
          <Button asChild><Link to="/">Go home</Link></Button>
          <Button variant="outline" asChild><Link to="/courses">Browse courses</Link></Button>
        </div>
      </div>
    </div>
  );
}
