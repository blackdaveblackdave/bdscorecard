"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function Hero(props: { featuredArtwork: string; featuredTitle: string }) {
  const reduce = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;

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
        <div className="mt-6 md:mt-8">
          <a href="#works" className="btn btn-ghost whitespace-nowrap">
            Works
          </a>
        </div>
      </motion.div>

      <motion.figure
        className="min-w-0 md:col-span-6 md:col-start-7"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: reduce ? 0 : 0.12, ease }}
      >
        <div className="mx-auto w-full max-w-[min(100%,40dvh)] border border-line p-3 md:ml-auto md:mr-0 md:max-w-[min(100%,calc(100dvh-13rem))] md:p-4">
          <div className="relative aspect-square">
            <Image
              src={props.featuredArtwork}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-none object-contain"
            />
          </div>
        </div>
        <figcaption className="mt-3 text-sm text-muted">
          {props.featuredTitle}
        </figcaption>
      </motion.figure>
    </section>
  );
}
