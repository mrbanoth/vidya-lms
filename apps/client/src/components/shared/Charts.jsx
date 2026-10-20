import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Themed area chart: faint grid, filled area, emphasised last point. */
export function TrendChart({ data, x, y, height = 220, format = compact, prefix = "" }) {
  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${prefix}${format(v)}`} />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)", fontSize: 12 }}
            formatter={(v) => [`${prefix}${Number(v).toLocaleString("en-IN")}`, ""]}
            separator=""
          />
          <Area
            type="monotone"
            dataKey={y}
            stroke="var(--primary)"
            strokeWidth={2.2}
            fill="url(#trend-fill)"
            dot={(p) => (p.index === data.length - 1 ? <circle key="end" cx={p.cx} cy={p.cy} r={4.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} /> : null)}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarList({ items, format = (v) => v, className }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("grid gap-3", className)}>
      {items.map((i) => (
        <li key={i.label} className="grid gap-1.5">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="tabular font-mono text-xs">{format(i.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-muted-foreground">No data for this period yet.</li>}
    </ul>
  );
}
