import { useSearchParams } from "react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { SlidersHorizontal, SearchX, X } from "lucide-react";
import { LEVELS, SORT_OPTIONS } from "@vidya/shared";
import { CourseGrid } from "@/components/course/CourseCard";
import { Button, Chip, EmptyState, ErrorState, Input, Pagination, Select } from "@/components/ui";
import { get } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useEffect } from "react";

/** Course listing with URL-synced filters. `lockedCategory` hides the category filter. */
export default function CatalogView({ lockedCategory }) {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const dq = useDebounce(q, 350);

  const state = {
    q: params.get("q") || "",
    category: lockedCategory || params.get("category") || "",
    level: params.getAll("level"),
    price: params.get("price") || "all",
    rating: params.get("rating") || "",
    sort: params.get("sort") || "popular",
    page: Number(params.get("page") || 1),
  };

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      next.delete(k);
      [].concat(v).filter((x) => x !== "" && x != null).forEach((x) => next.append(k, x));
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (dq !== state.q) update({ q: dq });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => get("/categories").then((r) => r.data) });
  const query = useQuery({
    queryKey: ["courses", state],
    queryFn: () =>
      get("/courses", {
        q: state.q || undefined,
        category: state.category || undefined,
        level: state.level.length ? state.level : undefined,
        price: state.price,
        rating: state.rating || undefined,
        sort: state.sort,
        page: state.page,
        limit: 12,
      }),
    placeholderData: keepPreviousData,
  });

  const chips = (() => {
    const out = [];
    if (state.q) out.push(["q", `“${state.q}”`]);
    if (!lockedCategory && state.category)
      state.category.split(",").forEach((s) => out.push(["category", cats.find((c) => c.slug === s)?.name || s, s]));
    state.level.forEach((l) => out.push(["level", l, l]));
    if (state.price !== "all") out.push(["price", state.price === "free" ? "Free" : "Paid"]);
    if (state.rating) out.push(["rating", `${state.rating}★ & up`]);
    return out;
  })();

  const toggleIn = (key, value) => {
    const current = key === "category" ? state.category.split(",").filter(Boolean) : state[key];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    update({ [key]: key === "category" ? next.join(",") : next });
  };

  const filters = (
    <aside className="grid content-start gap-6 text-sm" aria-label="Filters">
      {!lockedCategory && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</legend>
          {cats.map((c) => (
            <label key={c._id} className="flex cursor-pointer items-center gap-2.5 py-0.5">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={state.category.split(",").includes(c.slug)}
                onChange={() => toggleIn("category", c.slug)}
              />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.courseCount}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="grid gap-1.5">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Level</legend>
        {LEVELS.slice(0, 3).map((l) => (
          <label key={l} className="flex cursor-pointer items-center gap-2.5 py-0.5">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={state.level.includes(l)} onChange={() => toggleIn("level", l)} />
            {l}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-1.5">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Price</legend>
        {[["all", "All"], ["free", "Free"], ["paid", "Paid"]].map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 py-0.5">
            <input type="radio" name="price" className="size-4 accent-[var(--primary)]" checked={state.price === v} onChange={() => update({ price: v === "all" ? "" : v })} />
            {l}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-1.5">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rating</legend>
        {[["", "Any rating"], ["4.5", "4.5 & up"], ["4", "4.0 & up"]].map(([v, l]) => (
          <label key={l} className="flex cursor-pointer items-center gap-2.5 py-0.5">
            <input type="radio" name="rating" className="size-4 accent-[var(--primary)]" checked={state.rating === v} onChange={() => update({ rating: v })} />
            {l}
          </label>
        ))}
      </fieldset>
      {chips.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => { setQ(""); setParams({}, { replace: true }); }}>
          Clear all filters
        </Button>
      )}
    </aside>
  );

  const meta = query.data?.meta;
  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr] lg:gap-10">
      <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">{filters}</div>
      <div className="grid min-w-0 content-start gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="catalog-q" className="sr-only">Search in results</label>
          <Input id="catalog-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in results" className="max-w-xs flex-1" />
          <Select aria-label="Sort" value={state.sort} onChange={(e) => update({ sort: e.target.value })} className="w-auto">
            {Object.entries(SORT_OPTIONS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal /> Filters
          </Button>
          <span className="ml-auto text-sm text-muted-foreground tabular">{meta ? `${meta.total} results` : ""}</span>
        </div>
        {showFilters && <div className="rounded-xl border border-border bg-card p-4 lg:hidden">{filters}</div>}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map(([key, label, value]) => (
              <Chip
                key={`${key}-${label}`}
                active
                onClick={() => {
                  if (key === "q") setQ("");
                  if (key === "level" || key === "category") toggleIn(key, value);
                  else update({ [key]: "" });
                }}
                className="inline-flex items-center gap-1"
              >
                {label} <X className="size-3" />
              </Chip>
            ))}
          </div>
        )}
        {query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : !query.isLoading && query.data?.data.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No courses match these filters"
            body="Remove a filter or try a broader search."
            action={<Button size="sm" onClick={() => { setQ(""); setParams({}, { replace: true }); }}>Clear filters</Button>}
          />
        ) : (
          <>
            <CourseGrid courses={query.data?.data || []} loading={query.isLoading} count={6} />
            <Pagination page={state.page} pages={meta?.pages} onChange={(p) => { update({ page: p }, false); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        )}
      </div>
    </div>
  );
}
