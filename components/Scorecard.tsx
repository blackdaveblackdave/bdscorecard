"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Address, ScoreResult } from "@/lib/types";

export function Scorecard(props: {
  address: Address;
  displayName: string;
  result: ScoreResult;
  heldCount: number;
  catalogCount: number;
  indexerConfigured: boolean;
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
          <dl className="mt-12 max-w-[14rem] space-y-3">
            <BreakdownLine label="Breadth" value={props.result.breadth} />
            <BreakdownLine label="Depth" value={props.result.depth} />
            <BreakdownLine label="Medium" value={props.result.mediumBonus} />
            <BreakdownLine label="Era" value={props.result.eraBonus} />
          </dl>
        ) : null}
      </motion.div>
    </section>
  );
}

function BreakdownLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-8">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
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
  indexerConfigured: boolean;
  uncataloguedCount: number;
}): string {
  if (!opts.indexerConfigured) {
    return "Live chain reads need an Alchemy or Etherscan API key in .env.local.";
  }

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
