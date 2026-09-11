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
CATALOG_ZORA = "0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7"
CATALOG_RECORD = "0x0bc2a24ce568dad89691116d5b34deb6c203f342"
SOUND_ARTIST = "0xab80184b3bba02e975b6494d570232fb6c6973f1"
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

SUPERCOLLECTOR_RELEASES = {
    "5e0353b6-8da7-4126-b8a9-b28be0c4caf3": {
        "contract": "0x59dc45dffa3bf9a94f7bcddd31cfaa2a78c6d069",
        "chain": "optimism",
        "tokenId": "1",
        "mintDate": "2023-06-30",
    },
    "2cd86d1a-bf64-4c14-be75-d6774baef379": {
        "contract": "0x97312325fda573f8ba5cb4160130631d0d823892",
        "chain": "optimism",
        "tokenId": "1",
        "mintDate": "2023-06-30",
    },
    "eba1ac23-8917-47a0-90be-0ab2bac22827": {
        "contract": "0x7cb50113f54d12ca5146e57b193d7a6c53722060",
        "chain": "optimism",
        "tokenId": "1",
        "mintDate": "2023-06-30",
    },
    "044c2024-cacc-4352-b2ba-20bb5aa7ebad": {
        "contract": "0x1709e519866edf5eb1ae94fb2ef935fcf4306bba",
        "chain": "optimism",
        "tokenId": "1",
        "mintDate": "2023-06-21",
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

CATALOG_RELEASES = {
    "562b954e-6e46-4c45-a834-9dadf32cbb7a": {
        "contract": CATALOG_ZORA,
        "chain": "ethereum",
        "tokenId": "6063",
    },
    "3e383c2e-4554-4315-af5c-4e431ecc29de": {
        "contract": CATALOG_ZORA,
        "chain": "ethereum",
        "tokenId": "8141",
    },
    "9bd270bb-b86f-46ef-9b35-d153fec35d70": {
        "contract": CATALOG_ZORA,
        "chain": "ethereum",
        "tokenId": "10002",
    },
    "7452d38f-e27f-40b5-bee6-98b13bda1ab9": {
        "contract": CATALOG_ZORA,
        "chain": "ethereum",
        "tokenId": "10003",
    },
    "6157ef16-3a47-4c43-be79-6b09b115a325": {
        "contract": CATALOG_ZORA,
        "chain": "ethereum",
        "tokenId": "10004",
    },
    "7793659e-d5e1-4fab-8ae5-dc075ed15375": {
        "contract": CATALOG_RECORD,
        "chain": "ethereum",
        "tokenId": "825",
    },
    "bcd57422-eb7e-44de-a0e6-d23052c4e922": {
        "contract": CATALOG_RECORD,
        "chain": "ethereum",
        "tokenId": "892",
    },
}

CATALOG_BY_SLUG = {
    "blackdave/sharp": CATALOG_RELEASES["562b954e-6e46-4c45-a834-9dadf32cbb7a"],
    "blackdave/middlemen-feat-monday-rome-fortune-": CATALOG_RELEASES[
        "3e383c2e-4554-4315-af5c-4e431ecc29de"
    ],
    "musebymonday/band-of-the-hawk": CATALOG_RELEASES["9bd270bb-b86f-46ef-9b35-d153fec35d70"],
    "musebymonday/red-eye": CATALOG_RELEASES["7452d38f-e27f-40b5-bee6-98b13bda1ab9"],
    "musebymonday/sajin": CATALOG_RELEASES["6157ef16-3a47-4c43-be79-6b09b115a325"],
    "blackdave/newtype-poetry": CATALOG_RELEASES["7793659e-d5e1-4fab-8ae5-dc075ed15375"],
    "blackdave/back-on-my-bullshit": CATALOG_RELEASES["bcd57422-eb7e-44de-a0e6-d23052c4e922"],
}

SOUND_RELEASES = {
    "2e73be3b-15b3-4f29-9908-2bd553ab6842": {
        "contract": SOUND_ARTIST,
        "chain": "ethereum",
        "tokenId": sound_token_id(1),
    },
    "fde45583-2066-4f76-bea1-428ad5632377": {
        "contract": SOUND_ARTIST,
        "chain": "ethereum",
        "tokenId": sound_token_id(2),
    },
    "201081ae-e498-4732-917f-736a306dadab": {
        "contract": SOUND_ARTIST,
        "chain": "ethereum",
        "tokenId": sound_token_id(3),
    },
    "4bc3bdd8-2739-496d-9129-edd5fc5e6156": {  # Bag
        "contract": BAG,
        "chain": "ethereum",
        "tokenId": "1",
    },
    "d7835a4c-91fd-40b8-a6ae-d1962e3b7442": {  # Me Too
        "contract": ME_TOO,
        "chain": "ethereum",
        "tokenId": "1",
    },
    "ab72b45d-0171-4081-93d6-b2c8961daa7a": {  # I Love This Shit
        "contract": I_LOVE_THIS_SHIT,
        "chain": "ethereum",
        "tokenId": "1",
    },
    "d288feaf-2a97-47a7-9f07-6d00c7d6277c": {  # Advice
        "contract": ADVICE,
        "chain": "ethereum",
        "tokenId": "1",
    },
    "bad00be9-9e4e-4322-8329-e51f9f72ecb0": {  # Lavender
        "contract": LAVENDER,
        "chain": "ethereum",
        "tokenId": "1",
    },
    "5103a976-d2c5-4367-92b2-446cf557a305": {  # Feel Good
        "contract": FEEL_GOOD,
        "chain": "ethereum",
        "tokenId": "1",
    },
}

SOUND_BY_SLUG = {
    "blackdave/triple-beam": SOUND_RELEASES["2e73be3b-15b3-4f29-9908-2bd553ab6842"],
    "blackdave/what-the-fuck": SOUND_RELEASES["fde45583-2066-4f76-bea1-428ad5632377"],
    "blackdave/soundxyz-w-titandemonbane": SOUND_RELEASES[
        "201081ae-e498-4732-917f-736a306dadab"
    ],
    "blackdave/bag": SOUND_RELEASES["4bc3bdd8-2739-496d-9129-edd5fc5e6156"],
    "blackdave/me-too": SOUND_RELEASES["d7835a4c-91fd-40b8-a6ae-d1962e3b7442"],
    "blackdave/i-love-this-shit-feat-stonez-the-organic": SOUND_RELEASES[
        "ab72b45d-0171-4081-93d6-b2c8961daa7a"
    ],
    "blackdave/advice": SOUND_RELEASES["d288feaf-2a97-47a7-9f07-6d00c7d6277c"],
    "blackdave/lavender": SOUND_RELEASES["bad00be9-9e4e-4322-8329-e51f9f72ecb0"],
    "noise/feel-good": SOUND_RELEASES["5103a976-d2c5-4367-92b2-446cf557a305"],
}

TWO_YEARS_CODA = "0x4c537c0ec793632a4feaaffc200e35a67a983904"
CODA_RELEASES = {
    "2688c552-4b37-495b-abb6-720f4cd2afc2": {
        "contract": TWO_YEARS_CODA,
        "chain": "ethereum",
        "tokenId": "0",
    },
}
CODA_BY_HOST = {
    "2years.blackdave.xyz": CODA_RELEASES["2688c552-4b37-495b-abb6-720f4cd2afc2"],
}

FOUNDATION = "0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"
FOUNDATION_RELEASES = {
    "c05c86c6-53fc-49ef-a64b-eea2b0c82135": {
        "contract": FOUNDATION,
        "chain": "ethereum",
        "tokenId": "28958",
    },
    "a72296f6-31b6-4e74-b788-8bca448e191f": {
        "contract": FOUNDATION,
        "chain": "ethereum",
        "tokenId": "89599",
    },
}

UNIQUE_ONE = "0x0f864e29b01a72247b6795cc6054afeb53ef35ef"
UNIQUE_ONE_RELEASES = {
    "66593c7b-fdb6-45b9-a1f1-681a7da6e4df": {
        "contract": UNIQUE_ONE,
        "chain": "ethereum",
        "tokenId": "1739",
    },
}

MANGA_TEARS_022 = "0x0e9e8d517878a1ff9425ee12762ab183e07aacc2"
CARGO_RELEASES = {
    "259efa42-6c59-4b81-b84d-7791c5a0c001": {
        "contract": MANGA_TEARS_022,
        "chain": "polygon",
        "tokenId": "1",
        "externalUrl": f"https://opensea.io/assets/matic/{MANGA_TEARS_022}/1",
    },
}

OH_YES = "0x446671f87ff72109ed1496740c90a9ceed767d70"
OH_YES_RELEASES = {
    "cbab63aa-8a4c-46a1-9a11-8ee1c74705de": {
        "contract": OH_YES,
        "chain": "ethereum",
        "tokenId": "2",
    },
}

MINT_SONGS_FACTORY = "0xc29cbe04ae322469dc077741afa2fbccda748ae4"
FACTORY_RELEASES = {
    "424241ba-244c-4133-9ba3-63d97c59beb4": {  # Wolf / songs/5424
        "contract": MINT_SONGS_FACTORY,
        "chain": "polygon",
        "tokenId": "47618",
    },
    "09b514ea-2100-4f84-831f-3108d4c764c0": {  # I'm In Love With You / songs/5425
        "contract": MINT_SONGS_FACTORY,
        "chain": "polygon",
        "tokenId": "47619",
    },
    "05f9c3c2-0863-47a5-9f55-e0b395f732cd": {  # Small Streams, Strong Rivers / songs/5426
        "contract": MINT_SONGS_FACTORY,
        "chain": "polygon",
        "tokenId": "47620",
    },
}
FACTORY_BY_SONG = {
    "5424": FACTORY_RELEASES["424241ba-244c-4133-9ba3-63d97c59beb4"],
    "5425": FACTORY_RELEASES["09b514ea-2100-4f84-831f-3108d4c764c0"],
    "5426": FACTORY_RELEASES["05f9c3c2-0863-47a5-9f55-e0b395f732cd"],
}

WAVROOM = "0xadf5d2ae8a86ba35ba346444b368413e5e7a8fc3"
GLASS_RELEASES = {
    "8aa1ba6f-4ffe-4f4f-a9c1-c163b2fe86e6": {
        "contract": WAVROOM,
        "chain": "ethereum",
        "tokenId": "1",
    },
}
GLASS_BY_SLUG = {
    "2PpDFJmqlVJGkZKDNvsv48jN4xeu7ssF6Mo2VoTea2w=": GLASS_RELEASES[
        "8aa1ba6f-4ffe-4f4f-a9c1-c163b2fe86e6"
    ],
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
        external_url = row.get("externalUrl") or ""

        mint_date = row.get("mintDate") or ""

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
            mint_date = sc.get("mintDate") or mint_date

        cat = CATALOG_RELEASES.get(row.get("notionId") or "")
        if cat is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            for slug, meta in CATALOG_BY_SLUG.items():
                if url.endswith("/" + slug):
                    cat = meta
                    break
        if cat:
            contract = cat["contract"]
            chain = cat["chain"]
            token_id = token_id or cat["tokenId"]
            resolved = True

        snd = SOUND_RELEASES.get(row.get("notionId") or "")
        if snd is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            for slug, meta in SOUND_BY_SLUG.items():
                if url.endswith("/" + slug):
                    snd = meta
                    break
        if snd:
            contract = snd["contract"]
            chain = snd["chain"]
            token_id = token_id or snd["tokenId"]
            resolved = True

        coda = CODA_RELEASES.get(row.get("notionId") or "")
        if coda is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            for host, meta in CODA_BY_HOST.items():
                if host in url:
                    coda = meta
                    break
        if coda:
            contract = coda["contract"]
            chain = coda["chain"]
            token_id = token_id or coda["tokenId"]
            resolved = True

        fnd = FOUNDATION_RELEASES.get(row.get("notionId") or "")
        if fnd is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            m = re.search(r"foundation\.app/[^/]+/foundation/(\d+)$", url)
            if m:
                fnd = {"contract": FOUNDATION, "chain": "ethereum", "tokenId": m.group(1)}
        if fnd:
            contract = fnd["contract"]
            chain = fnd["chain"]
            token_id = token_id or fnd["tokenId"]
            resolved = True

        uone = UNIQUE_ONE_RELEASES.get(row.get("notionId") or "")
        if uone:
            contract = uone["contract"]
            chain = uone["chain"]
            token_id = token_id or uone["tokenId"]
            resolved = True

        cargo = CARGO_RELEASES.get(row.get("notionId") or "")
        if cargo:
            contract = cargo["contract"]
            chain = cargo["chain"]
            token_id = cargo["tokenId"]
            resolved = True
            external_url = external_url or cargo.get("externalUrl") or ""

        oh = OH_YES_RELEASES.get(row.get("notionId") or "")
        if oh is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            if url.endswith("/blackdaveohyes") or "manifold.xyz/c/blackdaveohyes" in url:
                oh = OH_YES_RELEASES["cbab63aa-8a4c-46a1-9a11-8ee1c74705de"]
        if oh:
            contract = oh["contract"]
            chain = oh["chain"]
            token_id = token_id or oh["tokenId"]
            resolved = True

        fac = FACTORY_RELEASES.get(row.get("notionId") or "")
        if fac is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            m = re.search(r"factory\.mintsongs\.com/songs/(\d+)$", url)
            if m:
                fac = FACTORY_BY_SONG.get(m.group(1))
        if fac:
            contract = fac["contract"]
            chain = fac["chain"]
            token_id = token_id or fac["tokenId"]
            resolved = True

        glass = GLASS_RELEASES.get(row.get("notionId") or "")
        if glass is None:
            url = (row.get("externalUrl") or "").rstrip("/")
            for slug, meta in GLASS_BY_SLUG.items():
                if slug in url:
                    glass = meta
                    break
        if glass:
            contract = glass["contract"]
            chain = glass["chain"]
            token_id = token_id or glass["tokenId"]
            resolved = True

        prev = match_old(row)
        if not (contract and token_id) and prev and prev.get("contract") and prev.get("tokenId"):
            contract = prev["contract"]
            token_id = prev["tokenId"]
            chain = prev.get("chain") or chain
            resolved = True

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
                "mintDate": mint_date,
                "availability": availability,
                "artwork": artwork,
                "externalUrl": external_url,
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
