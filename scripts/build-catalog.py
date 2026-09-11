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
CATALOG_ZORA = "0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7"
CATALOG_RECORD = "0x0bc2a24ce568dad89691116d5b34deb6c203f342"
SOUND_ARTIST = "0xab80184b3bba02e975b6494d570232fb6c6973f1"
CALM_DOWN = "0x1a5d314beed6e39fd152cf54d3671ad33fdccf9a"
TWO_YEARS_CODA = "0x4c537c0ec793632a4feaaffc200e35a67a983904"
FOUNDATION = "0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"
UNIQUE_ONE = "0x0f864e29b01a72247b6795cc6054afeb53ef35ef"
MANGA_TEARS_022 = "0x0e9e8d517878a1ff9425ee12762ab183e07aacc2"
OH_YES = "0x446671f87ff72109ed1496740c90a9ceed767d70"
MINT_SONGS_FACTORY = "0xc29cbe04ae322469dc077741afa2fbccda748ae4"
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


def sound_token_id(edition: int, serial: int = 1) -> str:
    if edition == 1:
        return str(serial)
    return str((edition << 128) + serial)

SUPERCOLLECTOR_BY_SLUG = {
    "chronicles-black-dave": SUPERCOLLECTOR_CHRONICLES,
    "stay-gold-black-dave": SUPERCOLLECTOR_STAY_GOLD,
    "unrequited-black-dave": SUPERCOLLECTOR_UNREQUITED,
    "word-association-black-dave": SUPERCOLLECTOR_WORD_ASSOCIATION,
    "ss23-black-dave": SUPERCOLLECTOR_SS23,
    "aspiring-gundam-pilot-black-dave-mk2": SUPERCOLLECTOR_ASPIRING_GUNDAM_PILOT,
    "that-time-i-found-an-abandoned-mech-and-it-turned-out-to-be-a-gundam-and-i-became-the-greatest-pilot-in-the-universe-black-dave-mk2": SUPERCOLLECTOR_ABANDONED_MECH,
}

CATALOG_BY_SLUG = {
    "blackdave/sharp": (CATALOG_ZORA, "6063"),
    "blackdave/middlemen-feat-monday-rome-fortune-": (CATALOG_ZORA, "8141"),
    "musebymonday/band-of-the-hawk": (CATALOG_ZORA, "10002"),
    "musebymonday/red-eye": (CATALOG_ZORA, "10003"),
    "musebymonday/sajin": (CATALOG_ZORA, "10004"),
    "blackdave/newtype-poetry": (CATALOG_RECORD, "825"),
    "blackdave/back-on-my-bullshit": (CATALOG_RECORD, "892"),
}

SOUND_BY_SLUG = {
    "blackdave/triple-beam": (SOUND_ARTIST, sound_token_id(1)),
    "blackdave/what-the-fuck": (SOUND_ARTIST, sound_token_id(2)),
    "blackdave/soundxyz-w-titandemonbane": (SOUND_ARTIST, sound_token_id(3)),
    "blackdave/bag": (BAG, "1"),
    "blackdave/me-too": (ME_TOO, "1"),
    "blackdave/i-love-this-shit-feat-stonez-the-organic": (I_LOVE_THIS_SHIT, "1"),
    "blackdave/advice": (ADVICE, "1"),
    "blackdave/lavender": (LAVENDER, "1"),
    "noise/feel-good": (FEEL_GOOD, "1"),
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
    CATALOG_ZORA,
    CATALOG_RECORD,
    SOUND_ARTIST,
    CALM_DOWN,
    TWO_YEARS_CODA,
    FOUNDATION,
    UNIQUE_ONE,
    MANGA_TEARS_022,
    OH_YES,
    MINT_SONGS_FACTORY,
    YARDS,
    ITEM_BOX,
    WAVROOM,
    THREE_PERCENT,
    I_HAVE_IDEAS,
    ME_TOO,
    ADVICE,
    I_LOVE_THIS_SHIT,
    BAG,
    LAVENDER,
    FEEL_GOOD,
}

TOKEN_ALLOWLIST = {
    (MINT_SONGS, "36"),
    (RARIBLE_1155, "1013003"),
    (RARIBLE_721, "101845"),
    (MANGA_QUOTES, "1"),
    (FOUNDATION, "28958"),
    (FOUNDATION, "89599"),
    (UNIQUE_ONE, "1739"),
    (UNIQUE_ONE, "1740"),
    (MANGA_TEARS_022, "1"),
    (MINT_SONGS_FACTORY, "47618"),
    (MINT_SONGS_FACTORY, "47619"),
    (MINT_SONGS_FACTORY, "47620"),
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
    CATALOG_ZORA: "ethereum",
    CATALOG_RECORD: "ethereum",
    SOUND_ARTIST: "ethereum",
    CALM_DOWN: "ethereum",
    TWO_YEARS_CODA: "ethereum",
    FOUNDATION: "ethereum",
    UNIQUE_ONE: "ethereum",
    MANGA_TEARS_022: "polygon",
    OH_YES: "ethereum",
    MINT_SONGS_FACTORY: "polygon",
    YARDS: "base",
    ITEM_BOX: "base",
    WAVROOM: "ethereum",
    THREE_PERCENT: "base",
    I_HAVE_IDEAS: "optimism",
    ME_TOO: "ethereum",
    ADVICE: "ethereum",
    I_LOVE_THIS_SHIT: "ethereum",
    BAG: "ethereum",
    LAVENDER: "ethereum",
    FEEL_GOOD: "ethereum",
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
    if contract in {
        MINT_SONGS,
        RARIBLE_1155,
        RARIBLE_721,
        MANGA_QUOTES,
        FOUNDATION,
        UNIQUE_ONE,
        MANGA_TEARS_022,
        MINT_SONGS_FACTORY,
    }:
        return token_id is not None and (contract, token_id) in TOKEN_ALLOWLIST
    if contract == OH_YES:
        try:
            tid = int(token_id or "")
        except ValueError:
            return False
        return 2 <= tid <= 13
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
            elif "catalog.works" in url:
                for slug, (addr, tid) in CATALOG_BY_SLUG.items():
                    if slug in url:
                        contract = addr
                        chain = "ethereum"
                        token_id = tid
                        break
            elif "sound.xyz" in url:
                for slug, (addr, tid) in SOUND_BY_SLUG.items():
                    if slug in url:
                        contract = addr
                        chain = "ethereum"
                        token_id = tid
                        break
            elif "2years.blackdave.xyz" in url:
                contract = TWO_YEARS_CODA
                chain = "ethereum"
                token_id = "0"
            elif "foundation.app" in url:
                m = re.search(r"foundation\.app/[^/]+/foundation/(\d+)", url)
                if m:
                    contract = FOUNDATION
                    chain = "ethereum"
                    token_id = m.group(1)
            elif "manifold.xyz/c/blackdaveohyes" in url:
                contract = OH_YES
                chain = "ethereum"
                token_id = "2"
            elif "factory.mintsongs.com/songs/" in url:
                m = re.search(r"factory\.mintsongs\.com/songs/(\d+)", url)
                factory_tokens = {"5424": "47618", "5425": "47619", "5426": "47620"}
                if m and m.group(1) in factory_tokens:
                    contract = MINT_SONGS_FACTORY
                    chain = "polygon"
                    token_id = factory_tokens[m.group(1)]
            elif "polygon" in url and MANGA_QUOTES in url.lower():
                contract = MANGA_QUOTES
                chain = "polygon"
                token_id = "1"
            elif "glass.xyz/v/2PpDFJmqlVJGkZKDNvsv48jN4xeu7ssF6Mo2VoTea2w=" in url:
                contract = WAVROOM
                chain = "ethereum"
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
