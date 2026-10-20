import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Modal({ open, onOpenChange, title, description, children, className, footer }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[min(480px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl focus:outline-none",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <Dialog.Title className="font-display text-xl font-bold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EmptyState({ icon: Icon, title, body, action, className }) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="max-w-[44ch] text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      title="This did not load"
      body={error?.response?.data?.message || "Check your connection and try again."}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const items = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items.at(-1) !== "…") items.push("…");
  }
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft />
      </Button>
      {items.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            size="icon-sm"
            variant={p === page ? "default" : "outline"}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      )}
      <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight />
      </Button>
    </nav>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn("scrollbar-none flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
            value === t.value
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, className, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="grid min-w-0 gap-1.5">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">{title}</h1>
        {description && <p className="max-w-[65ch] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, delta, down, hint }) {
  return (
    <div className="grid gap-0.5 rounded-xl border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <b className="tabular font-display text-[26px] font-bold leading-tight">{value}</b>
      {delta && <span className={cn("text-xs font-semibold", down ? "text-destructive" : "text-primary")}>{delta}</span>}
      {hint && <span className="text-[11.5px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function DataTable({ columns, rows, empty, rowKey = (r) => r._id || r.id }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="tabular w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "whitespace-nowrap border-b border-border bg-muted px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                  c.className
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                {empty || "Nothing here yet"}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={rowKey(r)} className="border-b border-border last:border-0 hover:bg-muted/40">
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-4 py-3 align-middle", c.className)}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TextLink({ className, ...props }) {
  return <Link className={cn("font-semibold text-primary hover:underline", className)} {...props} />;
}
