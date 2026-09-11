"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { useState, type ReactNode } from "react";

const headingClass =
  "text-3xl tracking-tighter text-foreground md:text-4xl";

const ledeClass =
  "mt-4 max-w-[65ch] text-base leading-relaxed text-muted";

export function FoldSection(props: {
  id: string;
  title: string;
  lede: string;
  foldable?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const panelId = `${props.id}-panel`;
  const sectionClass = props.foldable
    ? "scroll-mt-24 mx-auto w-full max-w-[1400px] border-t border-line px-4 py-8 md:px-8 md:py-10"
    : "scroll-mt-24 mx-auto w-full max-w-[1400px] px-4 py-16 md:px-8 md:py-24";

  if (!props.foldable) {
    return (
      <section id={props.id} className={sectionClass}>
        <h2 className={headingClass}>{props.title}</h2>
        <p className={ledeClass}>{props.lede}</p>
        {props.children}
      </section>
    );
  }

  return (
    <section id={props.id} className={sectionClass}>
      <h2 className={headingClass}>
        <button
          type="button"
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-6 bg-transparent p-0 text-left text-inherit"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          {props.title}
          <CaretDownIcon
            size={22}
            weight="regular"
            aria-hidden
            className={
              open
                ? "shrink-0 rotate-180 text-muted transition-transform duration-200"
                : "shrink-0 text-muted transition-transform duration-200"
            }
          />
        </button>
      </h2>
      <div id={panelId} hidden={!open}>
        <p className={ledeClass}>{props.lede}</p>
        {props.children}
      </div>
    </section>
  );
}
