import Link from "next/link";
import { notFound } from "next/navigation";
import { HeldWorks } from "@/components/HeldWorks";
import { Scorecard } from "@/components/Scorecard";
import { getCatalog } from "@/lib/catalog";
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
      <HeldWorks works={heldWorks} />
      {heldWorks.length === 0 ? (
        <section className="mx-auto flex max-w-[1400px] flex-wrap gap-3 px-4 pb-16 md:px-8 md:pb-24">
          <Link href="/works" className="btn btn-ghost whitespace-nowrap">
            Works
          </Link>
          <Link href="/vault" className="btn btn-ghost whitespace-nowrap">
            Vault
          </Link>
        </section>
      ) : null}
    </>
  );
}
