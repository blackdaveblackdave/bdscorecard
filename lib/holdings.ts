import {
  getAddress,
  isAddress,
  erc1155Abi,
  erc20Abi,
  erc721Abi,
  fallback,
  http,
  type Chain,
} from "viem";
import { normalize } from "viem/ens";
import { createPublicClient } from "viem";
import { mainnet, optimism, polygon } from "viem/chains";
import {
  BLACK_DAVE_TOKEN,
  FRACTIONAL_HOLDINGS,
  OPENSEA_SHARED,
  RARIBLE_721,
  TOKEN_ALLOWLIST,
  isSupercollectorContract,
} from "./contracts";
import { getCatalog, getWorkById, matchHeldWork } from "./catalog";
import { isBlackDaveOpenSeaToken } from "./opensea-tokens";
import type { Address, ChainName, HeldWork, Holdings, Work } from "./types";

const allowlist = new Set(
  TOKEN_ALLOWLIST.map((row) => `${row.contract}:${row.tokenId}`),
);

export type TokenStandard = "erc721" | "erc1155";

export function catalogTokenStandard(contract: string): TokenStandard {
  // 0xd07d is Rarible's ERC-1155; 0x60f8 is Rarible's ERC-721.
  // Constant names follow the PRD labels, which swapped those two.
  const addr = contract.toLowerCase();
  if (
    addr === OPENSEA_SHARED ||
    addr === RARIBLE_721 ||
    addr === BLACK_DAVE_TOKEN ||
    isSupercollectorContract(addr)
  ) {
    return "erc1155";
  }
  return "erc721";
}

export function hasErc1155Balance(balance: bigint): boolean {
  return balance > 0n;
}

export function isErc721Owner(owner: string, tokenOwner: string | bigint): boolean {
  return typeof tokenOwner === "string" && tokenOwner.toLowerCase() === owner;
}

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
  if (chain === "polygon") return "polygon-mainnet";
  if (chain === "optimism") return "opt-mainnet";
  return "eth-mainnet";
}

const CHAIN_RPC: Record<
  ChainName,
  { viem: Chain; alchemy: (key: string) => string; public: string }
> = {
  ethereum: {
    viem: mainnet,
    alchemy: (key) => `https://eth-mainnet.g.alchemy.com/v2/${key}`,
    public: "https://ethereum.publicnode.com",
  },
  polygon: {
    viem: polygon,
    alchemy: (key) => `https://polygon-mainnet.g.alchemy.com/v2/${key}`,
    public: "https://polygon-bor-rpc.publicnode.com",
  },
  optimism: {
    viem: optimism,
    alchemy: (key) => `https://opt-mainnet.g.alchemy.com/v2/${key}`,
    public: "https://optimism.publicnode.com",
  },
};

const DCNT_SERIES_ABI = [
  {
    type: "function",
    name: "tokenRange",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "startTokenId", type: "uint128" },
      { name: "endTokenId", type: "uint128" },
    ],
  },
] as const;

export function tokenIdsFromRange(
  start: bigint,
  end: bigint,
  maxCount = 32,
): string[] | null {
  if (end < start) return null;
  const count = end - start + 1n;
  if (count <= 0n || count > BigInt(maxCount)) return null;
  const ids: string[] = [];
  for (let id = start; id <= end; id++) {
    ids.push(id.toString());
  }
  return ids;
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

function publicClientFor(chain: ChainName) {
  const alchemy = process.env.ALCHEMY_API_KEY ?? "";
  const rpc = CHAIN_RPC[chain];
  const transports = [];
  if (alchemy) {
    transports.push(http(rpc.alchemy(alchemy)));
  }
  transports.push(http(rpc.public));
  transports.push(http());
  return createPublicClient({
    chain: rpc.viem,
    transport: fallback(transports),
  });
}

function catalogTokensOn(contract: string, chain: ChainName) {
  return getCatalog().filter(
    (work) =>
      work.resolved &&
      work.contract === contract &&
      work.chain === chain &&
      work.tokenId,
  );
}

function resolvedContractGroups(): { contract: string; chain: ChainName }[] {
  const seen = new Set<string>();
  const groups: { contract: string; chain: ChainName }[] = [];
  for (const work of getCatalog()) {
    if (!work.resolved || !work.contract || !work.chain || !work.tokenId) continue;
    const key = `${work.chain}:${work.contract}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ contract: work.contract, chain: work.chain });
  }
  return groups;
}

async function seriesTokenIds(
  client: ReturnType<typeof publicClientFor>,
  contract: `0x${string}`,
): Promise<string[] | null> {
  try {
    const range = await client.readContract({
      address: contract,
      abi: DCNT_SERIES_ABI,
      functionName: "tokenRange",
    });
    return tokenIdsFromRange(range[0], range[1]);
  } catch {
    return null;
  }
}

async function erc1155CatalogBalances(opts: {
  address: Address;
  chain: ChainName;
  contract: string;
}): Promise<HeldWork[]> {
  const tokens = catalogTokensOn(opts.contract, opts.chain);
  if (tokens.length === 0) return [];

  const client = publicClientFor(opts.chain);
  const contract = opts.contract as `0x${string}`;
  let tokenIds = tokens.map((work) => work.tokenId!);
  if (isSupercollectorContract(opts.contract)) {
    const series = await seriesTokenIds(client, contract);
    if (series) tokenIds = series;
  }

  const held: HeldWork[] = [];

  for (let i = 0; i < tokenIds.length; i += 50) {
    const batch = tokenIds.slice(i, i + 50);
    const results = await client.multicall({
      allowFailure: true,
      contracts: batch.map((tokenId) => ({
        address: contract,
        abi: erc1155Abi,
        functionName: "balanceOf",
        args: [opts.address as `0x${string}`, BigInt(tokenId)],
      })),
    });

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status !== "success" || !hasErc1155Balance(result.result)) continue;
      held.push(
        toHeldWork({
          contract: opts.contract,
          tokenId: batch[j],
          chain: opts.chain,
        }),
      );
    }
  }

  return held;
}

async function erc721CatalogOwners(opts: {
  address: Address;
  chain: ChainName;
  contract: string;
}): Promise<HeldWork[]> {
  const tokens = catalogTokensOn(opts.contract, opts.chain);
  if (tokens.length === 0) return [];

  const client = publicClientFor(opts.chain);
  const contract = opts.contract as `0x${string}`;
  const owner = opts.address.toLowerCase();
  const held: HeldWork[] = [];

  for (let i = 0; i < tokens.length; i += 50) {
    const batch = tokens.slice(i, i + 50);
    const results = await client.multicall({
      allowFailure: true,
      contracts: batch.map((work) => ({
        address: contract,
        abi: erc721Abi,
        functionName: "ownerOf",
        args: [BigInt(work.tokenId!)],
      })),
    });

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status !== "success" || !isErc721Owner(owner, result.result)) continue;
      const work = batch[j];
      held.push(
        toHeldWork({
          contract: opts.contract,
          tokenId: work.tokenId!,
          chain: opts.chain,
        }),
      );
    }
  }

  return held;
}

async function fractionalCatalogHoldings(address: Address): Promise<HeldWork[]> {
  const client = publicClientFor("ethereum");
  const held: HeldWork[] = [];

  for (const row of FRACTIONAL_HOLDINGS) {
    const work = getWorkById(row.workId);
    if (!work?.resolved) continue;

    try {
      const balance = await client.readContract({
        address: row.token as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });
      if (balance <= 0n) continue;
      held.push({ kind: "catalogued", work });
    } catch {
      continue;
    }
  }

  return held;
}

async function catalogHoldings(address: Address): Promise<HeldWork[]> {
  const results = await Promise.all([
    ...resolvedContractGroups().map(async (group) => {
      try {
        if (catalogTokenStandard(group.contract) === "erc1155") {
          return await erc1155CatalogBalances({ address, ...group });
        }
        return await erc721CatalogOwners({ address, ...group });
      } catch {
        return [];
      }
    }),
    fractionalCatalogHoldings(address),
  ]);
  return results.flat();
}

type Etherscan1155Tx = {
  from?: string;
  to?: string;
  tokenID?: string;
};

async function etherscanRequest(
  params: Record<string, string>,
  apiKey: string,
): Promise<unknown> {
  const url = new URL("https://api.etherscan.io/v2/api");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Etherscan HTTP ${res.status}`);
  }
  const body = (await res.json()) as { status?: string; message?: string; result?: unknown };
  if (body.status !== "1") {
    const detail =
      typeof body.result === "string" ? body.result : body.message ?? "NOTOK";
    throw new Error(`Etherscan ${detail}`);
  }
  return body.result;
}

async function alchemyOpenSeaNfts(opts: {
  address: Address;
  apiKey: string;
}): Promise<HeldWork[]> {
  const held: HeldWork[] = [];
  let pageKey: string | undefined;
  const base = `https://${alchemyNetwork("ethereum")}.g.alchemy.com/nft/v3/${opts.apiKey}/getNFTsForOwner`;

  do {
    const url = new URL(base);
    url.searchParams.set("owner", opts.address);
    url.searchParams.set("withMetadata", "false");
    url.searchParams.set("pageSize", "100");
    url.searchParams.append("contractAddresses[]", OPENSEA_SHARED);
    if (pageKey) url.searchParams.set("pageKey", pageKey);

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Alchemy ethereum ${res.status}`);
    }
    const body = (await res.json()) as AlchemyPage;
    for (const nft of body.ownedNfts ?? []) {
      const contract = nft.contract?.address?.toLowerCase();
      const tokenId = nft.tokenId ? BigInt(nft.tokenId).toString() : "";
      if (!contract || !tokenId) continue;
      if (!tokenAllowed(contract, tokenId)) continue;
      held.push(toHeldWork({ contract, tokenId, chain: "ethereum" }));
    }
    pageKey = body.pageKey;
  } while (pageKey);

  return held;
}

async function etherscanOpenSeaNfts(opts: {
  address: Address;
  apiKey: string;
}): Promise<HeldWork[]> {
  const owner = opts.address.toLowerCase();
  const seen = new Set<string>();
  let page = 1;

  while (true) {
    const result = await etherscanRequest(
      {
        chainid: "1",
        module: "account",
        action: "token1155tx",
        address: opts.address,
        contractaddress: OPENSEA_SHARED,
        page: String(page),
        offset: "1000",
        sort: "asc",
      },
      opts.apiKey,
    );
    const rows = Array.isArray(result) ? (result as Etherscan1155Tx[]) : [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const rawId = row.tokenID;
      if (!rawId) continue;
      const tokenId = BigInt(rawId).toString();
      if (row.to?.toLowerCase() === owner) seen.add(tokenId);
      if (row.from?.toLowerCase() === owner) seen.delete(tokenId);
    }

    if (rows.length < 1000) break;
    page += 1;
  }

  const held: HeldWork[] = [];
  for (const tokenId of seen) {
    if (!tokenAllowed(OPENSEA_SHARED, tokenId)) continue;
    held.push(
      toHeldWork({
        contract: OPENSEA_SHARED,
        tokenId,
        chain: "ethereum",
      }),
    );
  }
  return held;
}

async function uncataloguedOpenSea(address: Address): Promise<HeldWork[]> {
  const keys = indexerKeys();
  try {
    const found = keys.alchemy
      ? await alchemyOpenSeaNfts({ address, apiKey: keys.alchemy })
      : keys.etherscan
        ? await etherscanOpenSeaNfts({ address, apiKey: keys.etherscan })
        : [];
    return found.filter((item) => item.kind === "uncatalogued");
  } catch {
    return [];
  }
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
  const [catalogued, extra] = await Promise.all([
    catalogHoldings(address),
    uncataloguedOpenSea(address),
  ]);

  const seen = new Set<string>();
  const held: HeldWork[] = [];
  for (const item of [...catalogued, ...extra]) {
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
