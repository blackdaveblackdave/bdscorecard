#!/usr/bin/env python3
"""Snapshot wallet holdings via Etherscan (mirrors lib/holdings.ts).

Writes data/snapshots/<address>-<timestamp>.json for one or more addresses.

Usage:
  python3 scripts/etherscan-snapshot.py 0xabc... tracklust.eth
  python3 scripts/etherscan-snapshot.py --file addresses.txt
  python3 scripts/etherscan-snapshot.py --out data/snapshots/latest.json 0xabc...

Requires ETHERSCAN_API_KEY in the environment or .env.local.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from etherscan_common import (
    BLACK_DAVE_TOKEN,
    ETHEREUM_CONTRACTS,
    MANGA_QUOTES,
    OPENSEA_SHARED,
    POLYGON_CONTRACTS,
    RARIBLE_1155,
    RARIBLE_721,
    ROOT,
    etherscan_get,
    etherscan_paginate,
    load_api_key,
    load_catalog,
    match_catalog_work,
    token_allowed,
)

SNAPSHOT_DIR = ROOT / "data" / "snapshots"
ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def resolve_address(raw: str) -> str | None:
    trimmed = raw.strip()
    if ADDRESS_RE.match(trimmed):
        return trimmed.lower()
    if "." not in trimmed:
        return None

    import subprocess

    script = f"""
import {{ createPublicClient, http }} from 'viem';
import {{ normalize }} from 'viem/ens';
import {{ mainnet }} from 'viem/chains';
const client = createPublicClient({{ chain: mainnet, transport: http() }});
const name = normalize('{trimmed.replace("'", "")}');
const addr = await client.getEnsAddress({{ name }});
if (addr) console.log(addr);
"""
    result = subprocess.run(
        ["node", "--import", "tsx", "-e", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=30,
    )
    out = (result.stdout or "").strip().lower()
    if ADDRESS_RE.match(out):
        return out
    return None


def opensea_1155_holdings(address: str, api_key: str) -> list[tuple[str, str]]:
    owner = address.lower()
    balances: dict[str, int] = {}
    rows = etherscan_paginate(
        1,
        {
            "module": "account",
            "action": "token1155tx",
            "address": address,
            "contractaddress": OPENSEA_SHARED,
            "sort": "asc",
        },
        api_key,
    )
    for row in rows:
        raw_id = row.get("tokenID")
        if not raw_id:
            continue
        token_id = str(int(raw_id))
        amount = int(row.get("tokenValue") or 1)
        from_a = (row.get("from") or "").lower()
        to_a = (row.get("to") or "").lower()
        if to_a == owner:
            balances[token_id] = balances.get(token_id, 0) + amount
        if from_a == owner:
            balances[token_id] = balances.get(token_id, 0) - amount

    held: list[tuple[str, str]] = []
    for token_id, balance in balances.items():
        if balance <= 0:
            continue
        if not token_allowed(OPENSEA_SHARED, token_id):
            continue
        held.append((OPENSEA_SHARED, token_id))
    return held


def erc721_inventory(
    address: str,
    chain_id: int,
    contract: str,
    api_key: str,
) -> list[tuple[str, str]]:
    held: list[tuple[str, str]] = []
    try:
        rows = etherscan_get(
            chain_id,
            {
                "module": "account",
                "action": "addresstokennftinventory",
                "address": address,
                "contractaddress": contract,
                "page": "1",
                "offset": "1000",
            },
            api_key,
        )
    except RuntimeError:
        return held

    if not isinstance(rows, list):
        return held

    for row in rows:
        token_contract = (
            row.get("TokenAddress") or row.get("tokenAddress") or contract
        ).lower()
        raw_id = row.get("TokenId") or row.get("tokenId")
        if not raw_id:
            continue
        token_id = str(int(raw_id))
        if not token_allowed(token_contract, token_id):
            continue
        held.append((token_contract, token_id))
    return held


def erc1155_catalog_balances(
    address: str,
    chain_id: int,
    contract: str,
    catalog: list[dict[str, Any]],
    api_key: str,
) -> list[tuple[str, str]]:
    """Use transfer history for a single ERC-1155 contract (Rarible shared)."""
    owner = address.lower()
    balances: dict[str, int] = {}
    rows = etherscan_paginate(
        chain_id,
        {
            "module": "account",
            "action": "token1155tx",
            "address": address,
            "contractaddress": contract,
            "sort": "asc",
        },
        api_key,
    )
    catalog_ids = {
        str(w["tokenId"])
        for w in catalog
        if w.get("resolved") and w.get("contract") == contract and w.get("tokenId")
    }
    for row in rows:
        raw_id = row.get("tokenID")
        if not raw_id:
            continue
        token_id = str(int(raw_id))
        if token_id not in catalog_ids:
            continue
        amount = int(row.get("tokenValue") or 1)
        from_a = (row.get("from") or "").lower()
        to_a = (row.get("to") or "").lower()
        if to_a == owner:
            balances[token_id] = balances.get(token_id, 0) + amount
        if from_a == owner:
            balances[token_id] = balances.get(token_id, 0) - amount

    return [(contract, tid) for tid, bal in balances.items() if bal > 0]


def erc20_balance(address: str, contract: str, api_key: str) -> int:
    raw = etherscan_get(
        1,
        {
            "module": "account",
            "action": "tokenbalance",
            "address": address,
            "contractaddress": contract,
            "tag": "latest",
        },
        api_key,
    )
    return int(raw)


def snapshot_address(address: str, api_key: str, catalog: list[dict[str, Any]]) -> dict[str, Any]:
    chain_name = {"1": "ethereum", "137": "polygon"}
    tokens: list[tuple[str, str, str]] = []

    for contract in ETHEREUM_CONTRACTS:
        if contract == OPENSEA_SHARED:
            for c, tid in opensea_1155_holdings(address, api_key):
                tokens.append(("ethereum", c, tid))
        elif contract == RARIBLE_1155:
            for c, tid in erc1155_catalog_balances(address, 1, contract, catalog, api_key):
                tokens.append(("ethereum", c, tid))
        elif contract == BLACK_DAVE_TOKEN:
            if erc20_balance(address, contract, api_key) > 0:
                tokens.append(("ethereum", contract, "0"))
        else:
            for c, tid in erc721_inventory(address, 1, contract, api_key):
                tokens.append(("ethereum", c, tid))

    for contract in POLYGON_CONTRACTS:
        for c, tid in erc721_inventory(address, 137, contract, api_key):
            tokens.append(("polygon", c, tid))

    catalogued: list[dict[str, Any]] = []
    uncatalogued: list[dict[str, Any]] = []
    seen: set[str] = set()

    for chain, contract, token_id in tokens:
        key = f"{contract}:{token_id}"
        if key in seen:
            continue
        seen.add(key)

        work = match_catalog_work(catalog, contract, token_id)
        row = {
            "chain": chain,
            "contract": contract,
            "tokenId": token_id,
        }
        if work:
            row.update(
                {
                    "catalogId": work["id"],
                    "catalogNumber": work.get("catalogNumber"),
                    "title": work["title"],
                    "collection": work.get("collection"),
                    "resolved": True,
                }
            )
            catalogued.append(row)
        else:
            row["title"] = "Uncatalogued Work"
            row["resolved"] = False
            uncatalogued.append(row)

    resolved_count = len(catalogued)
    unresolved_in_catalog = sum(1 for w in catalog if not w.get("resolved"))

    return {
        "address": address,
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "indexer": "etherscan",
        "summary": {
            "cataloguedHeld": resolved_count,
            "uncataloguedHeld": len(uncatalogued),
            "resolvedCatalogTotal": sum(1 for w in catalog if w.get("resolved")),
            "unresolvedCatalogTotal": unresolved_in_catalog,
        },
        "catalogued": catalogued,
        "uncatalogued": uncatalogued,
    }


def read_address_file(path: Path) -> list[str]:
    lines = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line)
    return lines


def main() -> None:
    parser = argparse.ArgumentParser(description="Etherscan holdings snapshot")
    parser.add_argument("addresses", nargs="*", help="0x addresses or ENS names")
    parser.add_argument("--file", type=Path, help="File with one address per line")
    parser.add_argument("--out", type=Path, help="Write a single combined JSON file")
    args = parser.parse_args()

    api_key = load_api_key()
    if not api_key:
        print("FAIL set ETHERSCAN_API_KEY in .env.local or the environment", file=sys.stderr)
        sys.exit(1)

    raw_inputs: list[str] = list(args.addresses)
    if args.file:
        raw_inputs.extend(read_address_file(args.file))

    if not raw_inputs:
        parser.print_help()
        sys.exit(1)

    catalog = load_catalog()
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

    snapshots: list[dict[str, Any]] = []
    for raw in raw_inputs:
        address = resolve_address(raw)
        if not address:
            print(f"FAIL could not resolve {raw}", file=sys.stderr)
            sys.exit(1)
        print(f"snapshot {raw} -> {address}")
        snap = snapshot_address(address, api_key, catalog)
        snapshots.append(snap)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_path = SNAPSHOT_DIR / f"{address}-{stamp}.json"
        out_path.write_text(json.dumps(snap, indent=2) + "\n")
        print(
            f"  wrote {out_path.name}: "
            f"{snap['summary']['cataloguedHeld']} catalogued, "
            f"{snap['summary']['uncataloguedHeld']} uncatalogued"
        )

    if args.out:
        payload = snapshots[0] if len(snapshots) == 1 else {"snapshots": snapshots}
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(payload, indent=2) + "\n")
        print(f"combined -> {args.out}")

    print("ok snapshot")


if __name__ == "__main__":
    main()
