import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input, PageHeader, Skeleton, Spinner, Switch } from "@/components/ui";
import { errorMessage, get, patch } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";

const FEATURES = [
  ["instructorSignup", "Allow new instructor sign-ups", "Anyone can register as an instructor"],
  ["requireReview", "Review courses before publishing", "New courses go to the review queue"],
  ["googleLogin", "Google sign-in", "Needs GOOGLE_CLIENT_ID on the server"],
  ["maintenance", "Maintenance mode", "Only admins can use the site"],
];

export default function AdminSettings() {
  useTitle("Platform settings");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get("/admin/settings").then((r) => r.data) });
  const health = useQuery({ queryKey: ["health"], queryFn: () => get("/health"), refetchInterval: 30_000 });
  const [form, setForm] = useState(null);
  useEffect(() => data && setForm({ platformName: data.platformName, supportEmail: data.supportEmail, revenueShare: data.revenueShare }), [data]);
  const save = useMutation({
    mutationFn: (body) => patch("/admin/settings", body),
    onSuccess: (r) => { toast.success(r.message || "Saved"); qc.invalidateQueries({ queryKey: ["admin-settings"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading || !form) return <Skeleton className="h-96" />;
  return (
    <>
      <PageHeader title="Platform settings" />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card as="form" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
          <h2 className="text-lg font-bold">General</h2>
          <Field label="Platform name" htmlFor="st-name"><Input id="st-name" value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} /></Field>
          <Field label="Support email" htmlFor="st-email"><Input id="st-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></Field>
          <Field label="Instructor revenue share (%)" htmlFor="st-share"><Input id="st-share" type="number" min={0} max={100} value={form.revenueShare} onChange={(e) => setForm({ ...form, revenueShare: e.target.value })} /></Field>
          <Button type="submit" className="justify-self-start" disabled={save.isPending}>{save.isPending && <Spinner />} Save settings</Button>
        </Card>
        <Card className="grid gap-1">
          <h2 className="mb-2 text-lg font-bold">Features</h2>
          {FEATURES.map(([k, t, d]) => (
            <div key={k} className="flex items-center justify-between gap-4 border-t border-border py-3 first-of-type:border-0">
              <label htmlFor={`ft-${k}`} className="grid"><b className="text-sm">{t}</b><span className="text-xs text-muted-foreground">{d}</span></label>
              <Switch id={`ft-${k}`} checked={data.features[k]} onChange={(v) => save.mutate({ features: { [k]: v } })} label={t} />
            </div>
          ))}
        </Card>
        <Card className="grid gap-3">
          <h2 className="text-lg font-bold">System health</h2>
          {health.data ? (
            <>
              <div className="flex justify-between text-sm"><span>API</span><Badge>{health.data.status}</Badge></div>
              <div className="flex justify-between text-sm"><span>Database</span><Badge tone={health.data.db === "up" ? "default" : "red"}>{health.data.db}</Badge></div>
              <div className="flex justify-between text-sm"><span>Uptime</span><span className="font-mono">{Math.round(health.data.uptime / 60)} min</span></div>
            </>
          ) : <Skeleton className="h-20" />}
        </Card>
      </div>
    </>
  );
}
