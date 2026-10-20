import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Compass, LayoutDashboard, Award, ShoppingCart, Tag, User, GraduationCap, Shield } from "lucide-react";
import ActionSearchBar from "@/components/kokonut/action-search-bar";
import { get } from "@/lib/api";
import { useAuth } from "@/store/auth";

/** Kokonut UI ActionSearchBar wired to courses, categories and pages. */
export default function SearchPalette({ className }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data: courses = [] } = useQuery({
    queryKey: ["search-index"],
    queryFn: () => get("/courses", { limit: 48 }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => get("/categories").then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const items = useMemo(() => {
    const pages = [
      { id: "p-courses", label: "Browse all courses", href: "/courses", icon: <Compass />, group: "Pages" },
      { id: "p-pricing", label: "Pricing", href: "/pricing", icon: <Tag />, group: "Pages" },
      { id: "p-teach", label: "Teach on Vidya", href: "/teach", icon: <GraduationCap />, group: "Pages" },
      { id: "p-cart", label: "Cart", href: "/cart", icon: <ShoppingCart />, group: "Pages" },
    ];
    if (user) {
      pages.unshift(
        { id: "p-dash", label: "My dashboard", href: "/dashboard", icon: <LayoutDashboard />, group: "Go to", shortcut: ["G", "D"] },
        { id: "p-learning", label: "My learning", href: "/my-learning", icon: <BookOpen />, group: "Go to" },
        { id: "p-certs", label: "Certificates", href: "/certificates", icon: <Award />, group: "Go to" },
        { id: "p-settings", label: "Profile & settings", href: "/settings", icon: <User />, group: "Go to" }
      );
      if (user.role !== "student") pages.unshift({ id: "p-studio", label: "Instructor studio", href: "/studio", icon: <GraduationCap />, group: "Go to" });
      if (user.role === "admin") pages.unshift({ id: "p-admin", label: "Admin console", href: "/admin", icon: <Shield />, group: "Go to" });
    }
    return [
      ...pages,
      {
        id: "categories",
        label: "Categories",
        icon: <Compass />,
        group: "Browse",
        placeholder: "Pick a category",
        children: cats.map((c) => ({ id: `cat-${c._id}`, label: c.name, href: `/categories/${c.slug}`, keywords: [c.description || ""] })),
      },
      ...courses.map((c) => ({
        id: `c-${c._id}`,
        label: c.title,
        href: `/courses/${c.slug}`,
        icon: <BookOpen />,
        group: "Courses",
        keywords: [c.instructor?.name || "", c.category?.name || "", c.level],
      })),
    ];
  }, [courses, cats, user]);

  return (
    <ActionSearchBar
      className={className}
      items={items}
      label="Search courses"
      placeholder="Search courses, topics and pages…"
      shortcut
      onSelect={(item) => item.href && navigate(item.href)}
    />
  );
}
