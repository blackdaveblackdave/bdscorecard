import assert from "node:assert/strict";
import test from "node:test";
import { dimUnheldInIndex, includeInHoldingsView, shuffleList } from "./catalog-view";

test("holdings view keeps every work in All", () => {
  assert.equal(includeInHoldingsView(true, "all"), true);
  assert.equal(includeInHoldingsView(false, "all"), true);
});

test("holdings view Held keeps only held works", () => {
  assert.equal(includeInHoldingsView(true, "held"), true);
  assert.equal(includeInHoldingsView(false, "held"), false);
});

test("holdings view Missed keeps only unheld works", () => {
  assert.equal(includeInHoldingsView(true, "missed"), false);
  assert.equal(includeInHoldingsView(false, "missed"), true);
});

test("scorecard All dims unheld works and leaves held solid", () => {
  assert.equal(
    dimUnheldInIndex({ mode: "scorecard", held: false, view: "all" }),
    true,
  );
  assert.equal(
    dimUnheldInIndex({ mode: "scorecard", held: true, view: "all" }),
    false,
  );
});

test("Held and Missed lists are not dimmed", () => {
  assert.equal(
    dimUnheldInIndex({ mode: "scorecard", held: false, view: "missed" }),
    false,
  );
  assert.equal(
    dimUnheldInIndex({ mode: "scorecard", held: true, view: "held" }),
    false,
  );
});

test("public catalog never dims", () => {
  assert.equal(
    dimUnheldInIndex({ mode: "catalog", held: false, view: "all" }),
    false,
  );
});

test("shuffleList keeps the same items in a new order", () => {
  const items = ["a", "b", "c"];
  const shuffled = shuffleList(items, () => 0);
  assert.deepEqual(shuffled, ["b", "c", "a"]);
  assert.deepEqual(items, ["a", "b", "c"]);
});
