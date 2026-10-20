import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, Button, Chip, DataTable, Input, Modal, PageHeader, Pagination, Select, Skeleton, StatusPill } from "@/components/ui";
import { errorMessage, get, patch } from "@/lib/api";
import { date, timeAgo } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/store/auth";
import { useTitle } from "@/hooks/useTitle";

export default function Users() {
  useTitle("Users");
  const me = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const dq = useDebounce(q);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users", dq, role, page], queryFn: () => get("/admin/users", { q: dq, role, page }) });
  const update = useMutation({
    mutationFn: ({ id, body }) => patch(`/admin/users/${id}`, body),
    onSuccess: () => { toast.success("User updated. Logged in the audit log."); setConfirm(null); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader title="Users" description={data ? `${data.meta.total} accounts` : " "} />
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Search users" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <div className="flex flex-wrap gap-2">{["all", "student", "instructor", "admin"].map((r) => <Chip key={r} active={role === r} onClick={() => { setRole(r); setPage(1); }} className="capitalize">{r}</Chip>)}</div>
      </div>
      {isLoading ? <Skeleton className="h-96" /> : (
        <>
          <DataTable
            rows={data.data}
            columns={[
              { key: "user", label: "User", render: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} src={u.avatar} size={32} /><div><b className="block">{u.name}</b><span className="text-xs text-muted-foreground">{u.email}</span></div></div> },
              {
                key: "role",
                label: "Role",
                render: (u) => (
                  <Select aria-label={`Role for ${u.name}`} value={u.role} disabled={u._id === me._id} onChange={(e) => setConfirm({ user: u, body: { role: e.target.value }, text: `Change ${u.name} to ${e.target.value}?` })} className="h-8 w-[130px] text-xs">
                    <option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
                  </Select>
                ),
              },
              { key: "status", label: "Status", render: (u) => <StatusPill status={u.status === "active" && !u.isVerified ? "unverified" : u.status} /> },
              { key: "joined", label: "Joined", render: (u) => date(u.createdAt) },
              { key: "seen", label: "Last sign-in", render: (u) => (u.lastLoginAt ? timeAgo(u.lastLoginAt) : "—") },
              {
                key: "act",
                label: "",
                render: (u) => u._id !== me._id && (
                  u.status === "banned"
                    ? <Button size="sm" variant="outline" onClick={() => update.mutate({ id: u._id, body: { status: "active" } })}>Unban</Button>
                    : <Button size="sm" variant="destructive-soft" onClick={() => setConfirm({ user: u, body: { status: "banned" }, text: `Ban ${u.name}? They are signed out everywhere and cannot sign in.` })}>Ban</Button>
                ),
              },
            ]}
          />
          <Pagination page={page} pages={data.meta.pages} onChange={setPage} />
        </>
      )}
      <Modal
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Confirm change"
        description={confirm?.text}
        footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm?.body.status === "banned" ? "destructive" : "default"} onClick={() => update.mutate({ id: confirm.user._id, body: confirm.body })} disabled={update.isPending}>Confirm</Button></>}
      />
    </>
  );
}
