"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FeaturedWork } from "@/lib/catalog";

const FEATURE_DWELL_MS = 8000;
const ease = [0.16, 1, 0.3, 1] as const;

export function Hero(props: { works: FeaturedWork[] }) {
  const reduce = useReducedMotion();
  const works = props.works;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const hoverPause = useRef(false);
  const current = works[index] ?? works[0];
  const canCycle = !reduce && playing && works.length > 1;

  useEffect(() => {
    if (!canCycle) return;
    const timer = window.setInterval(() => {
      if (hoverPause.current) return;
      setIndex((currentIndex) => (currentIndex + 1) % works.length);
    }, FEATURE_DWELL_MS);
    return () => window.clearInterval(timer);
  }, [canCycle, works.length]);

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[1400px] grid-cols-1 content-start gap-6 px-4 pt-8 pb-6 md:grid-cols-12 md:content-center md:items-center md:gap-10 md:px-8 md:pt-16 md:pb-10 lg:pt-20">
      <motion.div
        className="flex flex-col justify-center md:col-span-5"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
      >
        <h1 className="max-w-[12ch] text-4xl font-medium leading-[1.1] tracking-tighter text-foreground sm:text-5xl md:text-6xl">
          The complete works
        </h1>
        <p className="mt-4 max-w-[32ch] text-base leading-relaxed text-muted md:mt-5">
          Every NFT Black Dave released, scored against what you still hold.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
          <Link href="/works" className="btn btn-ghost whitespace-nowrap">
            Works
          </Link>
          <Link href="/vault" className="btn btn-ghost whitespace-nowrap">
            Vault
          </Link>
        </div>
      </motion.div>

      <motion.figure
        className="min-w-0 md:col-span-6 md:col-start-7"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: reduce ? 0 : 0.12, ease }}
        onMouseEnter={() => {
          hoverPause.current = true;
        }}
        onMouseLeave={() => {
          hoverPause.current = false;
        }}
      >
        <div className="mx-auto w-full max-w-[min(100%,40dvh)] border border-line p-3 md:ml-auto md:mr-0 md:max-w-[min(100%,calc(100dvh-13rem))] md:p-4">
          <div className="relative aspect-square">
            {current ? (
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.55, ease }}
                >
                  <Image
                    src={current.artwork}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="rounded-none object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>
        </div>
        {current ? (
          <figcaption className="mt-3 flex min-h-11 items-baseline justify-between gap-4 text-sm text-muted">
            <span className="min-w-0">{current.title}</span>
            {!reduce && works.length > 1 ? (
              <button
                type="button"
                className="shrink-0 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => setPlaying((on) => !on)}
              >
                {playing ? "Pause" : "Play"}
              </button>
            ) : null}
          </figcaption>
        ) : null}
      </motion.figure>
    </section>
  );
}
