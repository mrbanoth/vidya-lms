import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";

const FALLBACK = { platformName: "Vidya", supportEmail: "", revenueShare: 70, instructorSignup: true, googleLogin: false, payments: "off" };

/** Public platform settings managed by admins (name, support email, revenue share…). */
export function useConfig() {
  const { data } = useQuery({ queryKey: ["config"], queryFn: () => get("/config").then((r) => r.data), staleTime: 5 * 60_000 });
  return data || FALLBACK;
}
