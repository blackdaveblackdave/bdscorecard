import { Vault } from "@/components/Vault";
import { getVaultWorks } from "@/lib/catalog";

export const metadata = {
  title: "Vault",
  description: "Black Dave works that are still available to collect.",
};

export default function VaultPage() {
  return <Vault works={getVaultWorks()} />;
}
