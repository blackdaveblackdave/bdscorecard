export type CatalogMode = "catalog" | "scorecard";
export type HoldingsView = "all" | "held" | "missed";

export function includeInHoldingsView(
  held: boolean,
  view: HoldingsView,
): boolean {
  if (view === "held") return held;
  if (view === "missed") return !held;
  return true;
}

export function dimUnheldInIndex(opts: {
  mode: CatalogMode;
  held: boolean;
  view: HoldingsView;
}): boolean {
  return opts.mode === "scorecard" && opts.view === "all" && !opts.held;
}
