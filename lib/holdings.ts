import { getAddress, isAddress, erc1155Abi, erc20Abi } from "viem";
import { normalize } from "viem/ens";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";
import {
  BLACK_DAVE_TOKEN,
  ETHEREUM_CONTRACTS,
  OPENSEA_SHARED,
  POLYGON_CONTRACTS,
  RARIBLE_1155,
  TOKEN_ALLOWLIST,
} from "./contracts";
import { getCatalog, matchHeldWork } from "./catalog";
import { isBlackDaveOpenSeaToken } from "./opensea-tokens";
import type { Address, ChainName, HeldWork, Holdings, Work } from "./types";

const allowlist = new Set(
  TOKEN_ALLOWLIST.map((row) => `${row.contract}:${row.tokenId}`),
);

const ERC1155_CONTRACTS = new Set<string>([OPENSEA_SHARED, RARIBLE_1155]);

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

type Etherscan1155Tx = {
  from?: string;
  to?: string;
  tokenID?: string;
  tokenValue?: string;
};

function publicClientFor(chain: ChainName) {
  return createPublicClient({
    chain: chain === "polygon" ? polygon : mainnet,
    transport: http(),
  });
}

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

async function erc1155CatalogBalances(opts: {
  address: Address;
  chain: ChainName;
  contract: string;
}): Promise<HeldWork[]> {
  const tokens = getCatalog().filter(
    (work) =>
      work.resolved &&
      work.contract === opts.contract &&
      work.chain === opts.chain &&
      work.tokenId,
  );
  if (tokens.length === 0) return [];

  const client = publicClientFor(opts.chain);
  const contract = opts.contract as `0x${string}`;
  const held: HeldWork[] = [];

  for (let i = 0; i < tokens.length; i += 50) {
    const batch = tokens.slice(i, i + 50);
    const results = await client.multicall({
      allowFailure: true,
      contracts: batch.map((work) => ({
        address: contract,
        abi: erc1155Abi,
        functionName: "balanceOf",
        args: [opts.address as `0x${string}`, BigInt(work.tokenId!)],
      })),
    });

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status !== "success" || result.result === 0) continue;
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

async function erc20Balance(opts: {
  address: Address;
  chain: ChainName;
  contract: string;
}): Promise<number> {
  const client = publicClientFor(opts.chain);
  const balance = await client.readContract({
    address: opts.contract as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [opts.address as `0x${string}`],
  });
  return Number(balance);
}

async function opensea1155FromEtherscan(opts: {
  address: Address;
  apiKey: string;
}): Promise<HeldWork[]> {
  const owner = opts.address.toLowerCase();
  const balances = new Map<string, number>();
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
      const amount = Number.parseInt(row.tokenValue ?? "1", 10);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const from = row.from?.toLowerCase();
      const to = row.to?.toLowerCase();
      if (to === owner) {
        balances.set(tokenId, (balances.get(tokenId) ?? 0) + amount);
      }
      if (from === owner) {
        balances.set(tokenId, (balances.get(tokenId) ?? 0) - amount);
      }
    }

    if (rows.length < 1000) break;
    page += 1;
  }

  const held: HeldWork[] = [];
  for (const [tokenId, balance] of balances) {
    if (balance <= 0) continue;
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

async function etherscanErc721Inventory(opts: {
  address: Address;
  chain: ChainName;
  contract: string;
  apiKey: string;
}): Promise<HeldWork[]> {
  const chainId = opts.chain === "polygon" ? "137" : "1";
  const result = await etherscanRequest(
    {
      chainid: chainId,
      module: "account",
      action: "addresstokennftinventory",
      address: opts.address,
      contractaddress: opts.contract,
      page: "1",
      offset: "1000",
    },
    opts.apiKey,
  );
  const rows = Array.isArray(result) ? (result as EtherscanRow[]) : [];
  const held: HeldWork[] = [];

  for (const row of rows) {
    const tokenContract = (
      row.TokenAddress ?? row.tokenAddress ?? opts.contract
    ).toLowerCase();
    const rawId = row.TokenId ?? row.tokenId;
    if (!rawId) continue;
    const tokenId = BigInt(rawId).toString();
    if (!tokenAllowed(tokenContract, tokenId)) continue;
    held.push(
      toHeldWork({
        contract: tokenContract,
        tokenId,
        chain: opts.chain,
      }),
    );
  }

  return held;
}

async function etherscanHoldings(opts: {
  address: Address;
  chain: ChainName;
  contracts: readonly string[];
  apiKey: string;
}): Promise<HeldWork[]> {
  const held: HeldWork[] = [];

  for (const contract of opts.contracts) {
    if (contract === OPENSEA_SHARED && opts.chain === "ethereum") {
      try {
        held.push(...await opensea1155FromEtherscan({ address: opts.address, apiKey: opts.apiKey }));
      } catch {
        held.push(
          ...(await erc1155CatalogBalances({
            address: opts.address,
            chain: opts.chain,
            contract,
          })),
        );
      }
      continue;
    }

    if (ERC1155_CONTRACTS.has(contract)) {
      held.push(
        ...(await erc1155CatalogBalances({
          address: opts.address,
          chain: opts.chain,
          contract,
        })),
      );
      continue;
    }

    if (contract === BLACK_DAVE_TOKEN) {
      const balance = await erc20Balance({
        address: opts.address,
        chain: opts.chain,
        contract,
      });
      if (balance > 0) {
        held.push(
          toHeldWork({
            contract,
            tokenId: "0",
            chain: opts.chain,
          }),
        );
      }
      continue;
    }

    try {
      held.push(
        ...(await etherscanErc721Inventory({
          address: opts.address,
          chain: opts.chain,
          contract,
          apiKey: opts.apiKey,
        })),
      );
    } catch {
      // ERC-721 inventory is a PRO endpoint; skip contracts that error.
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
