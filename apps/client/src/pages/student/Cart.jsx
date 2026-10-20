import { Link, useNavigate } from "react-router";
import { ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import CourseThumb from "@/components/course/CourseThumb";
import Price from "@/components/course/Price";
import OrderSummary from "@/features/cart/OrderSummary";
import { useCart, useWishlist } from "@/features/cart/useCart";
import { useQuote } from "@/features/cart/useQuote";
import { useAuth } from "@/store/auth";
import { duration } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function Cart() {
  useTitle("Cart");
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();
  const qc = useQueryClient();
  const quote = useQuote(cart.items);

  return (
    <div className="container-page grid gap-8 py-10">
      <PageHeader title="Cart" description={cart.count ? `${cart.count} course${cart.count > 1 ? "s" : ""} in your cart` : undefined} />
      {cart.isLoading ? (
        <Skeleton className="h-48" />
      ) : cart.items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" body="Find a course and add it here." action={<Button size="sm" asChild><Link to="/courses">Browse courses</Link></Button>} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <ul className="grid gap-3">
            {cart.items.map((c) => (
              <li key={c._id} className="grid grid-cols-[110px_1fr] gap-4 rounded-xl border border-border bg-card p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                <Link to={`/courses/${c.slug}`}><CourseThumb course={c} compact className="rounded-lg" /></Link>
                <div className="grid min-w-0 gap-1">
                  <Link to={`/courses/${c.slug}`} className="font-bold leading-snug hover:text-primary">{c.title}</Link>
                  <span className="text-xs text-muted-foreground">{c.instructor?.name} · {duration(c.totalDuration)} · ★ {c.ratingAvg}</span>
                  <div className="flex gap-4 text-xs font-semibold">
                    <button className="cursor-pointer text-destructive" onClick={() => cart.remove.mutate(c, { onSuccess: () => toast.success("Removed from cart") })}>Remove</button>
                    {user && (
                      <button
                        className="cursor-pointer text-primary"
                        onClick={async () => {
                          await wishlist.toggle.mutateAsync({ course: c, on: true });
                          await cart.remove.mutateAsync(c);
                          qc.invalidateQueries({ queryKey: ["cart"] });
                        }}
                      >
                        Move to wishlist
                      </button>
                    )}
                  </div>
                </div>
                <Price course={c} className="col-start-2 sm:col-start-auto sm:justify-self-end" />
              </li>
            ))}
          </ul>
          <OrderSummary quote={quote.data} loading={quote.isLoading}>
            <Button size="lg" onClick={() => navigate(user ? "/checkout" : "/sign-in?next=/checkout")}>
              {user ? "Checkout" : "Sign in to checkout"}
            </Button>
          </OrderSummary>
        </div>
      )}
    </div>
  );
}
