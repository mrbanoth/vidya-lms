import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, DataTable, Field, Input, Modal, PageHeader, Skeleton, Switch, Textarea } from "@/components/ui";
import { del, errorMessage, get, patch, post } from "@/lib/api";
import { useTitle } from "@/hooks/useTitle";

export default function Categories() {
  useTitle("Categories");
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: () => get("/categories").then((r) => r.data) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });
  const save = useMutation({
    mutationFn: (c) => (c._id ? patch(`/admin/categories/${c._id}`, { name: c.name, icon: c.icon, description: c.description, featured: c.featured }) : post("/admin/categories", c)),
    onSuccess: () => { toast.success("Category saved"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({ mutationFn: (c) => del(`/admin/categories/${c._id}`), onSuccess: () => { toast.success("Deleted"); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  return (
    <>
      <PageHeader title="Categories" description="Shown in catalog filters and on the home page." actions={<Button onClick={() => setEditing({ name: "", icon: "", description: "", featured: false })}><Plus /> New category</Button>} />
      {isLoading ? <Skeleton className="h-64" /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "icon", label: "Icon", render: (c) => <span className="text-lg text-primary">{c.icon}</span> },
            { key: "name", label: "Name", render: (c) => <b>{c.name}</b> },
            { key: "slug", label: "Slug", render: (c) => <span className="text-xs text-muted-foreground">/{c.slug}</span> },
            { key: "count", label: "Courses", render: (c) => c.courseCount },
            { key: "featured", label: "Featured", render: (c) => <Switch checked={c.featured} onChange={(v) => save.mutate({ ...c, featured: v })} label={`Feature ${c.name}`} /> },
            { key: "act", label: "", render: (c) => <div className="flex gap-1"><Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditing(c)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => remove.mutate(c)}><Trash2 /></Button></div> },
          ]}
        />
      )}
      {editing && (
        <Modal
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={editing._id ? "Edit category" : "New category"}
          footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save.mutate(editing)} disabled={editing.name.trim().length < 2 || save.isPending}>Save</Button></>}
        >
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <Field label="Name" htmlFor="cat-name"><Input id="cat-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Icon" htmlFor="cat-icon"><Input id="cat-icon" maxLength={8} value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></Field>
          </div>
          <Field label="Description" htmlFor="cat-desc"><Textarea id="cat-desc" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}
