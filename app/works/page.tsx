import { CatalogIndex } from "@/components/CatalogIndex";
import { getCatalog } from "@/lib/catalog";

export const metadata = {
  title: "Works",
  description: "Every published Black Dave work, numbered as it entered the record.",
};

export default function WorksPage() {
  return <CatalogIndex works={getCatalog()} />;
}
