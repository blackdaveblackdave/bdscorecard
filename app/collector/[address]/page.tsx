import { notFound } from "next/navigation";
import { CatalogIndex } from "@/components/CatalogIndex";
import { Scorecard } from "@/components/Scorecard";
import { Vault } from "@/components/Vault";
import { getCatalog, getVaultWorks } from "@/lib/catalog";
import {
  getHoldings,
  heldWorksFromHoldings,
  indexerConfigured,
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
  const vault = getVaultWorks();
  const configured = indexerConfigured();
  const holdings = configured
    ? await getHoldings(address)
    : { address, held: [] };
  const heldWorks = heldWorksFromHoldings(holdings);
  const result = score(heldWorks);
  const heldIds = new Set(
    heldWorks.filter((work) => work.title !== "Uncatalogued Work").map((work) => work.id),
  );
  const uncatalogued = heldWorks.filter((work) => work.title === "Uncatalogued Work");

  return (
    <>
      <Scorecard
        address={address}
        displayName={decoded}
        result={result}
        heldCount={heldWorks.length}
        catalogCount={catalog.length}
        indexerConfigured={configured}
        uncataloguedCount={uncatalogued.length}
      />
      <CatalogIndex works={catalog} heldIds={[...heldIds]} mode="scorecard" />
      <Vault works={vault} />
    </>
  );
}
