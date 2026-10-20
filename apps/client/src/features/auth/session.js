import { api, post, refreshSession } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { queryClient } from "@/lib/queryClient";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const HINT = "vidya-has-session";

/** Restores a session on page load when this browser signed in before. */
export async function bootstrapSession() {
  let hinted = false;
  try {
    hinted = localStorage.getItem(HINT) === "1";
  } catch {
    /* storage blocked */
  }
  if (!hinted) return useAuth.getState().markReady();
  try {
    const token = await refreshSession();
    connectSocket(token);
  } catch {
    try {
      localStorage.removeItem(HINT);
    } catch {
      /* ignore */
    }
  }
}

/** Stores a fresh session and moves any guest cart onto the account. */
export async function startSession(data) {
  useAuth.getState().setSession(data);
  try {
    localStorage.setItem(HINT, "1");
  } catch {
    /* ignore */
  }
  connectSocket(data.accessToken);
  const guest = useUI.getState().guestCart;
  if (guest.length) {
    await post("/users/me/cart/merge", { courseIds: guest }).catch(() => {});
    useUI.getState().clearGuestCart();
  }
  queryClient.invalidateQueries();
}

export async function signOut() {
  await api.post("/auth/logout").catch(() => {});
  try {
    localStorage.removeItem(HINT);
  } catch {
    /* ignore */
  }
  disconnectSocket();
  useAuth.getState().clear();
  queryClient.clear();
}
