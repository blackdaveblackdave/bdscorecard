import assert from "node:assert/strict";
import test from "node:test";
import {
  BLACK_DAVE_TOKEN,
  CATALOG_RECORD,
  CATALOG_ZORA,
  CALM_DOWN,
  FOUNDATION,
  MANGA_QUOTES,
  MINT_SONGS,
  MINT_SONGS_FACTORY,
  OPENSEA_SHARED,
  RARIBLE_1155,
  RARIBLE_721,
  SOUND_ARTIST,
  TWO_YEARS_CODA,
  UNIQUE_ONE,
  OH_YES,
  SUPERCOLLECTOR_ABANDONED_MECH,
  SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
  SUPERCOLLECTOR_CHRONICLES,
  SUPERCOLLECTOR_SS23,
  SUPERCOLLECTOR_STAY_GOLD,
  I_HAVE_IDEAS,
  ITEM_BOX,
  THREE_PERCENT,
  WAVROOM,
  YARDS,
  BAG,
  ME_TOO,
  I_LOVE_THIS_SHIT,
  ADVICE,
  LAVENDER,
  FEEL_GOOD,
  isContractScopedHoldings,
  isSoundArtistContract,
  isSupercollectorContract,
  sequentialErc1155TokenIds,
  sequentialErc721TokenIds,
  sequentialTokenIds,
  soundEditionId,
  soundTokenId,
  soundTokenIdsForEdition,
} from "./contracts";
import { getCatalog, getWorkById, matchHeldWork } from "./catalog";
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

test("Mint Songs, Mint Songs Factory, and Manga Quotes are ERC-721", () => {
  assert.equal(catalogTokenStandard(MINT_SONGS), "erc721");
  assert.equal(catalogTokenStandard(MINT_SONGS_FACTORY), "erc721");
  assert.equal(catalogTokenStandard(MANGA_QUOTES), "erc721");
  assert.equal(isContractScopedHoldings(MANGA_QUOTES), false);

  const quotes = getWorkById("bd-the-careless-ones");
  assert.equal(quotes?.resolved, true);
  assert.equal(quotes?.chain, "polygon");
  assert.equal(quotes?.contract, MANGA_QUOTES);
  assert.equal(quotes?.tokenId, "1");
  assert.equal(
    matchHeldWork({ contract: MANGA_QUOTES, tokenId: "1" })?.id,
    "bd-the-careless-ones",
  );
  assert.equal(matchHeldWork({ contract: MANGA_QUOTES, tokenId: "2" }), undefined);
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

  const ss23 = matchHeldWork({
    contract: SUPERCOLLECTOR_SS23,
    tokenId: "5",
  });
  assert.equal(ss23?.id, "bd-ss23-supercollector");
  assert.equal(ss23?.mintDate, "2023-10-11");
  assert.equal(
    matchHeldWork({
      contract: SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
      tokenId: "1",
    })?.id,
    "bd-aspiring-gundam-pilot-supercollector",
  );
  assert.equal(
    matchHeldWork({
      contract: SUPERCOLLECTOR_ABANDONED_MECH,
      tokenId: "13",
    })?.id,
    "bd-that-time-abandoned-mech-supercollector",
  );
});

test("Supercollector albums sit in release-date catalog order", () => {
  const supercollector = getCatalog().filter(
    (work) => work.collection === "Supercollector",
  );
  assert.deepEqual(
    supercollector.map((work) => [work.id, work.mintDate, work.catalogNumber]),
    [
      ["bd-word-association-supercollector", "2023-06-21", "BD-087"],
      ["bd-chronicles-ep-supercollector", "2023-06-30", "BD-088"],
      ["bd-stay-gold-supercollector", "2023-06-30", "BD-089"],
      ["bd-unrequited-ep-supercollector", "2023-06-30", "BD-090"],
      ["bd-ss23-supercollector", "2023-10-11", "BD-093"],
      ["bd-aspiring-gundam-pilot-supercollector", "2024-08-22", "BD-096"],
      [
        "bd-that-time-abandoned-mech-supercollector",
        "2025-10-20",
        "BD-099",
      ],
    ],
  );

  const evaKids = getWorkById("bd-dressed-up-eva-kids");
  const bullshit = getWorkById("bd-back-on-my-bullshit");
  assert.equal(evaKids?.catalogNumber, "BD-001");
  assert.equal(bullshit?.catalogNumber, "BD-092");
});

test("Catalog platform works stay resolved on Zora and RECORD", () => {
  const expected = [
    ["bd-sharp", CATALOG_ZORA, "6063"],
    ["bd-middle-men-feat-monday-rome-fortune", CATALOG_ZORA, "8141"],
    ["bd-band-of-the-hawk-w-monday", CATALOG_ZORA, "10002"],
    ["bd-red-eye-w-monday", CATALOG_ZORA, "10003"],
    ["bd-sajin-w-monday", CATALOG_ZORA, "10004"],
    ["bd-newtype-poetry", CATALOG_RECORD, "825"],
    ["bd-back-on-my-bullshit", CATALOG_RECORD, "892"],
  ] as const;

  for (const [id, contract, tokenId] of expected) {
    const work = getWorkById(id);
    assert.equal(work?.resolved, true, id);
    assert.equal(work?.chain, "ethereum", id);
    assert.equal(work?.contract, contract, id);
    assert.equal(work?.tokenId, tokenId, id);
    assert.equal(
      matchHeldWork({ contract, tokenId })?.id,
      id,
      `${id} matchHeldWork`,
    );
  }
});

test("Sound artist contract maps any serial in an edition to that song", () => {
  assert.equal(catalogTokenStandard(SOUND_ARTIST), "erc721");
  assert.equal(isSoundArtistContract(SOUND_ARTIST), true);
  assert.equal(soundEditionId("1"), 1);
  assert.equal(soundEditionId("25"), 1);
  assert.equal(soundEditionId(soundTokenId(2, 50)), 2);
  assert.equal(soundEditionId(soundTokenId(3, 32)), 3);
  assert.equal(soundTokenIdsForEdition(1).length, 25);
  assert.equal(soundTokenIdsForEdition(2).length, 50);
  assert.equal(soundTokenIdsForEdition(3).length, 35);

  assert.equal(
    matchHeldWork({ contract: SOUND_ARTIST, tokenId: "7" })?.id,
    "bd-triple-beam",
  );
  assert.equal(
    matchHeldWork({ contract: SOUND_ARTIST, tokenId: soundTokenId(2, 50) })?.id,
    "bd-what-the-fuck",
  );
  assert.equal(
    matchHeldWork({ contract: SOUND_ARTIST, tokenId: soundTokenId(3, 1) })?.id,
    "bd-soundxyz-w-titandemonbane",
  );
});

test("Mint Songs token 36 stays Want My Head", () => {
  const work = getWorkById("bd-want-my-head");
  assert.equal(work?.resolved, true);
  assert.equal(work?.contract, MINT_SONGS);
  assert.equal(work?.tokenId, "36");
  assert.equal(
    matchHeldWork({ contract: MINT_SONGS, tokenId: "36" })?.id,
    "bd-want-my-head",
  );
});

test("Calm Down and 2years Coda match any serial on their dedicated contracts", () => {
  assert.equal(catalogTokenStandard(CALM_DOWN), "erc721");
  assert.equal(catalogTokenStandard(TWO_YEARS_CODA), "erc721");
  assert.equal(isContractScopedHoldings(CALM_DOWN), true);
  assert.equal(isContractScopedHoldings(TWO_YEARS_CODA), true);
  assert.deepEqual(sequentialTokenIds(0, 3), ["0", "1", "2"]);
  assert.equal(sequentialErc721TokenIds(CALM_DOWN).length, 135);
  assert.equal(sequentialErc721TokenIds(CALM_DOWN)[0], "1");
  assert.equal(sequentialErc721TokenIds(CALM_DOWN)[134], "135");
  assert.equal(sequentialErc721TokenIds(TWO_YEARS_CODA).length, 46);
  assert.equal(sequentialErc721TokenIds(TWO_YEARS_CODA)[0], "0");
  assert.equal(sequentialErc721TokenIds(TWO_YEARS_CODA)[45], "45");

  const calm = getWorkById("bd-calm-down");
  assert.equal(calm?.resolved, true);
  assert.equal(calm?.contract, CALM_DOWN);
  assert.equal(matchHeldWork({ contract: CALM_DOWN, tokenId: "1" })?.id, "bd-calm-down");
  assert.equal(matchHeldWork({ contract: CALM_DOWN, tokenId: "135" })?.id, "bd-calm-down");

  const coda = getWorkById("bd-black-dave-black-comet-coda");
  assert.equal(coda?.resolved, true);
  assert.equal(coda?.contract, TWO_YEARS_CODA);
  assert.equal(
    matchHeldWork({ contract: TWO_YEARS_CODA, tokenId: "0" })?.id,
    "bd-black-dave-black-comet-coda",
  );
  assert.equal(
    matchHeldWork({ contract: TWO_YEARS_CODA, tokenId: "45" })?.id,
    "bd-black-dave-black-comet-coda",
  );
});

test("Foundation Manga Tears 023 and Unique One Manga Tears 021 stay resolved", () => {
  const tears23 = getWorkById("bd-manga-tears-023");
  assert.equal(tears23?.resolved, true);
  assert.equal(tears23?.contract, FOUNDATION);
  assert.equal(tears23?.tokenId, "28958");
  assert.equal(
    matchHeldWork({ contract: FOUNDATION, tokenId: "28958" })?.id,
    "bd-manga-tears-023",
  );

  const silent = getWorkById("bd-a-silent-conversation");
  assert.equal(silent?.resolved, true);
  assert.equal(silent?.contract, FOUNDATION);
  assert.equal(silent?.tokenId, "89599");
  assert.equal(
    matchHeldWork({ contract: FOUNDATION, tokenId: "89599" })?.id,
    "bd-a-silent-conversation",
  );

  const tears21 = getWorkById("bd-manga-tears-021");
  assert.equal(tears21?.resolved, true);
  assert.equal(tears21?.contract, UNIQUE_ONE);
  assert.equal(tears21?.tokenId, "1739");
  assert.equal(
    matchHeldWork({ contract: UNIQUE_ONE, tokenId: "1739" })?.id,
    "bd-manga-tears-021",
  );
  assert.equal(
    matchHeldWork({ contract: UNIQUE_ONE, tokenId: "1740" })?.id,
    "bd-manga-tears-021",
  );
  assert.equal(matchHeldWork({ contract: UNIQUE_ONE, tokenId: "1737" }), undefined);
});

test("Manifold Oh Yes is tokens 2-13 and ignores 1BLKPXL token 1", () => {
  const work = getWorkById("bd-oh-yes");
  assert.equal(work?.resolved, true);
  assert.equal(work?.contract, OH_YES);
  assert.equal(work?.tokenId, "2");
  assert.equal(isContractScopedHoldings(OH_YES), false);
  assert.equal(matchHeldWork({ contract: OH_YES, tokenId: "2" })?.id, "bd-oh-yes");
  assert.equal(matchHeldWork({ contract: OH_YES, tokenId: "13" })?.id, "bd-oh-yes");
  assert.equal(matchHeldWork({ contract: OH_YES, tokenId: "1" }), undefined);
  assert.equal(matchHeldWork({ contract: OH_YES, tokenId: "14" }), undefined);
});

test("Yards on Base is ERC-1155 and matches any token on the contract", () => {
  assert.equal(catalogTokenStandard(YARDS), "erc1155");
  assert.equal(isContractScopedHoldings(YARDS), true);
  assert.equal(sequentialErc1155TokenIds(YARDS).length, 128);
  assert.equal(sequentialErc1155TokenIds(YARDS)[0], "1");
  assert.equal(sequentialErc1155TokenIds(YARDS)[127], "128");

  const work = getWorkById("bd-yards");
  assert.equal(work?.resolved, true);
  assert.equal(work?.chain, "base");
  assert.equal(work?.contract, YARDS);
  assert.equal(work?.mintDate, "2024-11-06");
  assert.equal(work?.catalogNumber, "BD-098");
  assert.equal(matchHeldWork({ contract: YARDS, tokenId: "1" })?.id, "bd-yards");
  assert.equal(matchHeldWork({ contract: YARDS, tokenId: "79" })?.id, "bd-yards");
});

test("3% c/o Black Dave on Base is a dedicated ERC-721 and matches any claimed token", () => {
  assert.equal(catalogTokenStandard(THREE_PERCENT), "erc721");
  assert.equal(isContractScopedHoldings(THREE_PERCENT), true);
  assert.equal(sequentialErc721TokenIds(THREE_PERCENT).length, 235);
  assert.equal(sequentialErc721TokenIds(THREE_PERCENT)[0], "0");
  assert.equal(sequentialErc721TokenIds(THREE_PERCENT)[234], "234");

  const work = getWorkById("bd-3-percent-c-o-black-dave");
  assert.equal(work?.resolved, true);
  assert.equal(work?.title, "3% c/o Black Dave");
  assert.equal(work?.collection, "3% c/o Black Dave");
  assert.equal(work?.platform, "thirdweb");
  assert.equal(work?.chain, "base");
  assert.equal(work?.contract, THREE_PERCENT);
  assert.equal(work?.tokenId, "0");
  assert.equal(work?.mintDate, "2024-10-15");
  assert.equal(work?.catalogNumber, "BD-097");
  assert.equal(
    matchHeldWork({ contract: THREE_PERCENT, tokenId: "0" })?.id,
    "bd-3-percent-c-o-black-dave",
  );
  assert.equal(
    matchHeldWork({ contract: THREE_PERCENT, tokenId: "234" })?.id,
    "bd-3-percent-c-o-black-dave",
  );
  assert.notEqual(
    matchHeldWork({ contract: THREE_PERCENT, tokenId: "0" })?.id,
    "bd-yards",
  );
  assert.notEqual(
    matchHeldWork({ contract: THREE_PERCENT, tokenId: "0" })?.id,
    "bd-black-daves-item-box",
  );
});

test("Black Dave's Item Box on Base is one ERC-1155 work for any token 1-11", () => {
  assert.equal(catalogTokenStandard(ITEM_BOX), "erc1155");
  assert.equal(isContractScopedHoldings(ITEM_BOX), true);
  assert.equal(sequentialErc1155TokenIds(ITEM_BOX).length, 11);
  assert.equal(sequentialErc1155TokenIds(ITEM_BOX)[0], "1");
  assert.equal(sequentialErc1155TokenIds(ITEM_BOX)[10], "11");

  const work = getWorkById("bd-black-daves-item-box");
  assert.equal(work?.resolved, true);
  assert.equal(work?.title, "Black Dave's Item Box");
  assert.equal(work?.collection, "Black Dave's Item Box");
  assert.equal(work?.platform, "Zora");
  assert.equal(work?.chain, "base");
  assert.equal(work?.contract, ITEM_BOX);
  assert.equal(work?.mintDate, "2024-06-23");
  assert.equal(work?.catalogNumber, "BD-095");
  assert.equal(
    matchHeldWork({ contract: ITEM_BOX, tokenId: "1" })?.id,
    "bd-black-daves-item-box",
  );
  assert.equal(
    matchHeldWork({ contract: ITEM_BOX, tokenId: "7" })?.id,
    "bd-black-daves-item-box",
  );
  assert.equal(
    matchHeldWork({ contract: ITEM_BOX, tokenId: "11" })?.id,
    "bd-black-daves-item-box",
  );
  assert.notEqual(
    matchHeldWork({ contract: ITEM_BOX, tokenId: "1" })?.id,
    "bd-yards",
  );
});

test("I Have Ideas/No Idea on Optimism is a dedicated Sound ERC-721 and not Supercollector", () => {
  assert.equal(catalogTokenStandard(I_HAVE_IDEAS), "erc721");
  assert.equal(isContractScopedHoldings(I_HAVE_IDEAS), true);
  assert.equal(isSupercollectorContract(I_HAVE_IDEAS), false);
  assert.equal(sequentialErc721TokenIds(I_HAVE_IDEAS).length, 230);
  assert.equal(sequentialErc721TokenIds(I_HAVE_IDEAS)[0], "1");
  assert.equal(sequentialErc721TokenIds(I_HAVE_IDEAS)[229], "230");

  const work = getWorkById("bd-i-have-ideas-no-idea");
  assert.equal(work?.resolved, true);
  assert.equal(work?.title, "I Have Ideas/No Idea");
  assert.equal(work?.collection, "Sound");
  assert.equal(work?.platform, "Sound.xyz");
  assert.equal(work?.chain, "optimism");
  assert.equal(work?.contract, I_HAVE_IDEAS);
  assert.equal(work?.tokenId, "1");
  assert.equal(work?.mintDate, "2023-12-15");
  assert.equal(work?.catalogNumber, "BD-094");
  assert.equal(
    matchHeldWork({ contract: I_HAVE_IDEAS, tokenId: "1" })?.id,
    "bd-i-have-ideas-no-idea",
  );
  assert.equal(
    matchHeldWork({ contract: I_HAVE_IDEAS, tokenId: "180" })?.id,
    "bd-i-have-ideas-no-idea",
  );
  assert.equal(
    matchHeldWork({ contract: I_HAVE_IDEAS, tokenId: "230" })?.id,
    "bd-i-have-ideas-no-idea",
  );
  assert.notEqual(
    matchHeldWork({ contract: I_HAVE_IDEAS, tokenId: "1" })?.id,
    "bd-ss23-supercollector",
  );
  assert.notEqual(
    matchHeldWork({ contract: I_HAVE_IDEAS, tokenId: "1" })?.collection,
    "Supercollector",
  );
});

test("dedicated Ethereum Sound editions match any serial on their own contracts", () => {
  const songs = [
    {
      id: "bd-bag",
      contract: BAG,
      last: "29",
      title: "Bag",
      catalogNumber: "BD-080",
      availability: "Sold Out",
    },
    {
      id: "bd-me-too",
      contract: ME_TOO,
      last: "12",
      title: "Me Too",
      catalogNumber: "BD-081",
      availability: "Sold Out",
    },
    {
      id: "bd-i-love-this-shit",
      contract: I_LOVE_THIS_SHIT,
      last: "49",
      title: "I Love This Shit",
      catalogNumber: "BD-084",
      availability: "Always On",
    },
    {
      id: "bd-advice",
      contract: ADVICE,
      last: "6",
      title: "Advice",
      catalogNumber: "BD-085",
      availability: "Unsold",
    },
    {
      id: "bd-lavender",
      contract: LAVENDER,
      last: "10",
      title: "Lavender",
      catalogNumber: "BD-091",
      availability: "Unsold",
    },
    {
      id: "bd-feel-good",
      contract: FEEL_GOOD,
      last: "25",
      title: "Feel Good",
      catalogNumber: "BD-082",
      availability: "Sold Out",
    },
  ] as const;

  for (const song of songs) {
    assert.equal(catalogTokenStandard(song.contract), "erc721", song.id);
    assert.equal(isContractScopedHoldings(song.contract), true, song.id);
    assert.equal(isSoundArtistContract(song.contract), false, song.id);
    const ids = sequentialErc721TokenIds(song.contract);
    assert.equal(ids[0], "1", song.id);
    assert.equal(ids[ids.length - 1], song.last, song.id);

    const work = getWorkById(song.id);
    assert.equal(work?.resolved, true, song.id);
    assert.equal(work?.title, song.title, song.id);
    assert.equal(work?.collection, "Sound", song.id);
    assert.equal(work?.platform, "Sound.xyz", song.id);
    assert.equal(work?.chain, "ethereum", song.id);
    assert.equal(work?.contract, song.contract, song.id);
    assert.equal(work?.tokenId, "1", song.id);
    assert.equal(work?.catalogNumber, song.catalogNumber, song.id);
    assert.equal(work?.availability, song.availability, song.id);
    assert.equal(
      matchHeldWork({ contract: song.contract, tokenId: "1" })?.id,
      song.id,
    );
    assert.equal(
      matchHeldWork({ contract: song.contract, tokenId: song.last })?.id,
      song.id,
    );
    assert.notEqual(
      matchHeldWork({ contract: song.contract, tokenId: "1" })?.id,
      "bd-triple-beam",
    );
  }

  assert.equal(getWorkById("bd-manga-tears-022")?.resolved, false);
  assert.equal(
    matchHeldWork({ contract: SOUND_ARTIST, tokenId: "1" })?.id,
    "bd-triple-beam",
  );
});

test("Glass wavROOM is a dedicated Hyperlink ERC-721 and matches any edition", () => {
  assert.equal(catalogTokenStandard(WAVROOM), "erc721");
  assert.equal(isContractScopedHoldings(WAVROOM), true);
  assert.equal(sequentialErc721TokenIds(WAVROOM).length, 20);
  assert.equal(sequentialErc721TokenIds(WAVROOM)[0], "1");
  assert.equal(sequentialErc721TokenIds(WAVROOM)[19], "20");

  const work = getWorkById("bd-wavroom-feat-black-dave");
  assert.equal(work?.resolved, true);
  assert.equal(work?.chain, "ethereum");
  assert.equal(work?.contract, WAVROOM);
  assert.equal(work?.tokenId, "1");
  assert.equal(work?.mintDate, "2022-08-18");
  assert.equal(work?.catalogNumber, "BD-078");
  assert.equal(work?.availability, "Unsold");
  assert.equal(
    matchHeldWork({ contract: WAVROOM, tokenId: "1" })?.id,
    "bd-wavroom-feat-black-dave",
  );
  assert.equal(
    matchHeldWork({ contract: WAVROOM, tokenId: "14" })?.id,
    "bd-wavroom-feat-black-dave",
  );
});

test("Mint Songs Factory Wolf EP 1/1s resolve on Polygon", () => {
  const expected = [
    ["bd-wolf", "47618"],
    ["bd-i-m-in-love-with-you", "47619"],
    ["bd-small-streams-strong-rivers", "47620"],
  ] as const;
  for (const [id, tokenId] of expected) {
    const work = getWorkById(id);
    assert.equal(work?.resolved, true, id);
    assert.equal(work?.chain, "polygon", id);
    assert.equal(work?.contract, MINT_SONGS_FACTORY, id);
    assert.equal(work?.tokenId, tokenId, id);
    assert.equal(
      matchHeldWork({ contract: MINT_SONGS_FACTORY, tokenId })?.id,
      id,
      id,
    );
  }
  assert.equal(
    matchHeldWork({ contract: MINT_SONGS_FACTORY, tokenId: "47617" }),
    undefined,
  );
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
