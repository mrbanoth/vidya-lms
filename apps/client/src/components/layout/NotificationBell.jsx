import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useNotifications } from "@/features/notifications/useNotifications";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export default function NotificationBell({ className }) {
  const { items, unread, readAll, readOne } = useNotifications();
  const navigate = useNavigate();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="icon" className={cn("relative", className)} aria-label={`Notifications, ${unread} unread`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <b className="font-display">Notifications</b>
            {unread > 0 && (
              <button className="cursor-pointer text-xs font-semibold text-primary" onClick={() => readAll.mutate()}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">You are all caught up.</p>}
            {items.slice(0, 8).map((n) => (
              <DropdownMenu.Item
                key={n._id}
                onSelect={() => {
                  if (!n.read) readOne.mutate(n._id);
                  if (n.link) navigate(n.link);
                }}
                className={cn(
                  "grid cursor-pointer gap-0.5 border-b border-border px-4 py-3 text-sm outline-none last:border-0 focus:bg-muted",
                  !n.read && "bg-accent/50"
                )}
              >
                <b className="font-semibold">{n.title}</b>
                {n.body && <span className="line-clamp-2 text-muted-foreground">{n.body}</span>}
                <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </DropdownMenu.Item>
            ))}
          </div>
          <Link to="/notifications" className="block border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-muted">
            See all notifications
          </Link>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
