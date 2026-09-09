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
MINT_SONGS_FACTORY = "0xc29cbe04ae322469dc077741afa2fbccda748ae4"
BLACK_DAVE_TOKEN = "0xafd17cb86d7cd086fc720365e873469ebcb103da"
YARDS = "0xcabcfb8cfe1c94304bfa4ac56f778c7c7e080b55"
ITEM_BOX = "0x1491ea485e78cdbe895293cbaeb2b707012197b9"
WAVROOM = "0xadf5d2ae8a86ba35ba346444b368413e5e7a8fc3"
THREE_PERCENT = "0xd410d5cbf64a2ee4c777a3ea85da58dbd634ab13"
I_HAVE_IDEAS = "0xc0f82fca66ca1de005e7ce869c233ccde7c0bcde"
ME_TOO = "0x9bdeab2090cab7f462d0c949acad9103bf21b0eb"
ADVICE = "0x5fe9730db5c72f0130d26054bfff21f1ee9405a7"
I_LOVE_THIS_SHIT = "0xa6505645a37d7d5f67cfde8501a7fead292a3cff"
BAG = "0xd03902b4f1c11eb3f6746d09be98a028ba4df10f"
LAVENDER = "0x2cd86e0aaa2d195ac4c0d18a3adabaf5c3144e3d"
FEEL_GOOD = "0x5324972755cb8c04ea227c5b7c430ced424f7e39"

SUPERCOLLECTOR_CHRONICLES = "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069"
SUPERCOLLECTOR_STAY_GOLD = "0x97312325fda573f8ba5cb4160130631d0d823892"
SUPERCOLLECTOR_UNREQUITED = "0x7cb50113f54d12ca5146e57b193d7a6c53722060"
SUPERCOLLECTOR_WORD_ASSOCIATION = "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba"
SUPERCOLLECTOR_SS23 = "0xedd6b208c35281554caa71b44f7f3842295b07ab"
SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT = "0x761fc1fa3935c9f8166147e2fe428ef54943b853"
SUPERCOLLECTOR_ABANDONED_MECH = "0x371aa2d25d138b99e1f30bc2a4852f9fa7882c2f"
SUPERCOLLECTOR_CONTRACTS = {
    SUPERCOLLECTOR_CHRONICLES,
    SUPERCOLLECTOR_STAY_GOLD,
    SUPERCOLLECTOR_UNREQUITED,
    SUPERCOLLECTOR_WORD_ASSOCIATION,
    SUPERCOLLECTOR_SS23,
    SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
    SUPERCOLLECTOR_ABANDONED_MECH,
}

ETHEREUM_CONTRACTS = [
    OPENSEA_SHARED,
    MINT_SONGS,
    RARIBLE_1155,
    RARIBLE_721,
    BLACK_DAVE_TOKEN,
    WAVROOM,
    ME_TOO,
    ADVICE,
    I_LOVE_THIS_SHIT,
    BAG,
    LAVENDER,
    FEEL_GOOD,
]
POLYGON_CONTRACTS = [MANGA_QUOTES, MINT_SONGS_FACTORY]
OPTIMISM_CONTRACTS = list(SUPERCOLLECTOR_CONTRACTS) + [I_HAVE_IDEAS]
BASE_CONTRACTS = [YARDS, ITEM_BOX, THREE_PERCENT]

TOKEN_ALLOWLIST = {
    (MINT_SONGS, "36"),
    (RARIBLE_1155, "1013003"),
    (RARIBLE_721, "101845"),
    (MANGA_QUOTES, "1"),
    (MINT_SONGS_FACTORY, "47618"),
    (MINT_SONGS_FACTORY, "47619"),
    (MINT_SONGS_FACTORY, "47620"),
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
    if (
        contract == BLACK_DAVE_TOKEN
        or contract == YARDS
        or contract == ITEM_BOX
        or contract == WAVROOM
        or contract == THREE_PERCENT
        or contract == I_HAVE_IDEAS
        or contract == ME_TOO
        or contract == ADVICE
        or contract == I_LOVE_THIS_SHIT
        or contract == BAG
        or contract == LAVENDER
        or contract == FEEL_GOOD
        or contract in SUPERCOLLECTOR_CONTRACTS
    ):
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
    if (
        contract == BLACK_DAVE_TOKEN
        or contract == YARDS
        or contract == ITEM_BOX
        or contract == WAVROOM
        or contract == THREE_PERCENT
        or contract == I_HAVE_IDEAS
        or contract == ME_TOO
        or contract == ADVICE
        or contract == I_LOVE_THIS_SHIT
        or contract == BAG
        or contract == LAVENDER
        or contract == FEEL_GOOD
        or contract in SUPERCOLLECTOR_CONTRACTS
    ):
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
