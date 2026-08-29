"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function connectFailMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Could not connect.";
  }

  const name = "name" in error && typeof error.name === "string" ? error.name : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";

  if (
    name === "ProviderNotFoundError" ||
    /provider not found|no injected|no provider|connector not found/i.test(
      message,
    )
  ) {
    return "No wallet installed.";
  }

  if (name === "UserRejectedRequestError" || /rejected|denied/i.test(message)) {
    return "Connection rejected.";
  }

  return "Could not connect.";
}

function hasInjectedProvider() {
  return typeof window !== "undefined" && "ethereum" in window;
}

export function ConnectWallet() {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAccount();
  const { connectAsync, connectors, isPending, error, reset } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const [localError, setLocalError] = useState("");

  const failText = localError || (error ? connectFailMessage(error) : "");

  async function onConnect() {
    setLocalError("");
    reset();

    if (!hasInjectedProvider()) {
      setLocalError("No wallet installed.");
      return;
    }

    const connector = connectors[0];
    if (!connector) {
      setLocalError("No wallet installed.");
      return;
    }

    try {
      const result = await connectAsync({ connector });
      const next = result.accounts[0];
      if (next && !pathname.startsWith("/collector/")) {
        router.push(`/collector/${next}`);
      }
    } catch {
      return;
    }
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/collector/${address}`}
          className="whitespace-nowrap text-sm tracking-tight text-foreground underline-offset-4 hover:underline"
        >
          {truncateAddress(address)}
        </Link>
        <button
          type="button"
          className="btn btn-ghost whitespace-nowrap"
          disabled={isDisconnecting}
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-stretch">
      <button
        type="button"
        className="btn btn-gold whitespace-nowrap"
        disabled={isPending}
        aria-busy={isPending}
        onClick={() => {
          void onConnect();
        }}
      >
        Connect wallet
      </button>
      {failText ? (
        <p
          role="alert"
          className="absolute top-[calc(100%+0.35rem)] left-0 max-w-[22ch] text-xs leading-snug text-muted"
        >
          {failText}
        </p>
      ) : null}
    </div>
  );
}
