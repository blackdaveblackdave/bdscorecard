import { CatalogIndex } from "@/components/CatalogIndex";
import { Hero } from "@/components/Hero";
import { Vault } from "@/components/Vault";
import { getCatalog, getVaultWorks } from "@/lib/catalog";

export default function Home() {
  const works = getCatalog();
  const vault = getVaultWorks();

  return (
    <>
      <Hero featuredArtwork="/art/bd-os-001.jpg" featuredTitle="MasterCoin" />
      <CatalogIndex works={works} />
      <Vault works={vault} />
    </>
  );
}
