import type { ScoreBreakdown, ScoreResult, TierName, Work } from "./types";

const ERA_BONUS: Record<number, number> = {
  2020: 25,
  2021: 20,
  2022: 15,
  2023: 10,
};

const POINTS_PER_COLLECTION = 10;
const POINTS_PER_MEDIUM = 8;

function eraBonusFor(year: number): number {
  if (!Number.isFinite(year)) return 5;
  if (year <= 2020) return 25;
  return ERA_BONUS[year] ?? 5;
}

const BLACK_DAVE_TOKEN_COLLECTION = "Black Dave Token";

function cataloguedWorks(held: Work[]): Work[] {
  return held.filter((work) => work.resolved && work.title !== "Uncatalogued Work");
}

function depthContribution(count: number): number {
  return Math.floor(3 * Math.log2(1 + count));
}

function emptyBreakdown(): ScoreBreakdown {
  return {
    collections: [],
    depthByCollection: [],
    media: [],
    earliestYear: null,
  };
}

export function tierForScore(score: number): TierName {
  if (score <= 0) return "Visitor";
  if (score <= 29) return "Listed";
  if (score <= 69) return "Collector";
  if (score <= 129) return "Archivist";
  return "Custodian";
}

export function score(held: Work[]): ScoreResult {
  const works = cataloguedWorks(held);
  if (works.length === 0) {
    return {
      score: 0,
      tier: "Visitor",
      breadth: 0,
      depth: 0,
      mediumBonus: 0,
      eraBonus: 0,
      heldCount: held.length,
      collectionCount: 0,
      breakdown: emptyBreakdown(),
    };
  }

  const collections = [...new Set(works.map((work) => work.collection))].sort(
    (a, b) => a.localeCompare(b),
  );
  const media = [...new Set(works.flatMap((work) => work.medium))].sort((a, b) =>
    a.localeCompare(b),
  );

  const byCollection = new Map<string, number>();
  for (const work of works) {
    const next =
      work.collection === BLACK_DAVE_TOKEN_COLLECTION
        ? 1
        : (byCollection.get(work.collection) ?? 0) + 1;
    byCollection.set(work.collection, next);
  }

  const depthByCollection = [...byCollection.entries()]
    .map(([collection, count]) => ({
      collection,
      count,
      points: depthContribution(count),
    }))
    .sort((a, b) => a.collection.localeCompare(b.collection));

  const breadth = POINTS_PER_COLLECTION * collections.length;
  const depth = depthByCollection.reduce((sum, line) => sum + line.points, 0);
  const mediumBonus = POINTS_PER_MEDIUM * media.length;

  const years = works
    .map((work) => new Date(work.mintDate).getFullYear())
    .filter((year) => Number.isFinite(year));
  const earliest = years.length > 0 ? Math.min(...years) : Number.NaN;
  const eraBonus = eraBonusFor(earliest);
  const earliestYear = Number.isFinite(earliest) ? earliest : null;

  const total = breadth + depth + mediumBonus + eraBonus;
  return {
    score: total,
    tier: tierForScore(total),
    breadth,
    depth,
    mediumBonus,
    eraBonus,
    heldCount: held.length,
    collectionCount: collections.length,
    breakdown: {
      collections,
      depthByCollection,
      media,
      earliestYear,
    },
  };
}

export { POINTS_PER_COLLECTION, POINTS_PER_MEDIUM };
