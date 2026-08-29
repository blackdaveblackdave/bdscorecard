import { CREATOR } from "./contracts";

export function isBlackDaveOpenSeaToken(tokenId: string | bigint): boolean {
  return BigInt(tokenId) >> BigInt(96) === BigInt(CREATOR);
}

export function decodeOpenSeaToken(tokenId: string | bigint) {
  const hex = BigInt(tokenId).toString(16).padStart(64, "0");
  return {
    creator: ("0x" + hex.slice(0, 40)).toLowerCase(),
    index: parseInt(hex.slice(40, 54), 16),
    supply: parseInt(hex.slice(54, 64), 16),
  };
}
