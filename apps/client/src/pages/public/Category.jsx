import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { get } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";
import CatalogView from "./CatalogView";
import NotFound from "./NotFound";

export default function Category() {
  const { slug } = useParams();
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => get("/categories").then((r) => r.data) });
  const cat = useQuery({ queryKey: ["category", slug], queryFn: () => get(`/categories/${slug}`).then((r) => r.data) });
  useTitle(cat.data?.name);
  if (cat.isError) return <NotFound />;
  return (
    <div className="container-page grid gap-8 py-10">
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
        {cats.map((c) => (
          <Link
            key={c._id}
            to={`/categories/${c.slug}`}
            aria-current={c.slug === slug ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
              c.slug === slug ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {cat.data ? (
        <PageHeader eyebrow="Category" title={cat.data.name} description={`${cat.data.courseCount} courses · ${cat.data.description}`} />
      ) : (
        <Skeleton className="h-20 w-2/3" />
      )}
      <CatalogView key={slug} lockedCategory={slug} />
    </div>
  );
}
