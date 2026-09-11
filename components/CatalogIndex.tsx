import { CatalogIndexClient } from "@/components/CatalogFilters";
import { FoldSection } from "@/components/FoldSection";
import type { CatalogMode } from "@/lib/catalog-view";
import type { Work } from "@/lib/types";

function heldIdList(heldIds?: Set<string> | string[]): string[] {
  if (!heldIds) return [];
  return Array.isArray(heldIds) ? heldIds : [...heldIds];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function CatalogIndex(props: {
  works: Work[];
  heldIds?: Set<string> | string[];
  mode?: CatalogMode;
  foldable?: boolean;
}) {
  const mode = props.mode ?? "catalog";
  const ids = heldIdList(props.heldIds);

  return (
    <FoldSection
      id="works"
      title="Works"
      foldable={props.foldable}
      lede={
        mode === "scorecard"
          ? "Works you hold sit at full weight. Everything else stays in the list, quieter. Filter to Missed to see only the gaps. Still-available work is listed below."
          : "Every published work, numbered as it entered the record. Filter by collection, medium, or whether a piece is still open."
      }
    >
      <CatalogIndexClient
        works={props.works}
        heldIds={ids}
        mode={mode}
        collections={uniqueSorted(props.works.map((work) => work.collection))}
        mediaTypes={uniqueSorted(props.works.flatMap((work) => work.medium))}
        availabilities={uniqueSorted(
          props.works.map((work) => work.availability),
        )}
      />
    </FoldSection>
  );
}
