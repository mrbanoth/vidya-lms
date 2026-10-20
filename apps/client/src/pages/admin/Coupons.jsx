import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { couponSchema } from "@vidya/shared";
import { Button, Card, DataTable, Field, Input, PageHeader, Select, Skeleton, Spinner, StatusPill, Switch } from "@/components/ui";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import { date } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Coupons() {
  useTitle("Coupons");
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => get("/admin/coupons").then((r) => r.data) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(couponSchema), defaultValues: { type: "percent", value: 20, maxUses: 0, active: true } });
  const toggle = useMutation({ mutationFn: (c) => patch(`/admin/coupons/${c._id}`, { active: !c.active }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (c) => del(`/admin/coupons/${c._id}`), onSuccess: () => { toast.success("Coupon deleted"); refresh(); } });
  const state = (c) => (!c.active ? "draft" : c.expiresAt && new Date(c.expiresAt) < new Date() ? "failed" : c.maxUses && c.used >= c.maxUses ? "refunded" : "active");
  const stateLabel = { draft: "Paused", failed: "Expired", refunded: "Used up", active: "Active" };
  return (
    <>
      <PageHeader title="Coupons" />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        {isLoading ? <Skeleton className="h-64" /> : (
          <DataTable
            rows={data}
            columns={[
              { key: "code", label: "Code", render: (c) => <b className="font-mono">{c.code}</b> },
              { key: "value", label: "Discount", render: (c) => (c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`) },
              { key: "used", label: "Used", render: (c) => `${c.used} / ${c.maxUses || "∞"}` },
              { key: "exp", label: "Expires", render: (c) => (c.expiresAt ? date(c.expiresAt) : "Never") },
              { key: "status", label: "Status", render: (c) => <StatusPill status={state(c)} label={stateLabel[state(c)]} /> },
              { key: "act", label: "", render: (c) => <div className="flex items-center gap-2"><Switch checked={c.active} onChange={() => toggle.mutate(c)} label={`Active ${c.code}`} /><Button variant="ghost" size="icon-sm" aria-label={`Delete ${c.code}`} onClick={() => remove.mutate(c)}><Trash2 /></Button></div> },
            ]}
          />
        )}
        <Card
          as="form"
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(async (v) => {
            try {
              await post("/admin/coupons", { ...v, expiresAt: v.expiresAt || null });
              toast.success(`${v.code} created`);
              reset();
              refresh();
            } catch (e) {
              toast.error(errorMessage(e));
            }
          })}
        >
          <h2 className="text-lg font-bold">Create coupon</h2>
          <Field label="Code" htmlFor="cp-code" error={errors.code?.message}><Input id="cp-code" className="font-mono uppercase" placeholder="NEWYEAR25" {...register("code")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="cp-type"><Select id="cp-type" {...register("type")}><option value="percent">Percent</option><option value="flat">Flat ₹</option></Select></Field>
            <Field label="Value" htmlFor="cp-value" error={errors.value?.message}><Input id="cp-value" type="number" {...register("value")} /></Field>
            <Field label="Usage limit" htmlFor="cp-max" hint="0 = unlimited"><Input id="cp-max" type="number" {...register("maxUses")} /></Field>
            <Field label="Expires" htmlFor="cp-exp"><Input id="cp-exp" type="date" {...register("expiresAt")} /></Field>
          </div>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner />} Create coupon</Button>
        </Card>
      </div>
    </>
  );
}
