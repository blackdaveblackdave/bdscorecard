import assert from "node:assert/strict";
import test from "node:test";
import { unlockedAchievements } from "./achievements";
import type { Work } from "./types";

function work(
  partial: Partial<Work> & Pick<Work, "id" | "title" | "collection">,
): Work {
  return {
    platform: "Opensea",
    medium: ["2D Artwork"],
    editions: 1,
    priceEth: 0.05,
    mintDate: "2021-03-26",
    availability: "Sold Out",
    artwork: "",
    externalUrl: "",
    chain: "ethereum",
    contract: "0x495f947276749ce646f68ac8c248420045cb7b5e",
    tokenId: "1",
    resolved: true,
    catalogNumber: "BD-001",
    ...partial,
  };
}

function titles(held: Work[]): string[] {
  return unlockedAchievements(held).map((row) => row.title);
}

test("empty holdings unlock nothing", () => {
  assert.deepEqual(unlockedAchievements([]), []);
});

test("unresolved and uncatalogued works unlock nothing", () => {
  assert.deepEqual(
    titles([
      work({
        id: "later",
        title: "Later Work",
        collection: "Catalog",
        resolved: false,
      }),
      work({
        id: "u",
        title: "Uncatalogued Work",
        collection: "Unknown",
      }),
    ]),
    [],
  );
});

test("one 1/1 unlocks 1/1 collector only", () => {
  assert.deepEqual(
    titles([
      work({
        id: "tears",
        title: "Manga Tears 022",
        collection: "Unique",
      }),
    ]),
    ["1/1 collector"],
  );
});

test("open editions are not 1/1 collector", () => {
  assert.equal(
    titles([
      work({
        id: "token",
        title: "Black Dave Token",
        collection: "Black Dave Token",
        editions: 1000000,
        mintDate: "",
      }),
    ]).includes("1/1 collector"),
    false,
  );
});

test("three collections unlocks multiple collections", () => {
  const unlocked = titles([
    work({
      id: "a",
      title: "Manga Tears 001",
      collection: "BlackDave.io 001",
      editions: 25,
    }),
    work({
      id: "b",
      title: "Triple Beam",
      collection: "Sound",
      medium: ["Music"],
      editions: 25,
      mintDate: "2022-02-02",
    }),
    work({
      id: "c",
      title: "Black Dave Token",
      collection: "Black Dave Token",
      editions: 1000000,
      mintDate: "",
    }),
  ]);
  assert.equal(unlocked.includes("Multiple collections"), true);
  assert.equal(unlocked.includes("1/1 collector"), false);
});

test("three songs unlocks multiple songs", () => {
  const unlocked = titles([
    work({
      id: "a",
      title: "Triple Beam",
      collection: "Sound",
      medium: ["Music"],
      editions: 25,
      mintDate: "2022-02-02",
    }),
    work({
      id: "b",
      title: "Bag",
      collection: "Sound",
      medium: ["Music"],
      editions: 50,
      mintDate: "2022-11-09",
    }),
    work({
      id: "c",
      title: "Advice",
      collection: "Sound",
      medium: ["Music"],
      editions: 33,
      mintDate: "2023-04-01",
    }),
  ]);
  assert.equal(unlocked.includes("Multiple songs"), true);
  assert.equal(unlocked.includes("Across years"), true);
});

test("three works in one OpenSea series unlocks OpenSea series", () => {
  const unlocked = titles([
    work({
      id: "a",
      title: "Banana Flip",
      collection: "Flips!",
    }),
    work({
      id: "b",
      title: "Bitcoigonia",
      collection: "Flips!",
    }),
    work({
      id: "c",
      title: "ETH Tires",
      collection: "Flips!",
    }),
  ]);
  assert.equal(unlocked.includes("OpenSea series"), true);
});

test("two in one OpenSea series and one in another does not unlock", () => {
  const unlocked = titles([
    work({
      id: "a",
      title: "Banana Flip",
      collection: "Flips!",
    }),
    work({
      id: "b",
      title: "Bitcoigonia",
      collection: "Flips!",
    }),
    work({
      id: "c",
      title: "Manga Tears 001",
      collection: "BlackDave.io 001",
    }),
  ]);
  assert.equal(unlocked.includes("OpenSea series"), false);
});

test("2020 work unlocks OG", () => {
  const unlocked = titles([
    work({
      id: "eva",
      title: "Dressed Up EVA Kids",
      collection: "Rarible",
      editions: 5,
      mintDate: "2020-12-19",
    }),
  ]);
  assert.equal(unlocked.includes("OG"), true);
  assert.equal(unlocked.includes("1/1 collector"), false);
});

test("2D and music unlock Sight and sound", () => {
  const unlocked = titles([
    work({
      id: "a",
      title: "Manga Tears 001",
      collection: "BlackDave.io 001",
    }),
    work({
      id: "b",
      title: "Triple Beam",
      collection: "Sound",
      medium: ["Music"],
      editions: 25,
      mintDate: "2022-02-02",
    }),
  ]);
  assert.equal(unlocked.includes("Sight and sound"), true);
  assert.equal(unlocked.includes("Across years"), true);
});

test("one collab with combined medium is not Sight and sound alone", () => {
  const unlocked = titles([
    work({
      id: "sajin",
      title: "SAJIN (w/ Monday!)",
      collection: "Collabs",
      medium: ["3D Artwork,Music"],
      mintDate: "2022-03-01",
    }),
  ]);
  assert.equal(unlocked.includes("Sight and sound"), false);
  assert.equal(unlocked.includes("Multiple songs"), false);
});
