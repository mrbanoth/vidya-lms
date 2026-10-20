import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Themed area chart: faint grid, filled area, emphasised last point. */
export function TrendChart({ data, x, y, height = 220, format = compact, prefix = "" }) {
  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
            fill="var(--primary)" fillOpacity={0.08}
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
            <span className="tabular text-xs font-medium">{format(i.value)}</span>
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

const DONUT = ["#4f46e5", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6", "#64748b"];

/** Donut with a legend showing each slice's share. */
export function DonutChart({ items, format = (v) => v }) {
  const total = items.reduce((t, i) => t + i.value, 0) || 1;
  if (!items.length) return <p className="text-sm text-muted-foreground">No data for this period yet.</p>;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div className="mx-auto size-[180px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="label" innerRadius={52} outerRadius={84} paddingAngle={2} stroke="none">
              {items.map((_, i) => <Cell key={i} fill={DONUT[i % DONUT.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)", fontSize: 12 }}
              formatter={(v, n) => [format(v), n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2.5 text-sm">
        {items.map((i, k) => (
          <li key={i.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: DONUT[k % DONUT.length] }} />
            <span className="min-w-0 flex-1 truncate">{i.label}</span>
            <span className="tabular font-semibold">{Math.round((i.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
