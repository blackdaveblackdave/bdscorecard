#!/usr/bin/env python3
"""Build data/catalog.json from the nft.blackdave.xyz Notion export."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "data" / "notion-export.json"
CATALOG = ROOT / "data" / "catalog.json"
EXTRA_CATALOG = ROOT / "data" / "extra-catalog.json"
ART = ROOT / "public" / "art"

OPENSEA_SHARED = "0x495f947276749ce646f68ac8c248420045cb7b5e"
BLACK_DAVE_TOKEN = "0xafd17cb86d7cd086fc720365e873469ebcb103da"
MANGA_QUOTES = "0x6af27cc1098685f8e3937237a43a0eeea2ce90ba"

SUPERCOLLECTOR_RELEASES = {
    "5e0353b6-8da7-4126-b8a9-b28be0c4caf3": {
        "contract": "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069",
        "chain": "optimism",
        "tokenId": "1",
    },
    "2cd86d1a-bf64-4c14-be75-d6774baef379": {
        "contract": "0x97312325fda573f8ba5cb4160130631d0d823892",
        "chain": "optimism",
        "tokenId": "1",
    },
    "eba1ac23-8917-47a0-90be-0ab2bac22827": {
        "contract": "0x7cb50113f54d12ca5146e57b193d7a6c53722060",
        "chain": "optimism",
        "tokenId": "1",
    },
    "044c2024-cacc-4352-b2ba-20bb5aa7ebad": {
        "contract": "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba",
        "chain": "optimism",
        "tokenId": "1",
    },
}

SUPERCOLLECTOR_BY_SLUG = {
    "chronicles-black-dave": SUPERCOLLECTOR_RELEASES["5e0353b6-8da7-4126-b8a9-b28be0c4caf3"],
    "stay-gold-black-dave": SUPERCOLLECTOR_RELEASES["2cd86d1a-bf64-4c14-be75-d6774baef379"],
    "unrequited-black-dave": SUPERCOLLECTOR_RELEASES["eba1ac23-8917-47a0-90be-0ab2bac22827"],
    "word-association-black-dave": SUPERCOLLECTOR_RELEASES["044c2024-cacc-4352-b2ba-20bb5aa7ebad"],
    "ss23-black-dave": {
        "contract": "0xedd6b208c35281554caa71b44f7f3842295b07ab",
        "chain": "optimism",
        "tokenId": "1",
    },
    "aspiring-gundam-pilot-black-dave-mk2": {
        "contract": "0x761fc1fa3935c9f8166147e2fe428ef54943b853",
        "chain": "optimism",
        "tokenId": "1",
    },
    "that-time-i-found-an-abandoned-mech-and-it-turned-out-to-be-a-gundam-and-i-became-the-greatest-pilot-in-the-universe-black-dave-mk2": {
        "contract": "0x371aa2d25d138b99e1f30bc2a4852f9fa7882c2f",
        "chain": "optimism",
        "tokenId": "1",
    },
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("’", "'").replace("‘", "'")
    s = re.sub(r"\([^)]*supercollector[^)]*\)", "", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def slug(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (title or "work").lower()).strip("-")
    return s[:72] or "work"


def make_id(row: dict) -> str:
    if row.get("contract") == OPENSEA_SHARED and row.get("openSeaIndex") is not None:
        return f"bd-os-{int(row['openSeaIndex']):03d}"
    if (row.get("title") or "").lower() == "black dave token":
        return "bd-black-dave-token"
    return f"bd-{slug(row.get('title') or row['notionId'][:8])}"


def art_exists(rel: str) -> bool:
    if not rel:
        return False
    return (ROOT / "public" / rel.lstrip("/")).is_file()


def main() -> None:
    src = json.loads(EXPORT.read_text())
    old = json.loads(CATALOG.read_text()) if CATALOG.exists() else []
    old_by_title = {w["title"].strip().lower(): w for w in old}
    old_by_norm = {norm(w["title"]): w for w in old}
    old_by_token = {
        (w["contract"].lower(), str(w["tokenId"])): w
        for w in old
        if w.get("tokenId") and w.get("contract")
    }
    art_by_norm = {norm(p.stem): p for p in ART.iterdir() if p.is_file()}

    def match_old(row: dict) -> dict | None:
        if row.get("contract") and row.get("tokenId"):
            hit = old_by_token.get((row["contract"].lower(), str(row["tokenId"])))
            if hit:
                return hit
        title = (row.get("title") or "").strip()
        if title.lower() in old_by_title:
            return old_by_title[title.lower()]
        n = norm(title)
        if n in old_by_norm:
            return old_by_norm[n]
        for k, w in old_by_norm.items():
            if n and k and (n in k or k in n) and min(len(n), len(k)) >= 8:
                return w
        return None

    def match_art_file(title: str) -> str:
        n = norm(title)
        p = art_by_norm.get(n)
        if p:
            return f"/art/{p.name}"
        for stem, path in art_by_norm.items():
            if n and stem and (n in stem or stem in n) and min(len(n), len(stem)) >= 8:
                return f"/art/{path.name}"
        return ""

    works: list[dict] = []
    skipped: list[str] = []
    for row in src["works"]:
        title = (row.get("title") or "").strip()
        if not title:
            skipped.append(row["notionId"])
            continue

        contract = row.get("contract")
        token_id = row.get("tokenId")
        chain = row.get("chain")
        resolved = bool(row.get("resolved"))

        if title.lower() == "black dave token" or (row.get("externalUrl") or "").rstrip("/").endswith(
            "token.blackdave.xyz"
        ):
            contract = BLACK_DAVE_TOKEN
            chain = "ethereum"
            token_id = token_id or "1"
            resolved = True

        if contract == MANGA_QUOTES:
            chain = "polygon"
            token_id = token_id or "1"
            resolved = True

        sc = SUPERCOLLECTOR_RELEASES.get(row.get("notionId") or "")
        if sc is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            for slug, meta in SUPERCOLLECTOR_BY_SLUG.items():
                if url.endswith("/" + slug):
                    sc = meta
                    break
        if sc:
            contract = sc["contract"]
            chain = sc["chain"]
            token_id = token_id or sc["tokenId"]
            resolved = True

        prev = match_old(row)
        artwork = ""
        if prev and art_exists(prev.get("artwork") or ""):
            artwork = prev["artwork"]
        else:
            artwork = match_art_file(title)

        collection = row.get("collection") or ""
        if not collection:
            collection = "Black Dave Token" if title.lower() == "black dave token" else "Unique"

        medium = row.get("medium") or []
        if isinstance(medium, str):
            medium = [medium]
        medium = [m for m in medium if m]
        if not medium:
            plat = (row.get("platform") or "").lower()
            medium = ["Audio"] if plat in {"sound.xyz", "catalog", "mint songs", "mint songs factory"} else ["2D Artwork"]

        availability = row.get("availability") or ""
        if title.lower() == "black dave token" and not availability:
            availability = "Always On"

        works.append(
            {
                "id": make_id(row),
                "title": title,
                "collection": collection,
                "platform": row.get("platform") or "",
                "medium": medium,
                "editions": row.get("editions"),
                "priceEth": row.get("priceEth"),
                "mintDate": row.get("mintDate") or "",
                "availability": availability,
                "artwork": artwork,
                "externalUrl": row.get("externalUrl") or "",
                "chain": chain,
                "contract": contract,
                "tokenId": None if token_id is None else str(token_id),
                "resolved": resolved,
                "notionId": row["notionId"],
            }
        )

    seen: dict[str, int] = {}
    for w in works:
        base = w["id"]
        if base in seen:
            seen[base] += 1
            w["id"] = f"{base}-{seen[base]}"
        else:
            seen[base] = 1

    if EXTRA_CATALOG.is_file():
        extras = json.loads(EXTRA_CATALOG.read_text())
        by_id = {w["id"] for w in works}
        for extra in extras:
            if extra.get("id") in by_id:
                continue
            row = dict(extra)
            artwork = row.get("artwork") or ""
            if artwork and not art_exists(artwork):
                row["artwork"] = match_art_file(row.get("title") or "")
            works.append(row)

    works.sort(key=lambda w: (w["mintDate"] or "9999-99-99", w["title"]))
    for i, w in enumerate(works, start=1):
        w["catalogNumber"] = f"BD-{i:03d}"

    CATALOG.write_text(json.dumps(works, indent=2) + "\n")
    missing = [w["title"] for w in works if not art_exists(w.get("artwork") or "")]
    print(
        "wrote",
        len(works),
        "skipped blank",
        skipped,
        "resolved",
        sum(1 for w in works if w["resolved"]),
        "vault",
        sum(1 for w in works if w["availability"] in {"Unsold", "Always On"}),
        "editions",
        sum(1 for w in works if w["editions"] is not None),
        "price",
        sum(1 for w in works if w["priceEth"] is not None),
        "missing art",
        missing,
        "availability",
        dict(Counter(w["availability"] for w in works)),
    )


if __name__ == "__main__":
    main()
