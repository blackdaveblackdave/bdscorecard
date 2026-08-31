import { WorkTile } from "@/components/WorkTile";
import type { Work } from "@/lib/types";

export function HeldWorks(props: { works: Work[] }) {
  const { works } = props;
  if (works.length === 0) return null;

  const catalogued = works.filter((work) => work.title !== "Uncatalogued Work");
  const uncatalogued = works.filter((work) => work.title === "Uncatalogued Work");
  const countLabel =
    catalogued.length === 1 ? "1 work" : `${catalogued.length} works`;

  return (
    <section
      id="held"
      className="scroll-mt-24 mx-auto w-full max-w-[1400px] px-4 pb-16 md:px-8 md:pb-24"
    >
      <h2 className="text-3xl tracking-tighter text-foreground md:text-4xl">
        Held
      </h2>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
        {catalogued.length > 0
          ? `What this wallet holds from the catalog. ${countLabel}.`
          : "No catalogued works in this wallet."}
        {uncatalogued.length === 1
          ? " One uncatalogued token is listed."
          : uncatalogued.length > 1
            ? ` ${uncatalogued.length} uncatalogued tokens are listed.`
            : ""}
      </p>
      <ul className="mt-10 divide-y divide-line border-t border-line">
        {works.map((work) => (
          <li key={work.id}>
            <WorkTile work={work} />
          </li>
        ))}
      </ul>
    </section>
  );
}
