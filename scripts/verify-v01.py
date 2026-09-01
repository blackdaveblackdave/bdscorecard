#!/usr/bin/env python3
"""Check v0.1 acceptance against a running Next server. Re-runnable."""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3002"
DEAD = f"{BASE}/collector/0x000000000000000000000000000000000000dEaD"
BAD = f"{BASE}/collector/not-an-address"


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "bdscorecard-verify"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")


def fail(msg: str) -> None:
    print(f"FAIL {msg}")
    sys.exit(1)


def ok(msg: str) -> None:
    print(f"ok {msg}")


def main() -> None:
    tests = subprocess.run(["npm", "test"], check=False)
    if tests.returncode != 0:
        fail("npm test")
    ok("npm test")

    catalog = json.loads(Path("data/catalog.json").read_text())
    n = len(catalog)
    export = json.loads(Path("data/notion-export.json").read_text())
    extra_path = Path("data/extra-catalog.json")
    extras = json.loads(extra_path.read_text()) if extra_path.is_file() else []
    expected = sum(1 for row in export["works"] if str(row.get("title") or "").strip())
    expected += len(extras)
    if n != expected:
        fail(f"catalog.json has {n} works, expected {expected}")
    ok(f"catalog.json {n}")

    home_status, home = fetch(BASE)
    if home_status != 200:
        fail(f"GET / {home_status}")
    if "The complete works" not in home:
        fail("home missing headline")
    if "The Vault" in home:
        fail("home still has vault section")
    if f"{n} works" in home:
        fail("home still has catalog index")
    if home.count("Connect wallet") != 1:
        fail(f"connect count {home.count('Connect wallet')}")
    if ">Unsold<" in home:
        fail("visible Unsold label")
    if "—" in home or "–" in home:
        fail("emdash or endash on home")
    if "Application error" in home:
        fail("home error overlay")
    ok("GET /")

    works_status, works = fetch(f"{BASE}/works")
    if works_status != 200:
        fail(f"GET /works {works_status}")
    if f"{n} works" not in works:
        fail(f"works missing {n} works count")
    if "Want My Head" not in works:
        fail("works missing Want My Head")
    ok("GET /works")

    vault_status, vault = fetch(f"{BASE}/vault")
    if vault_status != 200:
        fail(f"GET /vault {vault_status}")
    if "The Vault" not in vault:
        fail("vault missing heading")
    if "Want My Head" not in vault:
        fail("vault missing Want My Head")
    if ">Unsold<" in vault:
        fail("visible Unsold label on vault")
    ok("GET /vault")

    col_status, col = fetch(DEAD)
    if col_status != 200:
        fail(f"GET collector {col_status}")
    if "Visitor" not in col:
        fail("collector missing Visitor")
    if "These works are still available to collect" in col:
        fail("collector still has vault section")
    if f"{n} works" in col:
        fail("collector still has full catalog index")
    if "Nothing in this wallet" in col or "This wallet holds" in col:
        ok("GET collector holdings copy")
    elif ".env.local" in col or "API key" in col:
        ok("GET collector indexer note")
    else:
        fail("collector missing holdings copy or indexer note")
    if "—" in col or "–" in col:
        fail("emdash on collector")
    ok("GET collector")

    bad_status, bad = fetch(BAD)
    if bad_status != 404:
        fail(f"invalid collector {bad_status}")
    if "Not a collector path" not in bad:
        fail("404 copy missing")
    ok("GET invalid collector 404")

    print("predicate met")


if __name__ == "__main__":
    main()
