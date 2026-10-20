import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/app/router";
import { bootstrapSession } from "@/features/auth/session";
import ErrorBoundary from "@/app/ErrorBoundary";
import "@/store/ui";
import "@/styles/index.css";

bootstrapSession();

const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const app = (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster position="bottom-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
  </QueryClientProvider>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>{googleId ? <GoogleOAuthProvider clientId={googleId}>{app}</GoogleOAuthProvider> : app}</ErrorBoundary>
  </StrictMode>
);
