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

export function shuffleList<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const left = next[i];
    const right = next[j];
    if (left === undefined || right === undefined) continue;
    next[i] = right;
    next[j] = left;
  }
  return next;
}
