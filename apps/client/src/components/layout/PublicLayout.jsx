import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useLiveNotifications } from "@/features/notifications/useNotifications";

export default function PublicLayout() {
  useLiveNotifications();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
