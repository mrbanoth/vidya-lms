import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { del, errorMessage, get, post } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";

/** Cart for signed-in users lives on the server; guests keep course ids locally. */
export function useCart() {
  const user = useAuth((s) => s.user);
  const guestIds = useUI((s) => s.guestCart);
  const qc = useQueryClient();

  const server = useQuery({
    queryKey: ["cart"],
    queryFn: () => get("/users/me/cart").then((r) => r.data),
    enabled: Boolean(user),
  });
  const guest = useQuery({
    queryKey: ["guest-cart", guestIds],
    queryFn: () => get("/courses-batch", { ids: guestIds.join(",") }).then((r) => r.data),
    enabled: !user && guestIds.length > 0,
  });

  const add = useMutation({
    mutationFn: (course) =>
      user ? post(`/users/me/cart/${course._id}`) : Promise.resolve(useUI.getState().addGuestCart(course._id)),
    onSuccess: (_d, course) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["course", course.slug] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (course) =>
      user ? del(`/users/me/cart/${course._id}`) : Promise.resolve(useUI.getState().removeGuestCart(course._id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = user ? server.data || [] : guestIds.length ? guest.data || [] : [];
  return {
    items,
    count: user ? items.length : guestIds.length,
    isLoading: user ? server.isLoading : guest.isLoading,
    has: (id) => (user ? items.some((c) => c._id === id) : guestIds.includes(id)),
    add,
    remove,
  };
}

export function useWishlist() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => get("/users/me/wishlist").then((r) => r.data),
    enabled: Boolean(user),
  });
  const toggle = useMutation({
    mutationFn: ({ course, on }) =>
      on ? post(`/users/me/wishlist/${course._id}`) : del(`/users/me/wishlist/${course._id}`),
    onSuccess: (res, { on }) => {
      qc.setQueryData(["wishlist"], res.data);
      toast.success(on ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const items = q.data || [];
  return { items, isLoading: q.isLoading, has: (id) => items.some((c) => c._id === id), toggle };
}
