import type { ScoreResult, TierName, Work } from "./types";

const ERA_BONUS: Record<number, number> = {
  2020: 25,
  2021: 20,
  2022: 15,
  2023: 10,
};

const BLACK_DAVE_TOKEN_COLLECTION = "Black Dave Token";

function cataloguedWorks(held: Work[]): Work[] {
  return held.filter((work) => work.resolved && work.title !== "Uncatalogued Work");
}

function depthContribution(count: number): number {
  return Math.floor(3 * Math.log2(1 + count));
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
    };
  }

  const collections = new Set(works.map((work) => work.collection));
  const media = new Set(works.flatMap((work) => work.medium));

  const byCollection = new Map<string, number>();
  for (const work of works) {
    const next =
      work.collection === BLACK_DAVE_TOKEN_COLLECTION
        ? 1
        : (byCollection.get(work.collection) ?? 0) + 1;
    byCollection.set(work.collection, next);
  }

  const breadth = 10 * collections.size;
  const depth = [...byCollection.values()].reduce(
    (sum, n) => sum + depthContribution(n),
    0,
  );
  const mediumBonus = 8 * media.size;

  const years = works.map((work) => new Date(work.mintDate).getFullYear());
  const earliest = Math.min(...years);
  const eraBonus = ERA_BONUS[earliest] ?? 5;

  const total = breadth + depth + mediumBonus + eraBonus;
  return {
    score: total,
    tier: tierForScore(total),
    breadth,
    depth,
    mediumBonus,
    eraBonus,
    heldCount: held.length,
    collectionCount: collections.size,
  };
}
