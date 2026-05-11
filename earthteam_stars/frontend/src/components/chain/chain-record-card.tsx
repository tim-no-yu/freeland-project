"use client";

import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { ChainRecord, StarLevel } from "@/lib/types";

/**
 * Chain record card — renders the "Stars Issued on Solana" receipt that
 * appears at the bottom of an approved/issued report card.
 *
 * Three visual variants matching the app's themes:
 *   - classic  : clean green pill, simple
 *   - archive  : cream card, serif numerals, editorial feel
 *   - celestial: dark navy, italic mint numerals, glow
 *
 * The data shape is the existing `ChainRecord` type — no backend
 * changes needed. When real on-chain minting comes online, the same
 * card just lights up automatically.
 */

interface ChainRecordCardProps {
  record: ChainRecord;
  variant: "classic" | "archive" | "celestial";
  tier?: StarLevel;
  amount?: number;
}

function truncate(sig: string): string {
  if (!sig || sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

export function ChainRecordCard({
  record,
  variant,
  tier = "silver",
  amount,
}: ChainRecordCardProps) {
  const [copied, setCopied] = useState(false);
  const stars = amount ?? record.token_amount;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.transaction_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (variant === "celestial") {
    return (
      <section className="rounded-2xl border border-[#1a2530] bg-gradient-to-br from-[#0d171f] to-[#0b1419] p-6 shadow-[inset_0_0_60px_rgba(61,221,183,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3dddb7]/40 bg-[#3dddb7]/10 text-[#3dddb7] shadow-[0_0_18px_rgba(61,221,183,0.35)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                Anchored On Chain
              </p>
              <h3 className="mt-0.5 font-serif text-base italic text-[#f5f8fa]">
                Stars Minted on Solana Devnet
              </h3>
            </div>
          </div>
          <span className="rounded-full border border-[#3dddb7]/40 bg-[#3dddb7]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#3dddb7]">
            Verified
          </span>
        </div>

        <div className="mt-6 flex items-end gap-3 border-b border-[#1a2530] pb-5">
          <p className="font-serif text-5xl italic leading-none text-[#3dddb7] [text-shadow:0_0_24px_rgba(61,221,183,0.45)]">
            {stars.toLocaleString()}
          </p>
          <p className="pb-1 text-sm uppercase tracking-[0.18em] text-[#6b7785]">
            ★ Stars
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Transaction
            </p>
            <button
              onClick={handleCopy}
              className="mt-1 group inline-flex items-center gap-2 font-mono text-xs text-[#3dddb7] hover:text-[#5ee5c5]"
            >
              {truncate(record.transaction_hash)}
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              )}
            </button>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Recipient Wallet
            </p>
            <p className="mt-1 font-mono text-xs text-[#d0d6dc]">
              {truncate(record.wallet_address)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Network
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[#d0d6dc]">
              Solana · {record.network}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Issued
            </p>
            <p className="mt-1 text-xs text-[#d0d6dc]">
              {formatDate(record.created_at)}
            </p>
          </div>
        </div>

        <a
          href={record.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3dddb7] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0b1419] shadow-[0_0_24px_rgba(61,221,183,0.4)] transition-all hover:shadow-[0_0_32px_rgba(61,221,183,0.6)]"
        >
          View on Solana Explorer
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>
    );
  }

  if (variant === "archive") {
    return (
      <section className="rounded-2xl border border-[#e6ddc4] bg-[#faf6e9] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#e6ddc4] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dfe9d4] text-[#1f3a1f]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
                Provenance Record
              </p>
              <h3 className="mt-0.5 font-serif text-xl font-bold italic text-[#1f3a1f]">
                Anchored on Solana
              </h3>
            </div>
          </div>
          <span className="rounded-full bg-[#dfe9d4] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f]">
            Issued
          </span>
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <p className="font-serif text-4xl font-bold text-[#1f3a1f]">
            {stars.toLocaleString()}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a8170]">
            ★ {tier} Stars Minted
          </p>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Transaction Hash
            </dt>
            <dd className="mt-1">
              <button
                onClick={handleCopy}
                className="group inline-flex items-center gap-2 font-mono text-xs text-[#1f3a1f] hover:underline"
              >
                {truncate(record.transaction_hash)}
                {copied ? (
                  <Check className="h-3 w-3 text-[#1f3a1f]" />
                ) : (
                  <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                )}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Recipient Wallet
            </dt>
            <dd className="mt-1 font-mono text-xs text-[#1f3a1f]">
              {truncate(record.wallet_address)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Network
            </dt>
            <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#1f3a1f]">
              Solana · {record.network}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Issued
            </dt>
            <dd className="mt-1 text-xs text-[#1f3a1f]">
              {formatDate(record.created_at)}
            </dd>
          </div>
        </dl>

        <a
          href={record.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1f3a1f] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f] hover:bg-[#1f3a1f] hover:text-[#f4eedf]"
        >
          View on Solana Explorer
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>
    );
  }

  // Classic
  return (
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              On-Chain Receipt
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-gray-900">
              Stars Minted on Solana
            </h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          <Check className="h-3 w-3" />
          Issued
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-emerald-700">
          {stars.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">★ {tier} stars</p>
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <p className="font-medium text-gray-500">Transaction</p>
          <button
            onClick={handleCopy}
            className="mt-0.5 group inline-flex items-center gap-1.5 font-mono text-emerald-700 hover:underline"
          >
            {truncate(record.transaction_hash)}
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
            )}
          </button>
        </div>
        <div>
          <p className="font-medium text-gray-500">Recipient</p>
          <p className="mt-0.5 font-mono text-gray-700">
            {truncate(record.wallet_address)}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-500">Network</p>
          <p className="mt-0.5 capitalize text-gray-700">
            Solana · {record.network}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-500">Issued</p>
          <p className="mt-0.5 text-gray-700">{formatDate(record.created_at)}</p>
        </div>
      </div>

      <a
        href={record.explorer_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
      >
        View on Solana Explorer
        <ExternalLink className="h-3 w-3" />
      </a>
    </section>
  );
}
