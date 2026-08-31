"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import type { Work } from "@/lib/types";

function fallbackTone(catalogNumber: string): "accent" | "line" {
  const n = Number.parseInt(catalogNumber.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return "line";
  return n % 2 === 0 ? "accent" : "line";
}

export function mintYear(mintDate: string): string | null {
  if (!mintDate) return null;
  const year = mintDate.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function WorkArt(props: {
  work: Work;
  sizes: string;
  size?: "sm" | "lg";
}) {
  const { work, sizes, size = "sm" } = props;
  const [failed, setFailed] = useState(false);
  const showFallback = work.artwork === "" || failed;
  const tone = fallbackTone(work.catalogNumber);
  const large = size === "lg";

  if (showFallback) {
    return (
      <div
        className={
          tone === "accent"
            ? `flex h-full w-full flex-col justify-end bg-accent text-accent-ink ${large ? "p-5 md:p-6" : "p-2"}`
            : `flex h-full w-full flex-col justify-end bg-line text-foreground ${large ? "p-5 md:p-6" : "p-2"}`
        }
      >
        <span
          className={
            large
              ? "font-mono text-sm leading-none"
              : "font-mono text-[11px] leading-none"
          }
        >
          {work.catalogNumber}
        </span>
        <span
          className={
            large
              ? "mt-2 line-clamp-4 text-xl leading-snug md:text-2xl"
              : "mt-1 line-clamp-3 text-xs leading-snug"
          }
        >
          {work.title}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={work.artwork}
      alt=""
      fill
      sizes={sizes}
      className="rounded-none object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function WorkMeta(props: { work: Work }) {
  const { work } = props;
  const year = mintYear(work.mintDate);
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted">
      <span>{work.collection}</span>
      {work.platform ? <span>{work.platform}</span> : null}
      {year ? <span>{year}</span> : null}
      {work.editions != null ? <span>Ed. {work.editions}</span> : null}
    </div>
  );
}

function TileMotion(props: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  // Animate on mount, not whileInView. IntersectionObserver can miss
  // SSR/hydration cases and leave tiles stuck at opacity 0 forever.
  return (
    <motion.div
      className={props.className}
      initial={reduce ? false : { y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {props.children}
    </motion.div>
  );
}

function WorkShell(props: {
  work: Work;
  className?: string;
  children: ReactNode;
}) {
  const { work, className, children } = props;
  if (!work.externalUrl) {
    return <article className={className}>{children}</article>;
  }
  return (
    <a
      href={work.externalUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only">Opens in a new tab</span>
    </a>
  );
}

export function WorkTile(props: { work: Work; dimmed?: boolean }) {
  const { work, dimmed = false } = props;
  return (
    <TileMotion>
      <WorkShell
        work={work}
        className={
          dimmed
            ? "group block py-4 opacity-35"
            : "group block py-4"
        }
      >
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 md:grid-cols-[5.5rem_5.5rem_minmax(0,1fr)] md:items-center md:gap-6">
          <span className="col-span-2 font-mono text-sm text-foreground md:col-span-1">
            {work.catalogNumber}
          </span>
          <div className="relative aspect-square w-full overflow-hidden bg-line">
            <WorkArt work={work} sizes="88px" size="sm" />
          </div>
          <div className="min-w-0 self-center">
            <h3 className="text-base tracking-tight text-foreground group-hover:underline group-hover:underline-offset-2 md:text-lg">
              {work.title}
            </h3>
            <WorkMeta work={work} />
          </div>
        </div>
      </WorkShell>
    </TileMotion>
  );
}
