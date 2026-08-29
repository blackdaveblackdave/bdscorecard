"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { WorkArt, WorkMeta } from "@/components/WorkTile";
import type { Work } from "@/lib/types";

function aspectFor(catalogNumber: string, featured: boolean): string {
  if (featured) return "aspect-[16/9] md:aspect-[2/1]";
  const n = Number.parseInt(catalogNumber.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return "aspect-[4/5]";
  if (n % 3 === 0) return "aspect-square";
  if (n % 3 === 1) return "aspect-[4/5]";
  return "aspect-[3/4]";
}

function FadeIn(props: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {props.children}
    </motion.div>
  );
}

function VaultTile(props: { work: Work; featured?: boolean }) {
  const { work, featured = false } = props;
  const frame = (
    <>
      <div
        className={`relative w-full overflow-hidden bg-line ${aspectFor(work.catalogNumber, featured)}`}
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none">
          <WorkArt
            work={work}
            sizes={
              featured ? "100vw" : "(max-width: 768px) 100vw, 50vw"
            }
            size="lg"
          />
        </div>
      </div>
      <div className="mt-4">
        <p className="font-mono text-sm text-foreground">{work.catalogNumber}</p>
        <h3 className="mt-1 text-xl tracking-tight text-foreground group-hover:underline group-hover:underline-offset-2 md:text-2xl">
          {work.title}
        </h3>
        <WorkMeta work={work} />
      </div>
    </>
  );

  if (!work.externalUrl) {
    return (
      <FadeIn>
        <article className="group block">{frame}</article>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <a
        href={work.externalUrl}
        target="_blank"
        rel="noreferrer"
        className="group block"
      >
        {frame}
        <span className="sr-only">Opens in a new tab</span>
      </a>
    </FadeIn>
  );
}

export function Vault(props: { works: Work[] }) {
  const { works } = props;

  return (
    <section
      id="vault"
      className="scroll-mt-24 mx-auto w-full max-w-[1400px] border-t border-line px-4 py-16 md:px-8 md:py-24"
    >
      <h2 className="text-3xl tracking-tighter text-foreground md:text-4xl">
        The Vault
      </h2>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
        These works are still available to collect.
      </p>

      {works.length === 0 ? (
        <p className="mt-12 max-w-[65ch] text-muted">
          Nothing in the vault right now. Sold work lives in the catalog above.
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
          {works.map((work, index) => (
            <li
              key={work.id}
              className={index === 0 ? "md:col-span-2" : undefined}
            >
              <VaultTile work={work} featured={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
