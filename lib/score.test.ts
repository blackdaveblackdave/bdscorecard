import assert from "node:assert/strict";
import test from "node:test";
import { decodeOpenSeaToken, isBlackDaveOpenSeaToken } from "./opensea-tokens";
import { score, tierForScore } from "./score";
import type { Work } from "./types";

const SAMPLE_OS =
  "107259508568675199262418313251991622091448984144640299147874399518015239487489";

function work(partial: Partial<Work> & Pick<Work, "id" | "title" | "collection">): Work {
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

test("OpenSea creator bits match Black Dave", () => {
  assert.equal(isBlackDaveOpenSeaToken(SAMPLE_OS), true);
  const decoded = decodeOpenSeaToken(SAMPLE_OS);
  assert.equal(decoded.creator, "0xed22bb0106c24c7f6b4d8aae33639e1467061f64");
  assert.equal(decoded.index, 17);
});

test("unrelated token id does not match", () => {
  assert.equal(isBlackDaveOpenSeaToken("1"), false);
});

test("empty holdings are Visitor", () => {
  const result = score([]);
  assert.equal(result.score, 0);
  assert.equal(result.tier, "Visitor");
});

test("unresolved works do not score", () => {
  const result = score([
    work({
      id: "x",
      title: "Later Work",
      collection: "Catalog",
      resolved: false,
      mintDate: "2023-01-01",
    }),
  ]);
  assert.equal(result.score, 0);
  assert.equal(result.tier, "Visitor");
});

test("breadth beats stacking Black Dave Token", () => {
  const stacked = score([
    work({
      id: "t1",
      title: "Black Dave Token",
      collection: "Black Dave Token",
      mintDate: "2022-12-19",
    }),
    work({
      id: "t2",
      title: "Black Dave Token",
      collection: "Black Dave Token",
      mintDate: "2022-12-19",
    }),
  ]);
  const across = score([
    work({
      id: "a",
      title: "Manga Tears 001",
      collection: "BlackDave.io 001",
      mintDate: "2021-03-26",
    }),
    work({
      id: "b",
      title: "Triple Beam",
      collection: "Sound",
      medium: ["Audio"],
      mintDate: "2022-02-02",
    }),
  ]);
  assert.equal(stacked.collectionCount, 1);
  assert.ok(across.score > stacked.score);
});

test("tier bands", () => {
  assert.equal(tierForScore(0), "Visitor");
  assert.equal(tierForScore(1), "Listed");
  assert.equal(tierForScore(30), "Collector");
  assert.equal(tierForScore(70), "Archivist");
  assert.equal(tierForScore(130), "Custodian");
});
