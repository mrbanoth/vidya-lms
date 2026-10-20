import { useEffect } from "react";
import { Link, useRouteError } from "react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

const isStaleChunk = (err) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String(err?.message || err)
  );

/** Route-level error screen. Reloads once automatically after a new deploy. */
export default function RouteError() {
  const error = useRouteError();
  useEffect(() => {
    if (!isStaleChunk(error)) return;
    try {
      if (sessionStorage.getItem("vidya-reloaded")) return;
      sessionStorage.setItem("vidya-reloaded", "1");
    } catch {
      /* storage blocked */
    }
    window.location.reload();
  }, [error]);
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="grid max-w-md justify-items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <RefreshCw className="size-6" />
        </span>
        <h1 className="text-2xl font-bold">This page did not load</h1>
        <p className="text-muted-foreground">
          {isStaleChunk(error) ? "A new version of the site is available." : "Something went wrong on our side."} Reload the page to continue.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" asChild><Link to="/" reloadDocument>Go home</Link></Button>
        </div>
      </div>
    </div>
  );
}
