export type ChainName = "ethereum" | "polygon" | "optimism";

export type Availability = "Sold Out" | "Unsold" | "Always On" | "";

export type Work = {
  id: string;
  catalogNumber: string;
  title: string;
  collection: string;
  platform: string;
  medium: string[];
  editions: number | null;
  priceEth: number | null;
  mintDate: string;
  availability: Availability;
  artwork: string;
  externalUrl: string;
  chain: ChainName | null;
  contract: string | null;
  tokenId: string | null;
  resolved: boolean;
};

export type Address = string & { readonly __brand: "Address" };

export type HeldWork =
  | { kind: "catalogued"; work: Work }
  | { kind: "uncatalogued"; tokenId: string; contract: string; chain: ChainName };

export type Holdings = {
  address: Address;
  held: HeldWork[];
};

export type TierName =
  | "Visitor"
  | "Listed"
  | "Collector"
  | "Archivist"
  | "Custodian";

export type ScoreResult = {
  score: number;
  tier: TierName;
  breadth: number;
  depth: number;
  mediumBonus: number;
  eraBonus: number;
  heldCount: number;
  collectionCount: number;
};

export type HoldingsState =
  | { kind: "idle" }
  | { kind: "loading"; address: Address }
  | { kind: "ready"; holdings: Holdings; score: ScoreResult }
  | { kind: "error"; message: string };
