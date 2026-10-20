import { Link } from "react-router";
import { Heart } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { CourseGrid } from "@/components/course/CourseCard";
import { useWishlist } from "@/features/cart/useCart";
import { useTitle } from "@/hooks/useTitle";

export default function Wishlist() {
  useTitle("Wishlist");
  const { items, isLoading } = useWishlist();
  return (
    <>
      <PageHeader title="Wishlist" description={items.length ? `${items.length} saved courses. Prices change often, so check back.` : undefined} />
      {!isLoading && items.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" body="Tap the heart on any course to save it for later." action={<Button size="sm" asChild><Link to="/courses">Browse courses</Link></Button>} />
      ) : (
        <CourseGrid courses={items} loading={isLoading} count={3} />
      )}
    </>
  );
}
