#!/usr/bin/env python3
"""Harvest on-chain contract hints for unresolved catalog works via Etherscan.

Outputs:
  data/harvest-report.json  — unresolved inventory + discovered contracts
  data/snapshots/creator-mints.json — NFT activity from blackdave.eth creator wallet

Usage:
  python3 scripts/harvest-contracts.py
  python3 scripts/harvest-contracts.py --snapshot-creator

Requires ETHERSCAN_API_KEY in the environment or .env.local.
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from etherscan_common import (
    CREATOR,
    OPENSEA_SHARED,
    ROOT,
    decode_opensea_index,
    etherscan_paginate,
    is_black_dave_opensea_token,
    load_api_key,
    load_catalog,
)

HARVEST_OUT = ROOT / "data" / "harvest-report.json"
SNAPSHOT_DIR = ROOT / "data" / "snapshots"
CREATOR_MINTS_OUT = SNAPSHOT_DIR / "creator-mints.json"

KNOWN_RESOLVED = {
    "0x495f947276749ce646f68ac8c248420045cb7b5e",
    "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584",
    "0x60f80121c31a0d46b5279700f9df786054aa5ee5",
    "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
    "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba",
    "0xafd17cb86d7cd086fc720365e873469ebcb103da",
    "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069",
    "0x97312325fda573f8ba5cb4160130631d0d823892",
    "0x7cb50113f54d12ca5146e57b193d7a6c53722060",
    "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba",
    "0xedd6b208c35281554caa71b44f7f3842295b07ab",
    "0x761fc1fa3935c9f8166147e2fe428ef54943b853",
    "0x371aa2d25d138b99e1f30bc2a4852f9fa7882c2f",
    "0xab80184b3bba02e975b6494d570232fb6c6973f1",
    "0x1a5d314beed6e39fd152cf54d3671ad33fdccf9a",
    "0x4c537c0ec793632a4feaaffc200e35a67a983904",
    "0x3b3ee1931dc30c1957379fac9aba94d1c48a5405",
    "0x0f864e29b01a72247b6795cc6054afeb53ef35ef",
    "0x446671f87ff72109ed1496740c90a9ceed767d70",
    "0xcabcfb8cfe1c94304bfa4ac56f778c7c7e080b55",
    "0x1491ea485e78cdbe895293cbaeb2b707012197b9",
    "0xadf5d2ae8a86ba35ba346444b368413e5e7a8fc3",
    "0xd410d5cbf64a2ee4c777a3ea85da58dbd634ab13",
    "0xc0f82fca66ca1de005e7ce869c233ccde7c0bcde",
    "0x9bdeab2090cab7f462d0c949acad9103bf21b0eb",
    "0x5fe9730db5c72f0130d26054bfff21f1ee9405a7",
    "0xa6505645a37d7d5f67cfde8501a7fead292a3cff",
    "0xd03902b4f1c11eb3f6746d09be98a028ba4df10f",
    "0x2cd86e0aaa2d195ac4c0d18a3adabaf5c3144e3d",
    "0x5324972755cb8c04ea227c5b7c430ced424f7e39",
}

PLATFORM_HINTS = {
    "Sound.xyz": "Scan creator tokennfttx / platform subgraph; contract per release.",
    "Catalog": "catalog.works slug in URL; needs Catalog API or mint tx from creator.",
    "Mint Songs Factory": "factory.mintsongs.com song id in URL; map via Mint Songs contract.",
    "Foundation": "foundation.app token id in URL; Foundation API or creator mint txs.",
    "Supercollector": "release.supercollector.xyz slug; platform-specific contract.",
    "Glass": "glass.xyz video id; Glass mint contract on chain.",
    "Manifold": "manifold.xyz/c/{slug}; lookup creator Manifold extensions.",
    "Unique One": "Unique marketplace; check creator ERC-721 mints.",
    "Cargo": "Cargo.xyz; check creator mint history.",
    "$BLKD": "Custom BLKD drop; scan creator txs around mint date.",
}


def unresolved_rows(catalog: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for work in catalog:
        if work.get("resolved"):
            continue
        platform = work.get("platform") or ""
        rows.append(
            {
                "id": work["id"],
                "catalogNumber": work.get("catalogNumber"),
                "title": work["title"],
                "platform": platform,
                "collection": work.get("collection"),
                "externalUrl": work.get("externalUrl") or "",
                "mintDate": work.get("mintDate") or "",
                "availability": work.get("availability") or "",
                "hint": PLATFORM_HINTS.get(platform, "Manual research or platform API."),
                "urlHost": urlparse(work.get("externalUrl") or "").netloc,
            }
        )
    return rows


def catalog_opensea_indices(catalog: list[dict[str, Any]]) -> set[int]:
    indices: set[int] = set()
    for work in catalog:
        if work.get("contract") != OPENSEA_SHARED or not work.get("tokenId"):
            continue
        if is_black_dave_opensea_token(work["tokenId"]):
            indices.add(decode_opensea_index(work["tokenId"]))
    return indices


def harvest_creator_activity(api_key: str, catalog: list[dict[str, Any]]) -> dict[str, Any]:
    catalog_indices = catalog_opensea_indices(catalog)

    opensea_rows = etherscan_paginate(
        1,
        {
            "module": "account",
            "action": "token1155tx",
            "address": CREATOR,
            "contractaddress": OPENSEA_SHARED,
            "sort": "asc",
        },
        api_key,
    )

    opensea_bd_tokens: dict[str, dict[str, Any]] = {}
    for row in opensea_rows:
        raw_id = row.get("tokenID")
        if not raw_id:
            continue
        token_id = str(int(raw_id))
        if not is_black_dave_opensea_token(token_id):
            continue
        index = decode_opensea_index(token_id)
        if token_id not in opensea_bd_tokens:
            opensea_bd_tokens[token_id] = {
                "tokenId": token_id,
                "openSeaIndex": index,
                "inCatalog": index in catalog_indices,
                "sampleHash": row.get("hash"),
            }

    nft_rows = etherscan_paginate(
        1,
        {"module": "account", "action": "tokennfttx", "address": CREATOR, "sort": "asc"},
        api_key,
    )

    contracts: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"chain": "ethereum", "tokenIds": set(), "txCount": 0}
    )
    for row in nft_rows:
        contract = (row.get("contractAddress") or "").lower()
        if not contract:
            continue
        contracts[contract]["txCount"] += 1
        raw_id = row.get("tokenID")
        if raw_id:
            contracts[contract]["tokenIds"].add(str(int(raw_id)))

    discovered = []
    for contract, meta in sorted(contracts.items()):
        if contract in KNOWN_RESOLVED:
            continue
        discovered.append(
            {
                "contract": contract,
                "chain": "ethereum",
                "tokenIdCount": len(meta["tokenIds"]),
                "sampleTokenIds": sorted(meta["tokenIds"])[:5],
                "txCount": meta["txCount"],
                "alreadyResolved": False,
            }
        )

    uncatalogued_indices = sorted(
        t["openSeaIndex"]
        for t in opensea_bd_tokens.values()
        if not t["inCatalog"]
    )

    return {
        "creator": CREATOR,
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "openseaSharedStorefront": {
            "contract": OPENSEA_SHARED,
            "blackDaveTokenCount": len(opensea_bd_tokens),
            "uncataloguedIndices": uncatalogued_indices,
            "tokens": list(opensea_bd_tokens.values()),
        },
        "discoveredContracts": discovered,
    }


def main() -> None:
    snapshot_creator = "--snapshot-creator" in sys.argv

    api_key = load_api_key()
    if not api_key:
        print("FAIL set ETHERSCAN_API_KEY in .env.local or the environment", file=sys.stderr)
        sys.exit(1)

    catalog = load_catalog()
    unresolved = unresolved_rows(catalog)
    by_platform = dict(Counter(r["platform"] or "?" for r in unresolved))

    print(f"unresolved works: {len(unresolved)}")
    for platform, count in sorted(by_platform.items(), key=lambda x: -x[1]):
        print(f"  {platform}: {count}")

    creator_data: dict[str, Any] | None = None
    if snapshot_creator or True:
        print("scanning creator NFT activity on Etherscan...")
        creator_data = harvest_creator_activity(api_key, catalog)
        SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
        CREATOR_MINTS_OUT.write_text(json.dumps(creator_data, indent=2) + "\n")
        print(f"  wrote {CREATOR_MINTS_OUT}")
        print(
            f"  opensea BD tokens: {creator_data['openseaSharedStorefront']['blackDaveTokenCount']}"
        )
        print(
            f"  uncatalogued indices: "
            f"{creator_data['openseaSharedStorefront']['uncataloguedIndices']}"
        )
        print(f"  new contract candidates: {len(creator_data['discoveredContracts'])}")

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "totalWorks": len(catalog),
            "resolved": sum(1 for w in catalog if w.get("resolved")),
            "unresolved": len(unresolved),
            "unresolvedByPlatform": by_platform,
        },
        "unresolvedWorks": unresolved,
        "creatorHarvest": creator_data,
        "nextSteps": [
            "Run python3 scripts/etherscan-snapshot.py <address> for wallet holdings.",
            "Add Contract / Chain / Token ID columns in Notion for resolved rows.",
            "Re-run python3 scripts/sync-notion-catalog.py after updating notion-export.json.",
        ],
    }

    HARVEST_OUT.write_text(json.dumps(report, indent=2) + "\n")
    print(f"wrote {HARVEST_OUT}")
    print("ok harvest")


if __name__ == "__main__":
    main()
