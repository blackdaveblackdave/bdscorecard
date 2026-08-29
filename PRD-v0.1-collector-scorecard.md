# PRD: Black Dave Collector Scorecard, v0.1

**Owner:** Dave Curry (blackdave.eth)
**Supersedes:** `PRD-collector-scorecard.md` and `PRD-addendum-A-evolving-pipeline.md`
**Status:** Build now

---

## 0. Scoping principle

Ship something visible in a day. Everything in this document is either buildable from data already in hand, or explicitly deferred.

Two decisions that make v0.1 small:

1. **Query holdings live, not from a snapshot.** A single indexer call on wallet connect is less code than a snapshot pipeline. Wrap it in one function, `getHoldings(address)`, so freezing to a static snapshot later is a one-file swap. Free tier covers this traffic.
2. **Score only what is already resolvable.** 59 works validate arithmetically via the OpenSea creator bits, plus four known contracts. That is roughly 63 of 96 works with zero new research.

Deferred to v0.2 and later: downloads, badge NFT, admin dashboard, snapshot freezing, the remaining ~30 contracts.

---

## 1. What this is

A site that shows the complete Black Dave NFT catalog as one body of work, tells any connected wallet what they hold and what they missed, and puts the remaining unsold work in front of them.

It is the last thing shipped before stepping away from the music chapter, so it should read as a permanent archive, not a product.

## 2. Non-goals for v0.1

- **No downloads.** Needs audio files gathered and collab rights confirmed. v0.2.
- **No badge NFT.** Needs a stable snapshot to build an allowlist from. v0.3.
- **No admin dashboard.** Notion is the editor for now. Add columns when you need them.
- **No leaderboard.** Personal scorecards only, permanently out of scope.
- **No account system.** Wallet only. No email, no login.

---

## 3. Data you already have

### 3.1 Catalog source

Notion database `NFTs by Black Dave`, data source `collection://63d9ca68-2279-4624-b4ee-29ce74b15a3c`.

96 rows. Fields: `Name`, `Link`, `Platform`, `Collection`, `Availability`, `Editions`, `Price in ETH`, `Date Minted`, `Media`, `Media Type`.

- `Availability`: `Unsold`, `Sold Out`, `Always On`. About 23 rows are Unsold or Always On, which is the vault.
- `Collection`: Unique, BlackDave.io 001, BlackDave.io 002, Manga Tears!, Sound, Catalog, Flips!, Rarible, Collabs, Manga Quotes, Glass, Supercollector
- `Platform`: Foundation, Sound.xyz, $BLKD, Catalog, Mint Songs, Mint Songs Factory, Opensea, Rarible, Unique One, Cargo, Glass, Supercollector, Manifold
- Date range: 2020-12-19 to 2023-07-15

Export once to `data/catalog.json`. The site never calls Notion at runtime.

### 3.2 Resolved contracts

| Address | Chain | Contents | Works |
|---|---|---|---|
| `0x495f947276749ce646f68ac8c248420045cb7b5e` | ethereum | OpenSea Shared Storefront: Flips!, BlackDave.io 001, BlackDave.io 002 | 59 |
| `0x2b5426a5b98a3e366230eba9f95a24f09ae4a584` | ethereum | Mint Songs, token `36` | 1 |
| `0x60f80121c31a0d46b5279700f9df786054aa5ee5` | ethereum | Rarible ERC-1155, token `1013003` | 1 |
| `0xd07dc4262bcdbf85190c01c996b4c06a461d2430` | ethereum | Rarible ERC-721, token `101845` | 1 |
| `0x6af27cc1098685f8e3937237a43a0eeea2ce90ba` | polygon | Manga Quotes, token `1` | 1 |

### 3.3 The OpenSea rule

The Shared Storefront is multi-tenant, so contract ownership proves nothing. But the creator address is encoded in the top 160 bits of every token ID, so validation is arithmetic and needs no allowlist:

```ts
const CREATOR = 0xed22bb0106c24c7f6b4d8aae33639e1467061f64n;

export function isBlackDaveOpenSeaToken(tokenId: string | bigint): boolean {
  return (BigInt(tokenId) >> 96n) === CREATOR;
}

// remaining bits decode as:
export function decodeOpenSeaToken(tokenId: string | bigint) {
  const hex = BigInt(tokenId).toString(16).padStart(64, "0");
  return {
    creator: "0x" + hex.slice(0, 40),
    index: parseInt(hex.slice(40, 54), 16),   // 0 to 59, one gap at 21
    supply: parseInt(hex.slice(54, 64), 16),
  };
}
```

Rarible and Mint Songs use explicit token ID allowlists. Everything else in section 3.2 is a dedicated contract where the address alone is sufficient.

### 3.4 Known gap

OpenSea index `21` is an uncatalogued mint from late March 2021, sitting between Manga Tears 004 and 005. If a wallet holds a token whose creator bits match but whose index is not in the catalog, count it and label it "Uncatalogued Work". Do not drop it.

---

## 4. Catalog schema

```json
{
  "id": "bd-os-017",
  "title": "Manga Tears 001",
  "collection": "BlackDave.io 001",
  "platform": "Opensea",
  "medium": ["2D Artwork"],
  "editions": 1,
  "priceEth": 0.05,
  "mintDate": "2021-03-26",
  "availability": "Sold Out",
  "artwork": "/art/bd-os-017.jpg",
  "externalUrl": "https://opensea.io/assets/ethereum/0x495f.../1072...",
  "chain": "ethereum",
  "contract": "0x495f947276749ce646f68ac8c248420045cb7b5e",
  "tokenId": "107259508568675199262418313251991622091448984144640299147874399518015239487489",
  "resolved": true
}
```

`resolved: false` rows render in the catalog but cannot be scored. That is expected and fine. Show them.

Store `tokenId` as a string. These exceed `Number.MAX_SAFE_INTEGER` by a wide margin.

---

## 5. Milestones

### M0: Catalog page, no wallet (target: one evening)

The whole catalog as a typeset index. No wallet code, no chain calls, no API keys.

- [ ] Notion exported to `data/catalog.json`, artwork pulled locally
- [ ] All 96 works render with title, collection, platform, edition size, mint date, artwork
- [ ] Filter by collection, medium, availability
- [ ] Deployed to Vercel

**This is the "something to see" milestone.** Ship it before writing a line of wallet code.

### M1: Wallet connect and scorecard (target: one day)

- [ ] Connect via wagmi + viem, read-only
- [ ] `getHoldings(address)` returns owned works, live query, one indexer call per chain
- [ ] Score and tier computed and displayed
- [ ] Held works render solid, unheld dimmed, in the same index from M0
- [ ] Zero state: a wallet holding nothing gets a real page with the catalog and the vault, never a bare zero or an error
- [ ] `/collector/<address>` and `/collector/<ens>` load without connecting a wallet

### M2: The Vault

- [ ] All `Unsold` and `Always On` works in one section, about 23 items
- [ ] Never labeled "unsold". Use Vault, Still Open, or Available.
- [ ] Appears below every scorecard including the zero state
- [ ] Each item links to its live mint or listing page

---

## 6. Scoring, v0.1

Deliberately provisional. Isolate in `lib/score.ts` and expect to rewrite it after seeing real distribution.

```ts
export function score(held: Work[]) {
  const collections = new Set(held.map(w => w.collection));
  const media = new Set(held.flatMap(w => w.medium));

  const byCollection = new Map<string, number>();
  for (const w of held) {
    byCollection.set(w.collection, (byCollection.get(w.collection) ?? 0) + 1);
  }

  const breadth = 10 * collections.size;
  const depth = [...byCollection.values()]
    .reduce((sum, n) => sum + Math.floor(3 * Math.log2(1 + n)), 0);
  const mediumBonus = 8 * media.size;

  const earliest = Math.min(...held.map(w => new Date(w.mintDate).getFullYear()));
  const eraBonus = { 2020: 25, 2021: 20, 2022: 15, 2023: 10 }[earliest] ?? 5;

  return breadth + depth + mediumBonus + eraBonus;
}
```

**Why breadth over volume:** the Black Dave Token ran 1,000,000 editions at 0.00025 ETH. Any volume-weighted formula ranks one bulk buyer above someone who collected across five years. Depth is logarithmic so a second collection always beats stacking the first.

**Open decision:** whether the Black Dave Token counts at all. Simplest v0.1 answer is to treat it as its own collection worth a flat 10 and ignore quantity entirely.

Tiers, placeholder names, recalibrate after seeing real data:

| Score | Tier |
|---|---|
| 0 | Visitor |
| 1 to 29 | Listed |
| 30 to 69 | Collector |
| 70 to 129 | Archivist |
| 130+ | Custodian |

---

## 7. Design direction

Reuse the catalogue raisonné language from the retrospective: typeset, archival, museum-registry. Set in type, no chrome, no glow, no gradients, no wallet-app aesthetic, no mech or Gundam styling.

- The scorecard is a **wall label**, not a dashboard
- The catalog is a **typeset index**, held items solid, unheld dimmed
- Consider carrying the FAC-style BD catalog numbers onto each work so the site, the retrospective, and the box set share one numbering system

---

## 8. Stack

```
Next.js App Router on Vercel
├── data/catalog.json           committed, exported from Notion
├── lib/holdings.ts             getHoldings(address), the swap point
├── lib/score.ts                scoring, expect to rewrite
├── lib/opensea-tokens.ts       creator-bit decode
└── public/art/                 artwork, committed
```

- Wallet: wagmi + viem, read-only. No transactions in v0.1.
- Holdings: Alchemy `getNFTsForOwner` or Etherscan v2, filtered by the section 3.2 contracts. One key, free tier.
- Chains for v0.1: ethereum and polygon only. Add base, optimism, and zora when those contracts get resolved.
- No database. No auth. No cron.

**Keep `getHoldings` pure and swappable.** When you eventually freeze to a static snapshot, only that file changes.

---

## 9. Acceptance criteria for v0.1

- [ ] Site loads and shows all 96 works with no wallet connected
- [ ] A wallet holding OpenSea Shared Storefront tokens with matching creator bits scores correctly
- [ ] A wallet holding an unrelated 2021 OpenSea JPEG scores zero and gets the Visitor state
- [ ] A wallet holding nothing sees the catalog and vault, no error, no bare zero
- [ ] `/collector/<address>` renders for a stranger with no wallet
- [ ] The vault shows roughly 23 works, each linking somewhere live
- [ ] `resolved: false` works appear in the catalog and are excluded from scoring without breaking anything

---

## 10. Immediately after v0.1

In priority order, decided once something is live:

1. Resolve the remaining ~30 contracts using `harvest_contracts.py`, starting with Sound.xyz and Catalog
2. Music downloads via SIWE and signed URLs
3. Notion columns for `Contract`, `Chain`, `Token ID`, `Source` once hand-editing gets tedious
4. Freeze `getHoldings` to a static snapshot
5. Badge NFT, pinned to a specific dated snapshot, never to a moving one

---

## 11. Open questions

**Blocking nothing, answer as you go**

1. Does the Black Dave Token count toward score, and how?
2. Final tier names.
3. Do the FAC-style BD catalog numbers appear on the site, or stay exclusive to the retrospective and box set?
4. What is at OpenSea index 21?
