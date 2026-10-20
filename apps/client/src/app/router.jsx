/* eslint-disable react-refresh/only-export-components -- route table, not a component module */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import PublicLayout from "@/components/layout/PublicLayout";
import AppLayout from "@/components/layout/AppLayout";
import { FullPageLoader, GuestOnly, RequireAuth } from "./guards";
import ScrollToTop from "./ScrollToTop";
import RouteError from "./RouteError";

const L = (factory) => {
  const C = lazy(factory);
  return (
    <Suspense fallback={<FullPageLoader />}>
      <C />
    </Suspense>
  );
};

function Root() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: L(() => import("@/pages/public/Home")) },
          { path: "courses", element: L(() => import("@/pages/public/Catalog")) },
          { path: "courses/:slug", element: L(() => import("@/pages/public/CourseDetail")) },
          { path: "categories/:slug", element: L(() => import("@/pages/public/Category")) },
          { path: "instructors", element: L(() => import("@/pages/public/Instructors")) },
          { path: "faq", element: L(() => import("@/pages/public/Faq")) },
          { path: "instructors/:id", element: L(() => import("@/pages/public/InstructorProfile")) },
          { path: "pricing", element: L(() => import("@/pages/public/Pricing")) },
          { path: "about", element: L(() => import("@/pages/public/About")) },
          { path: "contact", element: L(() => import("@/pages/public/Contact")) },
          { path: "teach", element: L(() => import("@/pages/public/Teach")) },
          { path: "verify/:code?", element: L(() => import("@/pages/public/Verify")) },
          { path: "cart", element: L(() => import("@/pages/student/Cart")) },
          {
            element: <RequireAuth />,
            children: [
              { path: "checkout", element: L(() => import("@/pages/student/Checkout")) },
              { path: "checkout/success/:orderId", element: L(() => import("@/pages/student/CheckoutSuccess")) },
            ],
          },
          { path: "*", element: L(() => import("@/pages/public/NotFound")) },
        ],
      },
      {
        element: <GuestOnly />,
        children: [
          { path: "sign-in", element: L(() => import("@/pages/auth/SignIn")) },
          { path: "sign-up", element: L(() => import("@/pages/auth/SignUp")) },
          { path: "verify-email", element: L(() => import("@/pages/auth/VerifyEmail")) },
          { path: "forgot-password", element: L(() => import("@/pages/auth/ForgotPassword")) },
          { path: "reset-password", element: L(() => import("@/pages/auth/ResetPassword")) },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "learn/:courseId", element: L(() => import("@/pages/student/Player")) },
          { path: "learn/:courseId/quiz/:lessonId", element: L(() => import("@/pages/student/Quiz")) },
          {
            element: <AppLayout role="student" />,
            children: [
              { path: "dashboard", element: L(() => import("@/pages/student/Dashboard")) },
              { path: "my-learning", element: L(() => import("@/pages/student/MyLearning")) },
              { path: "wishlist", element: L(() => import("@/pages/student/Wishlist")) },
              { path: "orders", element: L(() => import("@/pages/student/Orders")) },
              { path: "orders/:id", element: L(() => import("@/pages/student/Invoice")) },
              { path: "certificates", element: L(() => import("@/pages/student/Certificates")) },
              { path: "certificates/:code", element: L(() => import("@/pages/student/CertificateView")) },
              { path: "notifications", element: L(() => import("@/pages/student/Notifications")) },
              { path: "settings/:tab?", element: L(() => import("@/pages/student/Settings")) },
            ],
          },
        ],
      },
      {
        element: <RequireAuth roles={["instructor", "admin"]} />,
        children: [
          {
            path: "studio",
            element: <AppLayout role="instructor" />,
            children: [
              { index: true, element: L(() => import("@/pages/instructor/Dashboard")) },
              { path: "courses", element: L(() => import("@/pages/instructor/Courses")) },
              { path: "courses/new", element: L(() => import("@/pages/instructor/NewCourse")) },
              { path: "courses/:id/:tab?", element: L(() => import("@/pages/instructor/CourseEditor")) },
              { path: "students", element: L(() => import("@/pages/instructor/Students")) },
              { path: "qa", element: L(() => import("@/pages/instructor/QA")) },
              { path: "reviews", element: L(() => import("@/pages/instructor/Reviews")) },
              { path: "earnings", element: L(() => import("@/pages/instructor/Earnings")) },
            ],
          },
        ],
      },
      {
        element: <RequireAuth roles={["admin"]} />,
        children: [
          {
            path: "admin",
            element: <AppLayout role="admin" />,
            children: [
              { index: true, element: L(() => import("@/pages/admin/Overview")) },
              { path: "users", element: L(() => import("@/pages/admin/Users")) },
              { path: "courses", element: L(() => import("@/pages/admin/CourseReview")) },
              { path: "payments", element: L(() => import("@/pages/admin/Payments")) },
              { path: "payouts", element: L(() => import("@/pages/admin/Payouts")) },
              { path: "coupons", element: L(() => import("@/pages/admin/Coupons")) },
              { path: "categories", element: L(() => import("@/pages/admin/Categories")) },
              { path: "reports", element: L(() => import("@/pages/admin/Reports")) },
              { path: "roles", element: L(() => import("@/pages/admin/Roles")) },
              { path: "audit", element: L(() => import("@/pages/admin/Audit")) },
              { path: "settings", element: L(() => import("@/pages/admin/Settings")) },
            ],
          },
        ],
      },
    ],
  },
]);
