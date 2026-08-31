"""Shared Etherscan API v2 helpers for bdscorecard scripts."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
ETHERSCAN_BASE = "https://api.etherscan.io/v2/api"
THROTTLE_SEC = 0.55  # PRO endpoints: 2 calls/sec

CREATOR = "0xed22bb0106c24c7f6b4d8aae33639e1467061f64"
OPENSEA_SHARED = "0x495f947276749ce646f68ac8c248420045cb7b5e"
MINT_SONGS = "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584"
RARIBLE_1155 = "0x60f80121c31a0d46b5279700f9df786054aa5ee5"
RARIBLE_721 = "0xd07dc4262bcdbf85190c01c996b4c06a461d2430"
MANGA_QUOTES = "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba"
BLACK_DAVE_TOKEN = "0xafd17cb86d7cd086fc720365e873469ebcb103da"

ETHEREUM_CONTRACTS = [
    OPENSEA_SHARED,
    MINT_SONGS,
    RARIBLE_1155,
    RARIBLE_721,
    BLACK_DAVE_TOKEN,
]
POLYGON_CONTRACTS = [MANGA_QUOTES]

TOKEN_ALLOWLIST = {
    (MINT_SONGS, "36"),
    (RARIBLE_1155, "1013003"),
    (RARIBLE_721, "101845"),
    (MANGA_QUOTES, "1"),
}


def load_api_key() -> str:
    key = os.environ.get("ETHERSCAN_API_KEY", "").strip()
    if key:
        return key
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.is_file():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            if k.strip() == "ETHERSCAN_API_KEY":
                return v.strip().strip('"').strip("'")
    return ""


def is_black_dave_opensea_token(token_id: str | int) -> bool:
    return int(token_id) >> 96 == int(CREATOR, 16)


def decode_opensea_index(token_id: str | int) -> int:
    hex_id = hex(int(token_id))[2:].zfill(64)
    return int(hex_id[40:54], 16)


def token_allowed(contract: str, token_id: str) -> bool:
    contract = contract.lower()
    if contract == OPENSEA_SHARED:
        return is_black_dave_opensea_token(token_id)
    if contract == BLACK_DAVE_TOKEN:
        return True
    return (contract, token_id) in TOKEN_ALLOWLIST


_last_call = 0.0


def etherscan_get(chain_id: int, params: dict[str, str], api_key: str) -> Any:
    global _last_call
    elapsed = time.monotonic() - _last_call
    if elapsed < THROTTLE_SEC:
        time.sleep(THROTTLE_SEC - elapsed)

    query = {"chainid": str(chain_id), **params, "apikey": api_key}
    url = ETHERSCAN_BASE + "?" + urllib.parse.urlencode(query)
    req = urllib.request.Request(url, headers={"User-Agent": "bdscorecard-etherscan"})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            body = json.loads(res.read().decode())
    except urllib.error.HTTPError as err:
        raise RuntimeError(f"Etherscan HTTP {err.code}") from err

    _last_call = time.monotonic()

    status = body.get("status")
    result = body.get("result")
    if status != "1":
        detail = result if isinstance(result, str) else body.get("message", "NOTOK")
        if isinstance(detail, str) and detail.lower().startswith("no "):
            return []
        raise RuntimeError(f"Etherscan {detail}")

    return result


def etherscan_paginate(
    chain_id: int,
    params: dict[str, str],
    api_key: str,
    *,
    offset: int = 1000,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    page = 1
    while True:
        batch = etherscan_get(
            chain_id,
            {**params, "page": str(page), "offset": str(offset)},
            api_key,
        )
        if not isinstance(batch, list) or not batch:
            break
        rows.extend(batch)
        if len(batch) < offset:
            break
        page += 1
    return rows


def load_catalog() -> list[dict[str, Any]]:
    path = ROOT / "data" / "catalog.json"
    return json.loads(path.read_text())


def match_catalog_work(catalog: list[dict[str, Any]], contract: str, token_id: str) -> dict[str, Any] | None:
    contract = contract.lower()
    token_id = str(int(token_id))
    if contract == BLACK_DAVE_TOKEN:
        for work in catalog:
            if work.get("contract") == contract and work.get("resolved"):
                return work
        return None
    for work in catalog:
        if (
            work.get("resolved")
            and work.get("contract") == contract
            and str(work.get("tokenId")) == token_id
        ):
            return work
    return None
