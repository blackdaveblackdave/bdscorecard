import { getAddress, isAddress } from "viem";
import { normalize } from "viem/ens";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import {
  BLACK_DAVE_TOKEN,
  ETHEREUM_CONTRACTS,
  OPENSEA_SHARED,
  POLYGON_CONTRACTS,
  TOKEN_ALLOWLIST,
} from "./contracts";
import { matchHeldWork } from "./catalog";
import { isBlackDaveOpenSeaToken } from "./opensea-tokens";
import type { Address, ChainName, HeldWork, Holdings, Work } from "./types";

const allowlist = new Set(
  TOKEN_ALLOWLIST.map((row) => `${row.contract}:${row.tokenId}`),
);

export function parseAddress(input: string): Address | null {
  if (!isAddress(input)) return null;
  return getAddress(input) as Address;
}

type AlchemyNft = {
  contract?: { address?: string };
  tokenId?: string;
};

type AlchemyPage = {
  ownedNfts?: AlchemyNft[];
  pageKey?: string;
};

function alchemyNetwork(chain: ChainName): string {
  return chain === "polygon" ? "polygon-mainnet" : "eth-mainnet";
}

function tokenAllowed(contract: string, tokenId: string): boolean {
  const key = `${contract}:${tokenId}`;
  if (contract === OPENSEA_SHARED) {
    return isBlackDaveOpenSeaToken(tokenId);
  }
  if (contract === BLACK_DAVE_TOKEN) {
    return true;
  }
  return allowlist.has(key);
}

function toHeldWork(opts: {
  contract: string;
  tokenId: string;
  chain: ChainName;
}): HeldWork {
  const catalogued = matchHeldWork({
    contract: opts.contract,
    tokenId: opts.tokenId,
  });
  if (catalogued) {
    return { kind: "catalogued", work: catalogued };
  }
  return {
    kind: "uncatalogued",
    tokenId: opts.tokenId,
    contract: opts.contract,
    chain: opts.chain,
  };
}

async function alchemyHoldings(opts: {
  address: Address;
  chain: ChainName;
  contracts: readonly string[];
  apiKey: string;
}): Promise<HeldWork[]> {
  const held: HeldWork[] = [];
  let pageKey: string | undefined;
  const base = `https://${alchemyNetwork(opts.chain)}.g.alchemy.com/nft/v3/${opts.apiKey}/getNFTsForOwner`;

  do {
    const url = new URL(base);
    url.searchParams.set("owner", opts.address);
    url.searchParams.set("withMetadata", "false");
    url.searchParams.set("pageSize", "100");
    for (const contract of opts.contracts) {
      url.searchParams.append("contractAddresses[]", contract);
    }
    if (pageKey) url.searchParams.set("pageKey", pageKey);

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Alchemy ${opts.chain} ${res.status}`);
    }
    const body = (await res.json()) as AlchemyPage;
    for (const nft of body.ownedNfts ?? []) {
      const contract = nft.contract?.address?.toLowerCase();
      const tokenId = nft.tokenId ? BigInt(nft.tokenId).toString() : "";
      if (!contract || !tokenId) continue;
      if (!tokenAllowed(contract, tokenId)) continue;
      held.push(toHeldWork({ contract, tokenId, chain: opts.chain }));
    }
    pageKey = body.pageKey;
  } while (pageKey);

  return held;
}

type EtherscanRow = {
  TokenAddress?: string;
  tokenAddress?: string;
  TokenId?: string;
  tokenId?: string;
};

async function etherscanHoldings(opts: {
  address: Address;
  chain: ChainName;
  contracts: readonly string[];
  apiKey: string;
}): Promise<HeldWork[]> {
  const chainId = opts.chain === "polygon" ? 137 : 1;
  const held: HeldWork[] = [];

  for (const contract of opts.contracts) {
    const url = new URL("https://api.etherscan.io/v2/api");
    url.searchParams.set("chainid", String(chainId));
    url.searchParams.set("module", "account");
    url.searchParams.set("action", "addresstokennftinventory");
    url.searchParams.set("address", opts.address);
    url.searchParams.set("contractaddress", contract);
    url.searchParams.set("page", "1");
    url.searchParams.set("offset", "1000");
    url.searchParams.set("apikey", opts.apiKey);

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Etherscan ${opts.chain} ${res.status}`);
    }
    const body = (await res.json()) as { status?: string; result?: unknown };
    const rows = Array.isArray(body.result) ? (body.result as EtherscanRow[]) : [];
    for (const row of rows) {
      const tokenContract = (row.TokenAddress ?? row.tokenAddress ?? contract).toLowerCase();
      const rawId = row.TokenId ?? row.tokenId;
      if (!rawId) continue;
      const tokenId = BigInt(rawId).toString();
      if (!tokenAllowed(tokenContract, tokenId)) continue;
      held.push(toHeldWork({ contract: tokenContract, tokenId, chain: opts.chain }));
    }
  }

  return held;
}

function indexerKeys() {
  return {
    alchemy: process.env.ALCHEMY_API_KEY ?? "",
    etherscan: process.env.ETHERSCAN_API_KEY ?? "",
  };
}

export async function resolveCollectorId(id: string): Promise<Address | null> {
  const trimmed = id.trim();
  const direct = parseAddress(trimmed);
  if (direct) return direct;
  if (!trimmed.includes(".")) return null;

  const client = createPublicClient({
    chain: mainnet,
    transport: http(),
  });
  try {
    const resolved = await client.getEnsAddress({
      name: normalize(trimmed),
    });
    if (!resolved) return null;
    return parseAddress(resolved);
  } catch {
    return null;
  }
}

export function heldWorksFromHoldings(holdings: Holdings): Work[] {
  const works: Work[] = [];
  for (const item of holdings.held) {
    if (item.kind === "catalogued") {
      works.push(item.work);
      continue;
    }
    works.push({
      id: `uncatalogued-${item.tokenId}`,
      catalogNumber: "BD-???",
      title: "Uncatalogued Work",
      collection: "Uncatalogued",
      platform: "Opensea",
      medium: ["2D Artwork"],
      editions: null,
      priceEth: null,
      mintDate: "2021-03-01",
      availability: "Sold Out",
      artwork: "",
      externalUrl: `https://opensea.io/assets/${item.chain}/${item.contract}/${item.tokenId}`,
      chain: item.chain,
      contract: item.contract,
      tokenId: item.tokenId,
      resolved: true,
    });
  }
  return works;
}

export async function getHoldings(address: Address): Promise<Holdings> {
  const keys = indexerKeys();
  const query = async (
    chain: ChainName,
    contracts: readonly string[],
  ): Promise<HeldWork[]> => {
    if (keys.alchemy) {
      return alchemyHoldings({
        address,
        chain,
        contracts,
        apiKey: keys.alchemy,
      });
    }
    if (keys.etherscan) {
      return etherscanHoldings({
        address,
        chain,
        contracts,
        apiKey: keys.etherscan,
      });
    }
    return [];
  };

  const [eth, polygon] = await Promise.all([
    query("ethereum", ETHEREUM_CONTRACTS),
    query("polygon", POLYGON_CONTRACTS),
  ]);

  const seen = new Set<string>();
  const held: HeldWork[] = [];
  for (const item of [...eth, ...polygon]) {
    const key =
      item.kind === "catalogued"
        ? item.work.id
        : `${item.contract}:${item.tokenId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    held.push(item);
  }

  return { address, held };
}

export function indexerConfigured(): boolean {
  const keys = indexerKeys();
  return Boolean(keys.alchemy || keys.etherscan);
}
