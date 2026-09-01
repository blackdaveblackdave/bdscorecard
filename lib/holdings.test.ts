import assert from "node:assert/strict";
import test from "node:test";
import {
  BLACK_DAVE_TOKEN,
  CATALOG_RECORD,
  CATALOG_ZORA,
  MANGA_QUOTES,
  MINT_SONGS,
  OPENSEA_SHARED,
  RARIBLE_1155,
  RARIBLE_721,
  SUPERCOLLECTOR_CHRONICLES,
  SUPERCOLLECTOR_STAY_GOLD,
  isContractScopedHoldings,
  isSupercollectorContract,
} from "./contracts";
import { matchHeldWork } from "./catalog";
import {
  catalogTokenStandard,
  hasErc1155Balance,
  isErc721Owner,
  tokenIdsFromRange,
} from "./holdings";

test("OpenSea shared storefront and Black Dave Token are ERC-1155", () => {
  assert.equal(catalogTokenStandard(OPENSEA_SHARED), "erc1155");
  assert.equal(catalogTokenStandard(BLACK_DAVE_TOKEN), "erc1155");
});

test("Rarible 0xd07d is ERC-1155 even though the PRD called it 721", () => {
  assert.equal(catalogTokenStandard(RARIBLE_721), "erc1155");
});

test("Rarible 0x60f8 is ERC-721 even though the PRD called it 1155", () => {
  assert.equal(catalogTokenStandard(RARIBLE_1155), "erc721");
});

test("Mint Songs and Manga Quotes are ERC-721", () => {
  assert.equal(catalogTokenStandard(MINT_SONGS), "erc721");
  assert.equal(catalogTokenStandard(MANGA_QUOTES), "erc721");
});

test("Catalog Zora and RECORD contracts are ERC-721", () => {
  assert.equal(catalogTokenStandard(CATALOG_ZORA), "erc721");
  assert.equal(catalogTokenStandard(CATALOG_RECORD), "erc721");
});

test("Supercollector releases are ERC-1155 and match any token on the contract", () => {
  assert.equal(catalogTokenStandard(SUPERCOLLECTOR_CHRONICLES), "erc1155");
  assert.equal(catalogTokenStandard(SUPERCOLLECTOR_STAY_GOLD), "erc1155");
  assert.equal(isSupercollectorContract(SUPERCOLLECTOR_CHRONICLES), true);
  assert.equal(
    isSupercollectorContract("0x59DC45dFfA3bF9a94f7bCDDD31cFaa2A78c6D069"),
    true,
  );
  assert.equal(isContractScopedHoldings(SUPERCOLLECTOR_CHRONICLES), true);

  const trackThree = matchHeldWork({
    contract: SUPERCOLLECTOR_CHRONICLES,
    tokenId: "3",
  });
  assert.equal(trackThree?.id, "bd-chronicles-ep-supercollector");
  assert.equal(trackThree?.chain, "optimism");
});

test("Decent series token range expands track ids and rejects a wild span", () => {
  assert.deepEqual(tokenIdsFromRange(1n, 6n), ["1", "2", "3", "4", "5", "6"]);
  assert.deepEqual(tokenIdsFromRange(1n, 1n), ["1"]);
  assert.equal(tokenIdsFromRange(6n, 1n), null);
  assert.equal(tokenIdsFromRange(1n, 100n), null);
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
