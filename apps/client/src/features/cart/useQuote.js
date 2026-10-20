import { useQuery } from "@tanstack/react-query";
import { post } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { priceLocally } from "./pricing";

/** Server-priced quote for signed-in users; local estimate for guests. */
export function useQuote(items, coupon) {
  const user = useAuth((s) => s.user);
  const ids = items.map((c) => c._id);
  return useQuery({
    queryKey: ["quote", ids, coupon, Boolean(user)],
    queryFn: () => (user ? post("/checkout/quote", { courseIds: ids, code: coupon || undefined }).then((r) => r.data) : priceLocally(items)),
    enabled: ids.length > 0,
    retry: false,
  });
}
