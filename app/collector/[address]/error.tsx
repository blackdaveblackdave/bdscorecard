"use client";

import Link from "next/link";

export default function CollectorError({
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const again = retry ?? reset;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-24 md:px-8">
      <h1 className="text-4xl tracking-tighter text-foreground">
        Could not read holdings
      </h1>
      <p className="mt-4 max-w-[65ch] leading-relaxed text-muted">
        Try again, or go back to{" "}
        <Link href="/" className="text-foreground hover:text-accent">
          Works
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={() => again?.()}
        className="mt-8 cursor-pointer rounded-none border border-line bg-transparent px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
