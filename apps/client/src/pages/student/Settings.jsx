import { useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Bell, Laptop, LifeBuoy, Monitor, Moon, Receipt, Shield, Smartphone, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { changePasswordSchema, LANGUAGES, profileSchema } from "@vidya/shared";
import HoldButton from "@/components/kokonut/hold-button";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Switch, Tabs, Textarea } from "@/components/ui";
import { api, del, errorMessage, fieldErrors, get, patch, post } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { signOut } from "@/features/auth/session";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { useTitle } from "@/hooks/useTitle";
import { cn } from "@/lib/utils";

function Profile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, headline: user.headline || "", bio: user.bio || "", language: user.language || "English", website: user.website || "", github: user.github || "", linkedin: user.linkedin || "" },
  });
  const onSubmit = async (v) => {
    try {
      const res = await patch("/users/me", v);
      setUser(res.data.user);
      reset(v);
      toast.success("Profile saved");
    } catch (e) {
      Object.entries(fieldErrors(e)).forEach(([k, m]) => setError(k, { message: m }));
      toast.error(errorMessage(e));
    }
  };
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Choose an image under 5 MB");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/users/me/avatar", fd);
      setUser(res.data.data.user);
      toast.success("Photo updated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };
  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-3xl gap-5 p-6">
      <h2 className="text-lg font-bold">Profile Information</h2>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={user.name} src={user.avatar} size={88} />
        <div className="grid gap-1.5">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="avatar-file" onChange={(e) => upload(e.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading && <Spinner />} Change Photo</Button>
          <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="p-name" error={errors.name?.message}><Input id="p-name" invalid={!!errors.name} {...register("name")} /></Field>
        <Field label="Headline" htmlFor="p-head" error={errors.headline?.message}><Input id="p-head" placeholder="e.g. Frontend developer" {...register("headline")} /></Field>
        <Field label="Email" htmlFor="p-email" hint="Contact support to change your email"><Input id="p-email" value={user.email} disabled readOnly /></Field>
        <Field label="Language" htmlFor="p-lang"><Select id="p-lang" {...register("language")}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</Select></Field>
      </div>
      <Field label="Bio" htmlFor="p-bio" error={errors.bio?.message}><Textarea id="p-bio" rows={4} {...register("bio")} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Website" htmlFor="p-web" error={errors.website?.message}><Input id="p-web" placeholder="https://" {...register("website")} /></Field>
        <Field label="GitHub username" htmlFor="p-gh"><Input id="p-gh" {...register("github")} /></Field>
        <Field label="LinkedIn username" htmlFor="p-li"><Input id="p-li" {...register("linkedin")} /></Field>
      </div>
      <Button type="submit" className="justify-self-start" disabled={isSubmitting || !isDirty}>{isSubmitting && <Spinner />} Save changes</Button>
    </Card>
  );
}

function Security() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deletePw, setDeletePw] = useState("");
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(changePasswordSchema) });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => get("/users/me/sessions").then((r) => r.data) });
  const revoke = useMutation({
    mutationFn: (id) => del(`/users/me/sessions/${id}`),
    onSuccess: () => { toast.success("Device signed out"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
  });
  const device = (ua = "") => (/mobile|android|iphone/i.test(ua) ? Smartphone : /mac|windows|linux/i.test(ua) ? Laptop : Monitor);
  const label = (ua = "") => {
    const b = /edg/i.test(ua) ? "Edge" : /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
    const os = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iOS" : /mac/i.test(ua) ? "macOS" : /windows/i.test(ua) ? "Windows" : /linux/i.test(ua) ? "Linux" : "Unknown OS";
    return `${b} on ${os}`;
  };
  return (
    <div className="grid max-w-3xl gap-5">
      <Card
        as="form"
        noValidate
        className="grid gap-4 p-6"
        onSubmit={handleSubmit(async (v) => {
          try {
            const res = await post("/users/me/password", v);
            toast.success(res.message);
            reset();
            qc.invalidateQueries({ queryKey: ["sessions"] });
          } catch (e) {
            const fe = fieldErrors(e);
            if (fe.currentPassword) setError("currentPassword", { message: fe.currentPassword });
            else toast.error(errorMessage(e));
          }
        })}
      >
        <h2 className="text-lg font-bold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" htmlFor="s-cur" error={errors.currentPassword?.message}><Input id="s-cur" type="password" autoComplete="current-password" {...register("currentPassword")} /></Field>
          <Field label="New password" htmlFor="s-new" error={errors.newPassword?.message}><Input id="s-new" type="password" autoComplete="new-password" {...register("newPassword")} /></Field>
        </div>
        <Button type="submit" className="justify-self-start" disabled={isSubmitting}>{isSubmitting && <Spinner />} Update password</Button>
      </Card>
      <Card className="grid gap-3 p-6">
        <h2 className="text-lg font-bold">Signed-in devices</h2>
        {(sessions.data || []).map((s) => {
          const Icon = device(s.userAgent);
          return (
            <div key={s.id} className="flex items-center gap-3 border-t border-border pt-3 first-of-type:border-0">
              <span className="grid size-10 place-items-center rounded-lg bg-muted"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><b className="block text-sm">{label(s.userAgent)}</b><span className="text-xs text-muted-foreground">{s.ip} · last used {timeAgo(s.lastUsed)}</span></div>
              {s.current ? <Badge mono={false} className="rounded-full">This device</Badge> : <Button size="sm" variant="destructive-soft" onClick={() => revoke.mutate(s.id)}>Sign out</Button>}
            </div>
          );
        })}
      </Card>
      <Card className="grid gap-3 border-destructive/50 p-6">
        <h2 className="text-lg font-bold text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground">This removes your access to every course, your progress and certificates. It cannot be undone.</p>
        <Field label="Confirm with your password" htmlFor="del-pw"><Input id="del-pw" type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} className="max-w-xs" /></Field>
        <HoldButton
          variant="red"
          className="justify-self-start"
          disabled={!deletePw}
          holdDuration={1500}
          completeLabel="Deleting…"
          onHoldComplete={async () => {
            try {
              await post("/users/me/delete", { password: deletePw });
              await signOut();
              toast.success("Your account was deleted");
              navigate("/");
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        >
          Hold to delete account
        </HoldButton>
      </Card>
    </div>
  );
}

function Preferences() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const { theme, setTheme } = useUI();
  const prefs = user.notificationPrefs || {};
  const toggle = async (key, value) => {
    try {
      const res = await patch("/users/me", { name: user.name, notificationPrefs: { [key]: value } });
      setUser(res.data.user);
      toast.success("Preference saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const ROWS = [
    ["courseUpdates", "Course updates", "New lessons in courses you own"],
    ["qaReplies", "Q&A replies", "When someone answers your question"],
    ["promotions", "Deals", "Sales on courses in your wishlist"],
    ["weeklyDigest", "Weekly progress email", "Your study stats every Monday"],
  ];
  return (
    <div className="grid max-w-3xl gap-5">
      <Card className="grid gap-4 p-6">
        <h2 className="text-lg font-bold">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([v, Icon, l]) => (
            <button key={v} onClick={() => setTheme(v)} aria-pressed={theme === v} className={cn("grid cursor-pointer justify-items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold", theme === v ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-muted-foreground")}>
              <Icon className="size-5" />{l}
            </button>
          ))}
        </div>
      </Card>
      <Card className="grid gap-1 p-6">
        <h2 className="mb-2 text-lg font-bold">Email notifications</h2>
        {ROWS.map(([k, t, d]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-t border-border py-3 first-of-type:border-0">
            <label htmlFor={`pref-${k}`} className="grid"><b className="text-sm">{t}</b><span className="text-xs text-muted-foreground">{d}</span></label>
            <Switch id={`pref-${k}`} checked={Boolean(prefs[k])} onChange={(v) => toggle(k, v)} label={t} />
          </div>
        ))}
      </Card>
    </div>
  );
}

const MENU = [
  ["profile", "Profile", User],
  ["security", "Security", Shield],
  ["preferences", "Notifications", Bell],
];
const LINKS = [
  ["/orders", "Billing", Receipt],
  ["/certificates", "Certificates", Award],
  ["/contact", "Help & Support", LifeBuoy],
];

export default function Settings() {
  useTitle("Settings");
  const { tab = "profile" } = useParams();
  const item = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, security and notifications." />
      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 scrollbar-none lg:grid">
          {MENU.map(([v, label, Icon]) => (
            <NavLink key={v} to={`/settings/${v}`} className={cn(item, tab === v ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="size-4" />{label}
            </NavLink>
          ))}
          <span className="mx-2 my-1 hidden h-px bg-border lg:block" />
          {LINKS.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={cn(item, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="size-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">{tab === "security" ? <Security /> : tab === "preferences" ? <Preferences /> : <Profile />}</div>
      </div>
    </>
  );
}
