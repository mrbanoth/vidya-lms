import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { get, patch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/store/auth";

export function useNotifications(params = {}) {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", params],
    queryFn: () => get("/notifications", params),
    enabled: Boolean(user),
    refetchInterval: 120_000,
  });
  const readAll = useMutation({
    mutationFn: () => patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readOne = useMutation({
    mutationFn: (id) => patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return { items: q.data?.data || [], unread: q.data?.meta?.unread || 0, isLoading: q.isLoading, readAll, readOne };
}

/** Listens for pushed notifications and refreshes the list with a toast. */
export function useLiveNotifications() {
  const token = useAuth((s) => s.accessToken);
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNote = (n) => {
      toast(n.title, { description: n.body });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    socket.on("notification", onNote);
    return () => socket.off("notification", onNote);
  }, [token, qc]);
}
