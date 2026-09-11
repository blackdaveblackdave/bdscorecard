import { notFound } from "next/navigation";
import { CatalogIndex } from "@/components/CatalogIndex";
import { Scorecard } from "@/components/Scorecard";
import { Vault } from "@/components/Vault";
import { getCatalog, getVaultWorks } from "@/lib/catalog";
import {
  getHoldings,
  heldWorksFromHoldings,
  resolveCollectorId,
} from "@/lib/holdings";
import { score } from "@/lib/score";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const decoded = decodeURIComponent(address);
  const resolved = await resolveCollectorId(decoded);
  if (!resolved) notFound();
  return {
    title: `Collector ${decoded}`,
    description: `Black Dave holdings for ${decoded}`,
  };
}

export default async function CollectorPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: raw } = await params;
  const decoded = decodeURIComponent(raw);
  const address = await resolveCollectorId(decoded);
  if (!address) notFound();

  const catalog = getCatalog();
  const holdings = await getHoldings(address);
  const heldWorks = heldWorksFromHoldings(holdings);
  const result = score(heldWorks);
  const uncatalogued = heldWorks.filter((work) => work.title === "Uncatalogued Work");
  const indexWorks =
    uncatalogued.length > 0 ? [...catalog, ...uncatalogued] : catalog;

  return (
    <>
      <Scorecard
        address={address}
        displayName={decoded}
        result={result}
        heldCount={heldWorks.length}
        catalogCount={catalog.length}
        uncataloguedCount={uncatalogued.length}
      />
      <CatalogIndex
        works={indexWorks}
        heldIds={heldWorks.map((work) => work.id)}
        mode="scorecard"
        foldable
      />
      <Vault works={getVaultWorks()} foldable />
    </>
  );
}
