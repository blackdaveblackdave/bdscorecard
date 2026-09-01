export const CREATOR =
  "0xed22bb0106c24c7f6b4d8aae33639e1467061f64" as const;

export const OPENSEA_SHARED =
  "0x495f947276749ce646f68ac8c248420045cb7b5e" as const;

export const MINT_SONGS =
  "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584" as const;

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

const SUPERCOLLECTOR_SET = new Set<string>(SUPERCOLLECTOR_CONTRACTS);
const CONTRACT_SCOPED_HOLDINGS = new Set<string>([
  BLACK_DAVE_TOKEN,
  ...SUPERCOLLECTOR_CONTRACTS,
]);

export function isSupercollectorContract(contract: string): boolean {
  return SUPERCOLLECTOR_SET.has(contract.toLowerCase());
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
];

export const ETHEREUM_CONTRACTS = [
  OPENSEA_SHARED,
  MINT_SONGS,
  RARIBLE_1155,
  RARIBLE_721,
  BLACK_DAVE_TOKEN,
  CATALOG_ZORA,
  CATALOG_RECORD,
] as const;

export const POLYGON_CONTRACTS = [MANGA_QUOTES] as const;

export const OPTIMISM_CONTRACTS = SUPERCOLLECTOR_CONTRACTS;
