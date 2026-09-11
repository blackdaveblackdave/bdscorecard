import { Vault } from "@/components/Vault";
import { getVaultWorks } from "@/lib/catalog";

export const metadata = {
  title: "Vault",
  description: "Open editions and Black Dave works that have not sold out.",
};

export default function VaultPage() {
  return <Vault works={getVaultWorks()} />;
}
