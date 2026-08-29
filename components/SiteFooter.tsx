import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-8 md:flex-row md:items-baseline md:justify-between md:px-8">
        <p className="text-sm text-muted">Black Dave Collector Scorecard</p>
        <a
          href="https://blackdave.xyz"
          className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
        >
          blackdave.xyz
          <ArrowUpRightIcon size={14} weight="regular" aria-hidden />
        </a>
      </div>
    </footer>
  );
}
