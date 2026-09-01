#!/usr/bin/env python3
"""Build data/catalog.json from the local portfolio archive (stand-in for Notion)."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

PORTFOLIO = Path("/Users/blackdave/Projects/portfolio")
PORTFOLIO_JSON = PORTFOLIO / "portfolio.json"
IMAGE_ROOTS = [PORTFOLIO / "public", PORTFOLIO / "images", PORTFOLIO]
OUT_DIR = Path(__file__).resolve().parent.parent
CATALOG_OUT = OUT_DIR / "data" / "catalog.json"
ART_OUT = OUT_DIR / "public" / "art"

PRD_COLLECTIONS = {
    "Unique",
    "BlackDave.io 001",
    "BlackDave.io 002",
    "Manga Tears!",
    "Sound",
    "Catalog",
    "Flips!",
    "Rarible",
    "Collabs",
    "Manga Quotes",
    "Glass",
    "Supercollector",
}

OPENSEA_SHARED = "0x495f947276749ce646f68ac8c248420045cb7b5e"
MINT_SONGS = "0x2b5426a5b98a3e366230eba9f95a24f09ae4a584"
RARIBLE_1155 = "0x60f80121c31a0d46b5279700f9df786054aa5ee5"
RARIBLE_721 = "0xd07dc4262bcdbf85190c01c996b4c06a461d2430"
MANGA_QUOTES = "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba"
BLACK_DAVE_TOKEN = "0xafd17cb86d7cd086fc720365e873469ebcb103da"
CREATOR = "ed22bb0106c24c7f6b4d8aae33639e1467061f64"

SUPERCOLLECTOR_CHRONICLES = "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069"
SUPERCOLLECTOR_STAY_GOLD = "0x97312325fda573f8ba5cb4160130631d0d823892"
SUPERCOLLECTOR_UNREQUITED = "0x7cb50113f54d12ca5146e57b193d7a6c53722060"
SUPERCOLLECTOR_WORD_ASSOCIATION = "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba"
SUPERCOLLECTOR_SS23 = "0xedd6b208c35281554caa71b44f7f3842295b07ab"
SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT = "0x761fc1fa3935c9f8166147e2fe428ef54943b853"
SUPERCOLLECTOR_ABANDONED_MECH = "0x371aa2d25d138b99e1f30bc2a4852f9fa7882c2f"

SUPERCOLLECTOR_BY_SLUG = {
    "chronicles-black-dave": SUPERCOLLECTOR_CHRONICLES,
    "stay-gold-black-dave": SUPERCOLLECTOR_STAY_GOLD,
    "unrequited-black-dave": SUPERCOLLECTOR_UNREQUITED,
    "word-association-black-dave": SUPERCOLLECTOR_WORD_ASSOCIATION,
    "ss23-black-dave": SUPERCOLLECTOR_SS23,
    "aspiring-gundam-pilot-black-dave-mk2": SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
    "that-time-i-found-an-abandoned-mech-and-it-turned-out-to-be-a-gundam-and-i-became-the-greatest-pilot-in-the-universe-black-dave-mk2": SUPERCOLLECTOR_ABANDONED_MECH,
}

RESOLVED_CONTRACTS = {
    OPENSEA_SHARED,
    MINT_SONGS,
    RARIBLE_1155,
    RARIBLE_721,
    MANGA_QUOTES,
    BLACK_DAVE_TOKEN,
    SUPERCOLLECTOR_CHRONICLES,
    SUPERCOLLECTOR_STAY_GOLD,
    SUPERCOLLECTOR_UNREQUITED,
    SUPERCOLLECTOR_WORD_ASSOCIATION,
    SUPERCOLLECTOR_SS23,
    SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
    SUPERCOLLECTOR_ABANDONED_MECH,
}

TOKEN_ALLOWLIST = {
    (MINT_SONGS, "36"),
    (RARIBLE_1155, "1013003"),
    (RARIBLE_721, "101845"),
    (MANGA_QUOTES, "1"),
}

CHAIN_BY_CONTRACT = {
    OPENSEA_SHARED: "ethereum",
    MINT_SONGS: "ethereum",
    RARIBLE_1155: "ethereum",
    RARIBLE_721: "ethereum",
    MANGA_QUOTES: "polygon",
    BLACK_DAVE_TOKEN: "ethereum",
    SUPERCOLLECTOR_CHRONICLES: "optimism",
    SUPERCOLLECTOR_STAY_GOLD: "optimism",
    SUPERCOLLECTOR_UNREQUITED: "optimism",
    SUPERCOLLECTOR_WORD_ASSOCIATION: "optimism",
    SUPERCOLLECTOR_SS23: "optimism",
    SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT: "optimism",
    SUPERCOLLECTOR_ABANDONED_MECH: "optimism",
}


def first_url(item: dict) -> str:
    for link in item.get("links") or []:
        url = link.get("url")
        if url:
            return url
    return ""


def parse_opensea(url: str) -> tuple[str, str, str] | None:
    m = re.search(r"opensea\.io/assets/([^/]+)/([^/]+)/([^/?#]+)", url)
    if not m:
        return None
    return m.group(1), m.group(2).lower(), m.group(3)


def parse_rarible(url: str) -> tuple[str, str] | None:
    m = re.search(r"rarible\.com/token/(0x[a-fA-F0-9]+):(\d+)", url)
    if not m:
        return None
    return m.group(1).lower(), m.group(2)


def decode_opensea(token_id: str) -> dict[str, object]:
    hex_ = f"{int(token_id):064x}"
    return {
        "creator": "0x" + hex_[:40],
        "index": int(hex_[40:54], 16),
        "supply": int(hex_[54:64], 16),
    }


def infer_platform(url: str, contract: str | None, collection: str) -> str:
    if contract == MINT_SONGS:
        return "Mint Songs"
    if contract == BLACK_DAVE_TOKEN:
        return "$BLKD"
    if "factory.mintsongs.com" in url:
        return "Mint Songs Factory"
    if "sound.xyz" in url:
        return "Sound.xyz"
    if "catalog.works" in url:
        return "Catalog"
    if "rarible.com" in url:
        return "Rarible"
    if "foundation.app" in url:
        return "Foundation"
    if "glass.xyz" in url:
        return "Glass"
    if "manifold.xyz" in url:
        return "Manifold"
    if "unique.one" in url or "uniqueone" in url:
        return "Unique One"
    if "supercollector" in url:
        return "Supercollector"
    if "opensea.io" in url:
        return "Opensea"
    if "token.blackdave.xyz" in url:
        return "$BLKD"
    if collection == "Sound":
        return "Sound.xyz"
    if collection == "Catalog":
        return "Catalog"
    if collection == "Glass":
        return "Glass"
    if collection == "Rarible":
        return "Rarible"
    if collection == "Supercollector":
        return "Supercollector"
    if collection in {"Flips!", "BlackDave.io 001", "BlackDave.io 002", "Manga Tears!"}:
        return "Opensea"
    return "Opensea"


def infer_collection(item: dict, platform: str, title: str) -> str:
    col = (item.get("collection") or "").strip()
    if col:
        return col
    if title.lower() == "black dave token" or platform == "$BLKD":
        return "Black Dave Token"
    if platform in {"Mint Songs", "Mint Songs Factory"}:
        return "Unique"
    if platform == "Glass":
        return "Glass"
    return "Unique"


def infer_medium(item: dict) -> list[str]:
    tags = [t.lower() for t in (item.get("tags") or [])]
    cats = [c.lower() for c in (item.get("category") or [])]
    blob = set(tags + cats)
    media: list[str] = []
    if "music" in blob or "sound" in blob or "catalog" in blob:
        media.append("Audio")
    if "video" in blob:
        media.append("Video")
    if "art" in blob or "artwork" in blob:
        media.append("2D Artwork")
    if not media:
        media.append("2D Artwork")
    # preserve order, drop dupes
    seen: set[str] = set()
    out: list[str] = []
    for m in media:
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out


def find_image(rel: str) -> Path | None:
    if not rel:
        return None
    rel = rel.lstrip("/")
    candidates = [
        PORTFOLIO / "public" / rel,
        PORTFOLIO / rel,
        PORTFOLIO / "images" / Path(rel).name,
        PORTFOLIO / "public" / "images" / Path(rel).name,
    ]
    for c in candidates:
        if c.is_file():
            return c
    name = Path(rel).name.lower()
    for root in (PORTFOLIO / "public" / "images", PORTFOLIO / "images"):
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.is_file() and p.name.lower() == name:
                return p
    return None


def make_id(item: dict, contract: str | None, token_id: str | None) -> str:
    if contract == OPENSEA_SHARED and token_id:
        decoded = decode_opensea(token_id)
        return f"bd-os-{int(decoded['index']):03d}"
    slug = item.get("id") or item.get("title", "work")
    slug = re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-")
    return f"bd-{slug}"[:80]


def is_resolved(contract: str | None, token_id: str | None) -> bool:
    if not contract or contract not in RESOLVED_CONTRACTS:
        return False
    if contract == OPENSEA_SHARED and token_id:
        decoded = decode_opensea(token_id)
        return decoded["creator"] == f"0x{CREATOR}"
    if contract in {MINT_SONGS, RARIBLE_1155, RARIBLE_721, MANGA_QUOTES}:
        return token_id is not None and (contract, token_id) in TOKEN_ALLOWLIST
    if contract == BLACK_DAVE_TOKEN:
        return True
    return True


def copy_art(src: Path | None, work_id: str) -> str:
    ART_OUT.mkdir(parents=True, exist_ok=True)
    if src is None:
        return ""
    ext = src.suffix.lower() or ".jpg"
    dest_name = f"{work_id}{ext}"
    dest = ART_OUT / dest_name
    shutil.copy2(src, dest)
    return f"/art/{dest_name}"


def main() -> None:
    items = json.loads(PORTFOLIO_JSON.read_text())["portfolio"]
    selected = [
        i
        for i in items
        if i.get("type") == "nft" or i.get("collection") in PRD_COLLECTIONS
    ]

    works = []
    missing_art = []
    for item in selected:
        url = first_url(item)
        chain = None
        contract = None
        token_id = None

        os_parsed = parse_opensea(url)
        if os_parsed:
            chain, contract, token_id = os_parsed
            if chain == "matic":
                chain = "polygon"
        else:
            rar = parse_rarible(url)
            if rar:
                contract, token_id = rar
                chain = "ethereum"
            elif "token.blackdave.xyz" in url:
                contract = BLACK_DAVE_TOKEN
                chain = "ethereum"
                token_id = "1"
            elif "supercollector" in url:
                for slug, addr in SUPERCOLLECTOR_BY_SLUG.items():
                    if slug in url:
                        contract = addr
                        chain = "optimism"
                        token_id = "1"
                        break
            elif "polygon" in url and MANGA_QUOTES in url.lower():
                contract = MANGA_QUOTES
                chain = "polygon"
                token_id = "1"

        if contract:
            contract = contract.lower()
            chain = chain or CHAIN_BY_CONTRACT.get(contract)

        title = item["title"]
        platform = infer_platform(url, contract, item.get("collection") or "")
        collection = infer_collection(item, platform, title)
        work_id = make_id(item, contract, token_id)

        src = find_image(item.get("image") or "")
        artwork = copy_art(src, work_id)
        if not artwork:
            missing_art.append(title)

        availability = item.get("availability") or ""
        if title.lower() == "black dave token" and not availability:
            availability = "Always On"

        works.append(
            {
                "id": work_id,
                "title": title,
                "collection": collection,
                "platform": platform,
                "medium": infer_medium(item),
                "editions": None,
                "priceEth": None,
                "mintDate": item.get("date") or f"{item.get('year', 2021)}-01-01",
                "availability": availability,
                "artwork": artwork,
                "externalUrl": url or "",
                "chain": chain,
                "contract": contract,
                "tokenId": token_id,
                "resolved": is_resolved(contract, token_id),
            }
        )

    # Catalog numbers: chronological, then title. FAC-style BD-NNN.
    works.sort(key=lambda w: (w["mintDate"], w["title"]))
    for i, work in enumerate(works, start=1):
        work["catalogNumber"] = f"BD-{i:03d}"

    CATALOG_OUT.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_OUT.write_text(json.dumps(works, indent=2) + "\n")
    resolved = sum(1 for w in works if w["resolved"])
    vault = sum(1 for w in works if w["availability"] in {"Unsold", "Always On"})
    print(f"wrote {len(works)} works, {resolved} resolved, {vault} vault")
    print(f"missing artwork: {missing_art}")
    print(f"art files: {len(list(ART_OUT.glob('*')))}")


if __name__ == "__main__":
    main()
