"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Top-of-dashboard nudge for reporters who haven't linked a Solana wallet.
 * Approved Stars sit in `ChainTx(status='pending')` until a wallet exists;
 * once the user connects one, the backend signal backfills those rows and
 * the mint worker picks them up on its next pass.
 *
 * Hidden for verifiers / admins (they don't receive Stars), for users who
 * already have a wallet on file, and during SSR to avoid flash.
 */
export function WalletLinkBanner() {
  const user = useAuthStore((s) => s.user);
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!user || user.role !== "reporter") return null;
  if (user.wallet_address && user.wallet_address.length > 0) return null;
  if (connected) return null; // Connect button will auto-link; no need to nag.

  const isCelestial = theme === "celestial";
  const isArchive = theme === "stitch";

  const wrapper = isCelestial
    ? "rounded-2xl border border-[#3dddb7]/30 bg-gradient-to-r from-[#0d171f] to-[#0b1419] p-4 text-[#e8eef2] shadow-[inset_0_0_40px_rgba(61,221,183,0.08)]"
    : isArchive
      ? "rounded-2xl border border-[#e6ddc4] bg-[#faf6e9] p-4 text-[#1f3a1f]"
      : "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900";

  const button = isCelestial
    ? "rounded-full bg-[#3dddb7] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#0b1419] shadow-[0_0_18px_rgba(61,221,183,0.4)] hover:shadow-[0_0_24px_rgba(61,221,183,0.6)]"
    : isArchive
      ? "rounded-full bg-[#1f3a1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f4eedf] hover:bg-[#2d4a2b]"
      : "rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700";

  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 ${wrapper}`}>
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5" />
        <div>
          <p className="text-sm font-semibold">Link a Solana wallet to receive your Stars</p>
          <p className="text-xs opacity-80">
            Approved Stars sit in the queue until your reporter account has a wallet on file. Devnet only.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={`inline-flex items-center gap-2 ${button}`}
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect wallet
      </button>
    </div>
  );
}
