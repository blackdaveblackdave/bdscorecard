export const CREATOR =
  "0xed22bb0106c24c7f6b4d8aae33639e1467061f64" as const;

export const OPENSEA_SHARED =
  "0x495f947276749ce646f68ac8c248420045cb7b5e" as const;

export const MINT_SONGS =
  "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584" as const;

/** Mint Songs Factory shared ERC-721 on Polygon. */
export const MINT_SONGS_FACTORY =
  "0xc29cbe04ae322469dc077741afa2fbccda748ae4" as const;

/** Rarible ERC-721. PRD labeled this ERC-1155. */
export const RARIBLE_1155 =
  "0x60f80121c31a0d46b5279700f9df786054aa5ee5" as const;

/** Rarible ERC-1155. PRD labeled this ERC-721. */
export const RARIBLE_721 =
  "0xd07dc4262bcdbf85190c01c996b4c06a461d2430" as const;

export const MANGA_QUOTES =
  "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba" as const;

export const BLACK_DAVE_TOKEN =
  "0xafd17cb86d7cd086fc720365e873469ebcb103da" as const;

/** Legacy Catalog mints on Zora (pre-RECORD). */
export const CATALOG_ZORA =
  "0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7" as const;

/** Catalog shared ERC-721 (RECORD). */
export const CATALOG_RECORD =
  "0x0bc2a24ce568dad89691116d5b34deb6c203f342" as const;

/** Sound.xyz Artist BeaconProxy (BLKDSND). Three editions, then Sound moved to per-song contracts. */
export const SOUND_ARTIST =
  "0xab80184b3bba02e975b6494d570232fb6c6973f1" as const;

/** Zora ERC721Drop. Always On song Calm Down (135, token ids 1–135). */
export const CALM_DOWN =
  "0x1a5d314beed6e39fd152cf54d3671ad33fdccf9a" as const;

/** Decent DCNT721A. 2years commemorative drop Black Dave Black Comet Coda (46, token ids 0–45). */
export const TWO_YEARS_CODA =
  "0x4c537c0ec793632a4feaaffc200e35a67a983904" as const;

/** Foundation shared ERC-721 (FNDNFT721). */
export const FOUNDATION =
  "0x3b3ee1931dc30c1957379fac9aba94d1c48a5405" as const;

/** Unique One shared ERC-721. */
export const UNIQUE_ONE =
  "0x0f864e29b01a72247b6795cc6054afeb53ef35ef" as const;

/** Dedicated Cargo Super 721 on Polygon. Manga Tears 022, token 1. */
export const MANGA_TEARS_022 =
  "0x0e9e8d517878a1ff9425ee12762ab183e07aacc2" as const;

/** Manifold Creator ERC-721 (BLKD). Oh Yes is tokens 2–13; token 1 is 1BLKPXL. */
export const OH_YES =
  "0x446671f87ff72109ed1496740c90a9ceed767d70" as const;

/** Dedicated Zora ERC-1155 on Base for the Yards video series. */
export const YARDS =
  "0xcabcfb8cfe1c94304bfa4ac56f778c7c7e080b55" as const;

/** Zora ERC-1155 on Base. Black Dave's Item Box — random NFTs, tokens 1–11. */
export const ITEM_BOX =
  "0x1491ea485e78cdbe895293cbaeb2b707012197b9" as const;

/** Dedicated thirdweb DropERC721 on Base. 3% c/o Black Dave — 333 lazy-minted, tokens 0–234 claimed. */
export const THREE_PERCENT =
  "0xd410d5cbf64a2ee4c777a3ea85da58dbd634ab13" as const;

/** Dedicated SoundEditionV2 ERC-721 on Optimism. I Have Ideas/No Idea — 230 minted of 300, tokens 1–230. */
export const I_HAVE_IDEAS =
  "0xc0f82fca66ca1de005e7ce869c233ccde7c0bcde" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. Bag — 29 minted, tokens 1–29. */
export const BAG =
  "0xd03902b4f1c11eb3f6746d09be98a028ba4df10f" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. Me Too — 12 minted, tokens 1–12. */
export const ME_TOO =
  "0x9bdeab2090cab7f462d0c949acad9103bf21b0eb" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. I Love This Shit — 49 minted, tokens 1–49. */
export const I_LOVE_THIS_SHIT =
  "0xa6505645a37d7d5f67cfde8501a7fead292a3cff" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. Advice — 6 minted of 33, tokens 1–6. */
export const ADVICE =
  "0x5fe9730db5c72f0130d26054bfff21f1ee9405a7" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. Lavender — 10 minted of 100, tokens 1–10. */
export const LAVENDER =
  "0x2cd86e0aaa2d195ac4c0d18a3adabaf5c3144e3d" as const;

/** Dedicated SoundEdition ERC-721 on Ethereum. Feel Good (NOISEDAO) — 25 minted, tokens 1–25. */
export const FEEL_GOOD =
  "0x5324972755cb8c04ea227c5b7c430ced424f7e39" as const;

/** Dedicated Glass Hyperlink ERC-721. wavROOM feat. Black Dave (20 editions, ids 1–20). */
export const WAVROOM =
  "0xadf5d2ae8a86ba35ba346444b368413e5e7a8fc3" as const;

export const SOUND_EDITION_QUANTITY: Readonly<Record<number, number>> = {
  1: 25,
  2: 50,
  3: 35,
};

/** Fractional ownership token for Sharp (PartyBid / Fractional vault). */
export const SHRP_TOKEN =
  "0x4b7845f1f6e7046c3e1bf050a629ee8d59eb437f" as const;

/** Supercollector / Decent DCNTSeries releases on Optimism. */
export const SUPERCOLLECTOR_CHRONICLES =
  "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069" as const;
export const SUPERCOLLECTOR_STAY_GOLD =
  "0x97312325fda573f8ba5cb4160130631d0d823892" as const;
export const SUPERCOLLECTOR_UNREQUITED =
  "0x7cb50113f54d12ca5146e57b193d7a6c53722060" as const;
export const SUPERCOLLECTOR_WORD_ASSOCIATION =
  "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba" as const;
export const SUPERCOLLECTOR_SS23 =
  "0xedd6b208c35281554caa71b44f7f3842295b07ab" as const;
export const SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT =
  "0x761fc1fa3935c9f8166147e2fe428ef54943b853" as const;
export const SUPERCOLLECTOR_ABANDONED_MECH =
  "0x371aa2d25d138b99e1f30bc2a4852f9fa7882c2f" as const;

export const SUPERCOLLECTOR_CONTRACTS = [
  SUPERCOLLECTOR_CHRONICLES,
  SUPERCOLLECTOR_STAY_GOLD,
  SUPERCOLLECTOR_UNREQUITED,
  SUPERCOLLECTOR_WORD_ASSOCIATION,
  SUPERCOLLECTOR_SS23,
  SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
  SUPERCOLLECTOR_ABANDONED_MECH,
] as const;

export const SEQUENTIAL_ERC721: Readonly<
  Record<string, { start: number; quantity: number }>
> = {
  [CALM_DOWN]: { start: 1, quantity: 135 },
  [TWO_YEARS_CODA]: { start: 0, quantity: 46 },
  [WAVROOM]: { start: 1, quantity: 20 },
  [THREE_PERCENT]: { start: 0, quantity: 235 },
  [I_HAVE_IDEAS]: { start: 1, quantity: 230 },
  [BAG]: { start: 1, quantity: 29 },
  [ME_TOO]: { start: 1, quantity: 12 },
  [I_LOVE_THIS_SHIT]: { start: 1, quantity: 49 },
  [ADVICE]: { start: 1, quantity: 6 },
  [LAVENDER]: { start: 1, quantity: 10 },
  [FEEL_GOOD]: { start: 1, quantity: 25 },
};

/** Sequential ERC-1155 ids on a dedicated series contract. */
export const SEQUENTIAL_ERC1155: Readonly<
  Record<string, { start: number; quantity: number }>
> = {
  [YARDS]: { start: 1, quantity: 128 },
  [ITEM_BOX]: { start: 1, quantity: 11 },
};

const SUPERCOLLECTOR_SET = new Set<string>(SUPERCOLLECTOR_CONTRACTS);
const CONTRACT_SCOPED_HOLDINGS = new Set<string>([
  BLACK_DAVE_TOKEN,
  CALM_DOWN,
  TWO_YEARS_CODA,
  YARDS,
  ITEM_BOX,
  WAVROOM,
  THREE_PERCENT,
  I_HAVE_IDEAS,
  BAG,
  ME_TOO,
  I_LOVE_THIS_SHIT,
  ADVICE,
  LAVENDER,
  FEEL_GOOD,
  ...SUPERCOLLECTOR_CONTRACTS,
]);

export function isSupercollectorContract(contract: string): boolean {
  return SUPERCOLLECTOR_SET.has(contract.toLowerCase());
}

export function isSoundArtistContract(contract: string): boolean {
  return contract.toLowerCase() === SOUND_ARTIST;
}

export function soundEditionId(tokenId: string | bigint): number | null {
  let id: bigint;
  try {
    id = BigInt(tokenId);
  } catch {
    return null;
  }
  const hi = id >> 128n;
  if (hi === 0n) return 1;
  if (hi > 0n && hi <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(hi);
  return null;
}

export function soundTokenId(editionId: number, serial: number): string {
  if (editionId === 1) return String(serial);
  return ((BigInt(editionId) << 128n) + BigInt(serial)).toString();
}

export function soundTokenIdsForEdition(editionId: number): string[] {
  const quantity = SOUND_EDITION_QUANTITY[editionId];
  if (!quantity) return [];
  const ids: string[] = [];
  for (let serial = 1; serial <= quantity; serial++) {
    ids.push(soundTokenId(editionId, serial));
  }
  return ids;
}

export function sequentialTokenIds(start: number, quantity: number): string[] {
  if (quantity <= 0) return [];
  const ids: string[] = [];
  for (let i = 0; i < quantity; i++) {
    ids.push(String(start + i));
  }
  return ids;
}

export function sequentialErc721TokenIds(contract: string): string[] {
  const range = SEQUENTIAL_ERC721[contract.toLowerCase()];
  if (!range) return [];
  return sequentialTokenIds(range.start, range.quantity);
}

export function sequentialErc1155TokenIds(contract: string): string[] {
  const range = SEQUENTIAL_ERC1155[contract.toLowerCase()];
  if (!range) return [];
  return sequentialTokenIds(range.start, range.quantity);
}

/** Shared-contract token ids that all count as the same catalog work. */
export const TOKEN_ID_ALIASES: ReadonlyArray<{
  contract: string;
  tokenIds: readonly string[];
}> = [{ contract: UNIQUE_ONE, tokenIds: ["1739", "1740"] }];

/** Inclusive start + count on a shared creator contract. */
export const TOKEN_ID_RANGES: ReadonlyArray<{
  contract: string;
  start: number;
  quantity: number;
}> = [{ contract: OH_YES, start: 2, quantity: 12 }];

export function aliasedTokenIds(contract: string, tokenId: string): string[] {
  const addr = contract.toLowerCase();
  for (const row of TOKEN_ID_ALIASES) {
    if (row.contract === addr && row.tokenIds.includes(tokenId)) {
      return [...row.tokenIds];
    }
  }
  for (const row of TOKEN_ID_RANGES) {
    if (row.contract !== addr) continue;
    let id: number;
    try {
      id = Number(BigInt(tokenId));
    } catch {
      continue;
    }
    if (id >= row.start && id < row.start + row.quantity) {
      return sequentialTokenIds(row.start, row.quantity);
    }
  }
  return [tokenId];
}

/** Any token on these contracts counts as the catalog work. */
export function isContractScopedHoldings(contract: string): boolean {
  return CONTRACT_SCOPED_HOLDINGS.has(contract.toLowerCase());
}

export const FRACTIONAL_HOLDINGS: ReadonlyArray<{
  workId: string;
  token: string;
  chain: "ethereum";
}> = [{ workId: "bd-sharp", token: SHRP_TOKEN, chain: "ethereum" }];

export const TOKEN_ALLOWLIST: ReadonlyArray<{
  contract: string;
  tokenId: string;
}> = [
  { contract: MINT_SONGS, tokenId: "36" },
  { contract: RARIBLE_1155, tokenId: "1013003" },
  { contract: RARIBLE_721, tokenId: "101845" },
  { contract: MANGA_QUOTES, tokenId: "1" },
  { contract: FOUNDATION, tokenId: "28958" },
  { contract: FOUNDATION, tokenId: "89599" },
  { contract: UNIQUE_ONE, tokenId: "1739" },
  { contract: UNIQUE_ONE, tokenId: "1740" },
  { contract: MANGA_TEARS_022, tokenId: "1" },
  { contract: MINT_SONGS_FACTORY, tokenId: "47618" },
  { contract: MINT_SONGS_FACTORY, tokenId: "47619" },
  { contract: MINT_SONGS_FACTORY, tokenId: "47620" },
];

export const ETHEREUM_CONTRACTS = [
  OPENSEA_SHARED,
  MINT_SONGS,
  RARIBLE_1155,
  RARIBLE_721,
  BLACK_DAVE_TOKEN,
  CATALOG_ZORA,
  CATALOG_RECORD,
  SOUND_ARTIST,
  CALM_DOWN,
  TWO_YEARS_CODA,
  FOUNDATION,
  UNIQUE_ONE,
  OH_YES,
  WAVROOM,
  BAG,
  ME_TOO,
  I_LOVE_THIS_SHIT,
  ADVICE,
  LAVENDER,
  FEEL_GOOD,
] as const;

export const POLYGON_CONTRACTS = [
  MANGA_QUOTES,
  MINT_SONGS_FACTORY,
  MANGA_TEARS_022,
] as const;

export const OPTIMISM_CONTRACTS = [
  ...SUPERCOLLECTOR_CONTRACTS,
  I_HAVE_IDEAS,
] as const;

export const BASE_CONTRACTS = [YARDS, ITEM_BOX, THREE_PERCENT] as const;
