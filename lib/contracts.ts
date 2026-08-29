export const CREATOR =
  "0xed22bb0106c24c7f6b4d8aae33639e1467061f64" as const;

export const OPENSEA_SHARED =
  "0x495f947276749ce646f68ac8c248420045cb7b5e" as const;

export const MINT_SONGS =
  "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584" as const;

export const RARIBLE_1155 =
  "0x60f80121c31a0d46b5279700f9df786054aa5ee5" as const;

export const RARIBLE_721 =
  "0xd07dc4262bcdbf85190c01c996b4c06a461d2430" as const;

export const MANGA_QUOTES =
  "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba" as const;

export const BLACK_DAVE_TOKEN =
  "0xafd17cb86d7cd086fc720365e873469ebcb103da" as const;

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
] as const;

export const POLYGON_CONTRACTS = [MANGA_QUOTES] as const;
