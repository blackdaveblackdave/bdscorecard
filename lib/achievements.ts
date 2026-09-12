import { cataloguedWorks } from "./score";
import type { Work } from "./types";

export const OPENSEA_SERIES = [
  "BlackDave.io 001",
  "BlackDave.io 002",
  "Flips!",
] as const;

export type Achievement = {
  id: string;
  title: string;
};

type AchievementDef = Achievement & {
  unlock: (held: Work[]) => boolean;
};

const DEFINITIONS: AchievementDef[] = [
  {
    id: "multiple-collections",
    title: "Multiple collections",
    unlock: (held) => new Set(held.map((work) => work.collection)).size >= 3,
  },
  {
    id: "multiple-songs",
    title: "Multiple songs",
    unlock: (held) => held.filter(isMusic).length >= 3,
  },
  {
    id: "one-of-ones",
    title: "1/1 collector",
    unlock: (held) => held.some((work) => work.editions === 1),
  },
  {
    id: "opensea-series",
    title: "OpenSea series",
    unlock: (held) => {
      const counts = new Map<string, number>();
      for (const work of held) {
        if (!isOpenSeaSeries(work.collection)) continue;
        counts.set(work.collection, (counts.get(work.collection) ?? 0) + 1);
      }
      return [...counts.values()].some((count) => count >= 3);
    },
  },
  {
    id: "og",
    title: "OG",
    unlock: (held) => held.some((work) => (mintYear(work) ?? Infinity) <= 2020),
  },
  {
    id: "sight-and-sound",
    title: "Sight and sound",
    unlock: (held) => held.some(isTwoD) && held.some(isMusic),
  },
  {
    id: "across-years",
    title: "Across years",
    unlock: (held) => {
      const years = new Set(
        held.map(mintYear).filter((year): year is number => year !== null),
      );
      return years.size >= 2;
    },
  },
];

export function unlockedAchievements(held: Work[]): Achievement[] {
  const works = cataloguedWorks(held);
  return DEFINITIONS.filter((row) => row.unlock(works)).map(({ id, title }) => ({
    id,
    title,
  }));
}

function isOpenSeaSeries(collection: string): boolean {
  return (OPENSEA_SERIES as readonly string[]).includes(collection);
}

function isMusic(work: Work): boolean {
  return work.medium.some(
    (medium) => medium === "Audio" || medium.includes("Music"),
  );
}

function isTwoD(work: Work): boolean {
  return work.medium.some((medium) => medium.includes("2D"));
}

function mintYear(work: Work): number | null {
  const year = new Date(work.mintDate).getFullYear();
  return Number.isFinite(year) ? year : null;
}
