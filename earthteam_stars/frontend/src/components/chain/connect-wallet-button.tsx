"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut, Check } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useAuthStore } from "@/stores/auth-store";
import { updateMyWallet } from "@/lib/api/auth";

/**
 * Connect-wallet button used in every theme's nav.
 * Tiny so it fits both sidebar (classic / archive) and top-nav (celestial).
 *
 * Behavior:
 *   - Not connected → "Connect Wallet" → opens wallet-adapter modal
 *   - Connected     → shows truncated address; click → disconnect
 *   - On first connect, if the logged-in reporter has no wallet on file,
 *     automatically PATCH /auth/me/ so the backend mint worker can pay them.
 *     A different wallet replacing an existing one is left to the user
 *     (intentional: prevents accidentally rewriting an address that is
 *     already tied to in-flight mints).
 */

function truncate(addr?: string | null): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton({
  className = "",
}: {
  className?: string;
}) {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [mounted, setMounted] = useState(false);
  const linkAttempted = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Auto-link the wallet to the account on first connection when no
  // wallet is on file yet. Idempotent via `linkAttempted` ref.
  useEffect(() => {
    if (!connected || !publicKey || !user) return;
    const addr = publicKey.toBase58();
    if (linkAttempted.current === addr) return;
    if (user.wallet_address && user.wallet_address.length > 0) return;
    linkAttempted.current = addr;
    updateMyWallet(addr)
      .then((updated) => setUser(updated))
      .catch(() => {
        // Non-fatal: keep the wallet connected; user can retry on reload.
        linkAttempted.current = null;
      });
  }, [connected, publicKey, user, setUser]);

  // Theme-aware styles
  const base =
    "inline-flex items-center gap-2 text-xs font-semibold transition-colors disabled:opacity-50";
  const celestial = connected
    ? "rounded-full border border-[#3dddb7]/40 bg-[#3dddb7]/10 px-3 py-1.5 text-[#3dddb7] shadow-[0_0_14px_rgba(61,221,183,0.3)] hover:bg-[#3dddb7]/15"
    : "rounded-full bg-[#3dddb7] px-3.5 py-1.5 text-[#0b1419] shadow-[0_0_18px_rgba(61,221,183,0.4)] hover:shadow-[0_0_24px_rgba(61,221,183,0.55)]";
  const archive = connected
    ? "rounded-full border border-[#1f3a1f]/30 bg-white px-3 py-1.5 uppercase tracking-[0.16em] text-[10px] text-[#1f3a1f] hover:bg-[#faf6e9]"
    : "rounded-full bg-[#1f3a1f] px-3.5 py-1.5 uppercase tracking-[0.16em] text-[10px] text-[#f4eedf] hover:bg-[#2d4a2b]";
  const classic = connected
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100"
    : "rounded-full bg-emerald-600 px-3.5 py-1.5 text-white hover:bg-emerald-700";

  const themeStyle =
    !mounted || theme === "classic"
      ? classic
      : theme === "stitch"
        ? archive
        : celestial;

  if (connected && publicKey) {
    return (
      <button
        type="button"
        onClick={() => void disconnect()}
        title={publicKey.toBase58()}
        suppressHydrationWarning
        className={`${base} ${themeStyle} ${className}`}
      >
        <Check className="h-3 w-3" />
        <span className="font-mono">{truncate(publicKey.toBase58())}</span>
        <LogOut className="h-3 w-3 opacity-50" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      disabled={connecting}
      suppressHydrationWarning
      className={`${base} ${themeStyle} ${className}`}
    >
      <Wallet className="h-3.5 w-3.5" />
      {connecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
