import assert from "node:assert/strict";
import test from "node:test";
import {
  BLACK_DAVE_TOKEN,
  MINT_SONGS,
  OPENSEA_SHARED,
  RARIBLE_1155,
  RARIBLE_721,
} from "./contracts";
import { etherscanHoldingsKind, hasErc1155Balance, isErc721Owner } from "./holdings";

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

test("ERC-721 owner match is case-insensitive and rejects bigint", () => {
  const owner = "0xed22bb0106c24c7f6b4d8aae33639e1467061f64";
  assert.equal(isErc721Owner(owner, "0xeD22Bb0106c24C7f6b4d8AAe33639e1467061F64"), true);
  assert.equal(isErc721Owner(owner, "0x4231c2179E2A7F6Dc5DeE20191d4577b040FC223"), false);
  assert.equal(isErc721Owner(owner, 36n), false);
});
