import assert from "node:assert/strict";
import test from "node:test";
import {
  BLACK_DAVE_TOKEN,
  MINT_SONGS,
  OPENSEA_SHARED,
  RARIBLE_1155,
  RARIBLE_721,
} from "./contracts";
import { etherscanHoldingsKind, hasErc1155Balance } from "./holdings";

test("Black Dave Token is ERC-1155, not ERC-20", () => {
  assert.equal(
    etherscanHoldingsKind(BLACK_DAVE_TOKEN, "ethereum"),
    "erc1155-catalog",
  );
});

test("OpenSea shared storefront uses transfer history on Ethereum", () => {
  assert.equal(
    etherscanHoldingsKind(OPENSEA_SHARED, "ethereum"),
    "opensea-1155",
  );
});

test("Rarible 1155 uses catalog RPC balances", () => {
  assert.equal(
    etherscanHoldingsKind(RARIBLE_1155, "ethereum"),
    "erc1155-catalog",
  );
});

test("Mint Songs and Rarible 721 use catalog ownerOf, not the PRO inventory endpoint", () => {
  assert.equal(
    etherscanHoldingsKind(MINT_SONGS, "ethereum"),
    "erc721-catalog",
  );
  assert.equal(
    etherscanHoldingsKind(RARIBLE_721, "ethereum"),
    "erc721-catalog",
  );
});

test("zero ERC-1155 balance is not held (bigint 0n is not number 0)", () => {
  assert.equal(hasErc1155Balance(0n), false);
  assert.equal(hasErc1155Balance(1n), true);
});
