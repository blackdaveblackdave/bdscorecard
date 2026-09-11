import { CatalogIndexClient } from "@/components/CatalogFilters";
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
}) {
  const mode = props.mode ?? "catalog";
  const ids = heldIdList(props.heldIds);

  return (
    <section
      id="works"
      className="scroll-mt-24 mx-auto w-full max-w-[1400px] px-4 py-16 md:px-8 md:py-24"
    >
      <h2 className="text-3xl tracking-tighter text-foreground md:text-4xl">
        Works
      </h2>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
        {mode === "scorecard"
          ? "Works you hold sit at full weight. Everything else stays in the list, quieter. Filter to Missed to see only the gaps."
          : "Every published work, numbered as it entered the record. Filter by collection, medium, or whether a piece is still open."}
      </p>
      <CatalogIndexClient
        works={props.works}
        heldIds={ids}
        mode={mode}
        collections={uniqueSorted(props.works.map((work) => work.collection))}
        mediaTypes={uniqueSorted(props.works.flatMap((work) => work.medium))}
        availabilities={uniqueSorted(props.works.map((work) => work.availability))}
      />
    </section>
  );
}
