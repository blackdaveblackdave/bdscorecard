import { connection } from "next/server";
import { Hero } from "@/components/Hero";
import { getFeaturedWorks } from "@/lib/catalog";
import { shuffleList } from "@/lib/catalog-view";

export default async function Home() {
  await connection();
  return <Hero works={shuffleList(getFeaturedWorks())} />;
}
