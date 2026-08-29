import catalog from "../data/catalog.json";
import { BLACK_DAVE_TOKEN } from "./contracts";
import type { Availability, ChainName, Work } from "./types";

function parseAvailability(value: unknown): Availability {
  if (
    value === "Sold Out" ||
    value === "Unsold" ||
    value === "Always On" ||
    value === ""
  ) {
    return value;
  }
  return "";
}

function parseChain(value: unknown): ChainName | null {
  if (value === "ethereum" || value === "polygon") return value;
  return null;
}

function parseWork(value: unknown): Work | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;
  const medium = Array.isArray(row.medium)
    ? row.medium.filter((item): item is string => typeof item === "string")
    : [];
  return {
    id: row.id,
    catalogNumber: typeof row.catalogNumber === "string" ? row.catalogNumber : "",
    title: row.title,
    collection: typeof row.collection === "string" ? row.collection : "",
    platform: typeof row.platform === "string" ? row.platform : "",
    medium,
    editions: typeof row.editions === "number" ? row.editions : null,
    priceEth: typeof row.priceEth === "number" ? row.priceEth : null,
    mintDate: typeof row.mintDate === "string" ? row.mintDate : "2021-01-01",
    availability: parseAvailability(row.availability),
    artwork: typeof row.artwork === "string" ? row.artwork : "",
    externalUrl: typeof row.externalUrl === "string" ? row.externalUrl : "",
    chain: parseChain(row.chain),
    contract: typeof row.contract === "string" ? row.contract.toLowerCase() : null,
    tokenId: typeof row.tokenId === "string" ? row.tokenId : null,
    resolved: row.resolved === true,
  };
}

const works: Work[] = (Array.isArray(catalog) ? catalog : [])
  .map(parseWork)
  .filter((work): work is Work => work !== null);

export function getCatalog(): Work[] {
  return works;
}

export function getWorkById(id: string): Work | undefined {
  return works.find((work) => work.id === id);
}

export function getVaultWorks(): Work[] {
  return works.filter(
    (work) => work.availability === "Unsold" || work.availability === "Always On",
  );
}

export function matchHeldWork(opts: {
  contract: string;
  tokenId: string;
}): Work | undefined {
  const contract = opts.contract.toLowerCase();
  if (contract === BLACK_DAVE_TOKEN) {
    return works.find((work) => work.contract === contract && work.resolved);
  }
  return works.find(
    (work) =>
      work.contract === contract && work.tokenId === opts.tokenId && work.resolved,
  );
}

export function collections(): string[] {
  return [...new Set(works.map((work) => work.collection))].sort();
}

export function mediaTypes(): string[] {
  return [...new Set(works.flatMap((work) => work.medium))].sort();
}

export function availabilities(): string[] {
  return [...new Set(works.map((work) => work.availability).filter(Boolean))].sort();
}
