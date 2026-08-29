"use client";

import { useMemo, useState } from "react";
import { WorkTile } from "@/components/WorkTile";
import type { Work } from "@/lib/types";

export function availabilityLabel(value: string): string {
  if (value === "Unsold") return "Vault";
  if (value === "Always On") return "Open";
  if (value === "") return "All";
  return value;
}

function availabilityRank(value: string): number {
  if (value === "Sold Out") return 0;
  if (value === "Unsold") return 1;
  if (value === "Always On") return 2;
  return 99;
}

function sortAvailabilities(values: string[]): string[] {
  return [...values].sort((a, b) => availabilityRank(a) - availabilityRank(b));
}

const selectClass =
  "mt-2 block min-h-11 w-full rounded-none border border-line bg-background px-3 py-2 text-base text-foreground";

export function CatalogFilters(props: {
  collections: string[];
  mediaTypes: string[];
  availabilities: string[];
  collection: string;
  medium: string;
  availability: string;
  onCollectionChange: (value: string) => void;
  onMediumChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
}) {
  const orderedAvailabilities = sortAvailabilities(props.availabilities);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label
          htmlFor="catalog-filter-collection"
          className="block text-sm text-foreground"
        >
          Collection
        </label>
        <select
          id="catalog-filter-collection"
          className={selectClass}
          value={props.collection}
          onChange={(event) =>
            props.onCollectionChange(event.currentTarget.value)
          }
        >
          <option value="">All</option>
          {props.collections.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="catalog-filter-medium"
          className="block text-sm text-foreground"
        >
          Medium
        </label>
        <select
          id="catalog-filter-medium"
          className={selectClass}
          value={props.medium}
          onChange={(event) => props.onMediumChange(event.currentTarget.value)}
        >
          <option value="">All</option>
          {props.mediaTypes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="catalog-filter-availability"
          className="block text-sm text-foreground"
        >
          Availability
        </label>
        <select
          id="catalog-filter-availability"
          className={selectClass}
          value={props.availability}
          onChange={(event) =>
            props.onAvailabilityChange(event.currentTarget.value)
          }
        >
          <option value="">All</option>
          {orderedAvailabilities.map((name) => (
            <option key={name} value={name}>
              {availabilityLabel(name)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function CatalogIndexClient(props: {
  works: Work[];
  heldIds: string[];
  mode: "catalog" | "scorecard";
  collections: string[];
  mediaTypes: string[];
  availabilities: string[];
}) {
  const { works, heldIds, mode } = props;
  const [collection, setCollection] = useState("");
  const [medium, setMedium] = useState("");
  const [availability, setAvailability] = useState("");

  const held = useMemo(() => new Set(heldIds), [heldIds]);

  const filtered = useMemo(() => {
    return works.filter((work) => {
      if (collection && work.collection !== collection) return false;
      if (medium && !work.medium.includes(medium)) return false;
      if (availability && work.availability !== availability) return false;
      return true;
    });
  }, [works, collection, medium, availability]);

  const filtersOn = collection !== "" || medium !== "" || availability !== "";

  function clearFilters() {
    setCollection("");
    setMedium("");
    setAvailability("");
  }

  return (
    <div className="mt-10">
      <CatalogFilters
        collections={props.collections}
        mediaTypes={props.mediaTypes}
        availabilities={props.availabilities}
        collection={collection}
        medium={medium}
        availability={availability}
        onCollectionChange={setCollection}
        onMediumChange={setMedium}
        onAvailabilityChange={setAvailability}
      />

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {filtersOn
            ? `${filtered.length} of ${works.length} works`
            : `${works.length} works`}
        </p>
        {filtersOn && filtered.length > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-none text-sm text-foreground underline underline-offset-2 active:opacity-70"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 max-w-[65ch] border border-line p-8">
          <h3 className="text-xl tracking-tight text-foreground">
            No matching works
          </h3>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Nothing in the catalog matches these filters. Clear the collection,
            medium, or availability filters to see every entry.
          </p>
          <button type="button" onClick={clearFilters} className="btn btn-gold mt-6">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {filtered.map((work) => (
            <li key={work.id}>
              <WorkTile
                work={work}
                dimmed={mode === "scorecard" && !held.has(work.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
