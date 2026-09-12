"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { motion, useReducedMotion } from "motion/react";
import type { Achievement } from "@/lib/achievements";
import type { Address, ScoreBreakdown, ScoreResult } from "@/lib/types";
import { POINTS_PER_COLLECTION, POINTS_PER_MEDIUM } from "@/lib/score";

export function Scorecard(props: {
  address: Address;
  displayName: string;
  result: ScoreResult;
  achievements: Achievement[];
  heldCount: number;
  catalogCount: number;
  uncataloguedCount: number;
}) {
  const reduce = useReducedMotion();
  const identity = identityName(props.displayName, props.address);
  const copy = holdingsCopy(props);
  const showBreakdown = props.result.score > 0;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
      <motion.div
        initial={reduce ? false : { y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start md:gap-10">
          <div className="md:col-span-8">
            <h1 className="text-5xl leading-[1.05] tracking-tighter text-foreground md:text-7xl">
              {props.result.tier}
            </h1>
            {identity ? (
              <p className="mt-6 break-all font-mono text-lg leading-[1.3] text-foreground">
                {identity}
              </p>
            ) : null}
            <p className="mt-3 break-all font-mono text-sm leading-relaxed text-muted">
              {props.address}
            </p>
          </div>
          <p
            className="text-5xl tabular-nums tracking-tighter text-foreground md:col-span-4 md:pt-2 md:text-right md:text-7xl"
            aria-label={`Score ${props.result.score}`}
          >
            {props.result.score}
          </p>
        </div>

        <p className="mt-10 max-w-[65ch] text-base leading-relaxed text-muted">
          {copy}
        </p>

        {showBreakdown ? (
          <div className="mt-12 max-w-[28rem] border-t border-line">
            <BreakdownCategory
              label="Breadth"
              value={props.result.breadth}
              detail={breadthDetail(props.result)}
            />
            <BreakdownCategory
              label="Depth"
              value={props.result.depth}
              detail={depthDetail(props.result.breakdown)}
            />
            <BreakdownCategory
              label="Medium"
              value={props.result.mediumBonus}
              detail={mediumDetail(props.result)}
            />
            <BreakdownCategory
              label="Era"
              value={props.result.eraBonus}
              detail={eraDetail(props.result)}
            />
          </div>
        ) : null}

        {props.achievements.length > 0 ? (
          <div className="mt-12 max-w-[28rem] border-t border-line">
            <h2 className="py-3 text-muted">Achievements</h2>
            <ul>
              {props.achievements.map((row) => (
                <li
                  key={row.id}
                  className="border-t border-line py-3 text-foreground"
                >
                  {row.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}

function BreakdownCategory(props: {
  label: string;
  value: number;
  detail: { formula: string; lines: string[] };
}) {
  return (
    <details className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-3 outline-none marker:content-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <span className="text-muted">{props.label}</span>
        <span className="flex items-center gap-2 tabular-nums text-foreground">
          {props.value}
          <CaretDownIcon
            size={14}
            weight="regular"
            aria-hidden
            className="text-muted transition-transform duration-200 group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="pb-4">
        <p className="font-mono text-xs leading-relaxed text-muted">
          {props.detail.formula}
        </p>
        {props.detail.lines.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-foreground">
            {props.detail.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

function breadthDetail(result: ScoreResult): { formula: string; lines: string[] } {
  const n = result.breakdown.collections.length;
  const noun = n === 1 ? "collection" : "collections";
  return {
    formula: `${POINTS_PER_COLLECTION} × ${n} ${noun}`,
    lines: result.breakdown.collections,
  };
}

function depthDetail(breakdown: ScoreBreakdown): { formula: string; lines: string[] } {
  return {
    formula: "⌊3 × log₂(1 + n)⌋ per collection",
    lines: breakdown.depthByCollection.map((line) => {
      const noun = line.count === 1 ? "work" : "works";
      return `${line.collection} — ${line.count} ${noun} → ${line.points}`;
    }),
  };
}

function mediumDetail(result: ScoreResult): { formula: string; lines: string[] } {
  const n = result.breakdown.media.length;
  const noun = n === 1 ? "medium" : "media";
  return {
    formula: `${POINTS_PER_MEDIUM} × ${n} ${noun}`,
    lines: result.breakdown.media,
  };
}

function eraDetail(result: ScoreResult): { formula: string; lines: string[] } {
  const year = result.breakdown.earliestYear;
  if (year === null) {
    return {
      formula: "Earliest mint year → era bonus",
      lines: [`No dated works → ${result.eraBonus}`],
    };
  }
  const label = year <= 2020 ? `${year} (2020 or earlier)` : String(year);
  return {
    formula: "Earliest mint year → era bonus",
    lines: [`${label} → ${result.eraBonus}`],
  };
}

function identityName(displayName: string, address: Address): string | null {
  const trimmed = displayName.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === address.toLowerCase()) return null;
  return trimmed;
}

function holdingsCopy(opts: {
  heldCount: number;
  catalogCount: number;
  uncataloguedCount: number;
}): string {
  const uncatalogued = uncataloguedSentence(opts.uncataloguedCount);
  const catalogued = opts.heldCount - opts.uncataloguedCount;
  const matched = catalogued < 0 ? 0 : catalogued;

  if (matched === 0) {
    return `Nothing in this wallet matches the resolved catalog.${uncatalogued}`;
  }

  return `This wallet holds ${matched} of ${opts.catalogCount} works in the catalog.${uncatalogued}`;
}

function uncataloguedSentence(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return " Uncatalogued Work is counted.";
  return ` ${count} Uncatalogued Work tokens are counted.`;
}
