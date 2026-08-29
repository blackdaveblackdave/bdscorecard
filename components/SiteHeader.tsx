"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { z } from "@/lib/z";

export function SiteHeader() {
  const pathname = usePathname();
  const onArchive = pathname === "/" || pathname.startsWith("/collector/");
  const worksHref = onArchive ? "#works" : "/#works";
  const vaultHref = onArchive ? "#vault" : "/#vault";

  return (
    <header
      className="sticky top-0 border-b border-line bg-background"
      style={{ zIndex: z.nav }}
    >
      <nav
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8"
        aria-label="Primary"
      >
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Black Dave"
            width={32}
            height={32}
            className="size-8 rounded-none dark:invert"
          />
          <span
            className="hidden truncate text-sm font-medium tracking-tight sm:inline"
            aria-hidden="true"
          >
            Black Dave
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href={worksHref}
            className="whitespace-nowrap text-sm text-foreground underline-offset-4 hover:underline"
          >
            Works
          </Link>
          <Link
            href={vaultHref}
            className="whitespace-nowrap text-sm text-foreground underline-offset-4 hover:underline"
          >
            Vault
          </Link>
          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
