import { Navigate, Outlet, useLocation } from "react-router";
import Loader from "@/components/kokonut/loader";
import { useAuth, homeFor } from "@/store/auth";

export function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center text-primary">
      <Loader size="sm" title="Loading Vidya" subtitle="" />
    </div>
  );
}

export function RequireAuth({ roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullPageLoader />;
  if (!user) return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullPageLoader />;
  if (user) {
    const next = new URLSearchParams(location.search).get("next");
    return <Navigate to={next && next.startsWith("/") ? next : homeFor(user.role)} replace />;
  }
  return <Outlet />;
}
