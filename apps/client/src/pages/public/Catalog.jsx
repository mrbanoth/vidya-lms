import { PageHeader } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";
import CatalogView from "./CatalogView";

export default function Catalog() {
  useTitle("All courses");
  return (
    <div className="container-page grid gap-8 py-10">
      <PageHeader eyebrow="Catalog" title="All courses" description="Project-based courses from working engineers. Filter by what you want to learn next." />
      <CatalogView />
    </div>
  );
}
