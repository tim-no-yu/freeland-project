"use client";

import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { ChainRecord, ChainRecordStatus, StarLevel } from "@/lib/types";

/**
 * On-chain receipt rendered at the bottom of a report-card detail page.
 *
 * Status branches:
 *   - confirmed   : the celebratory "Stars Minted" view (tx + explorer link)
 *   - pending     : waiting on the mint worker (no signature yet)
 *   - submitting  : tx in flight on Solana (signature exists, not confirmed)
 *   - failed      : exhausted retries; explains state without spinning
 *
 * Three visual variants matching the app's themes:
 *   - classic  : clean green pill, simple
 *   - archive  : cream card, serif numerals, editorial feel
 *   - celestial: dark navy, italic mint numerals, glow
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

function resolvedStatus(record: ChainRecord): ChainRecordStatus {
  if (record.status) return record.status;
  // Older mocks / pre-status backends: if we have a hash, treat as confirmed.
  return record.transaction_hash ? "confirmed" : "pending";
}

const STATUS_COPY: Record<ChainRecordStatus, { label: string; description: string }> = {
  pending: {
    label: "Queued",
    description: "Stars are queued for minting on Solana devnet.",
  },
  submitting: {
    label: "Minting",
    description: "Transaction submitted to Solana — awaiting confirmation.",
  },
  confirmed: {
    label: "Verified",
    description: "Anchored on Solana devnet.",
  },
  failed: {
    label: "Action needed",
    description: "Mint did not confirm after multiple attempts.",
  },
};

export function ChainRecordCard({
  record,
  variant,
  tier = "silver",
  amount,
}: ChainRecordCardProps) {
  const [copied, setCopied] = useState(false);
  const stars = amount ?? record.token_amount;
  const status = resolvedStatus(record);
  const inFlight = status === "pending" || status === "submitting";
  const hasSignature = Boolean(record.transaction_hash);
  const copy = STATUS_COPY[status];

  const handleCopy = async () => {
    if (!hasSignature) return;
    try {
      await navigator.clipboard.writeText(record.transaction_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (variant === "celestial") {
    const accent =
      status === "failed"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
        : "border-[#3dddb7]/40 bg-[#3dddb7]/10 text-[#3dddb7] shadow-[0_0_18px_rgba(61,221,183,0.35)]";
    const numberColor =
      status === "failed"
        ? "text-amber-300 [text-shadow:0_0_24px_rgba(251,191,36,0.35)]"
        : "text-[#3dddb7] [text-shadow:0_0_24px_rgba(61,221,183,0.45)]";
    return (
      <section className="rounded-2xl border border-[#1a2530] bg-gradient-to-br from-[#0d171f] to-[#0b1419] p-6 shadow-[inset_0_0_60px_rgba(61,221,183,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${accent}`}>
              {inFlight ? <Loader2 className="h-5 w-5 animate-spin" /> :
                status === "failed" ? <AlertTriangle className="h-5 w-5" /> :
                <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
                {inFlight ? "Pending On Chain" : status === "failed" ? "Mint Failed" : "Anchored On Chain"}
              </p>
              <h3 className="mt-0.5 font-serif text-base italic text-[#f5f8fa]">
                {status === "confirmed" ? "Stars Minted on Solana Devnet" : copy.description}
              </h3>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${accent}`}>
            {copy.label}
          </span>
        </div>

        <div className="mt-6 flex items-end gap-3 border-b border-[#1a2530] pb-5">
          <p className={`font-serif text-5xl italic leading-none ${numberColor}`}>
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
            {hasSignature ? (
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
            ) : (
              <p className="mt-1 text-xs italic text-[#6b7785]">awaiting signature…</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7785]">
              Recipient Wallet
            </p>
            <p className="mt-1 font-mono text-xs text-[#d0d6dc]">
              {record.wallet_address ? truncate(record.wallet_address) : "—"}
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
              {status === "confirmed" ? "Issued" : "Queued"}
            </p>
            <p className="mt-1 text-xs text-[#d0d6dc]">
              {formatDate(record.created_at)}
            </p>
          </div>
        </div>

        {hasSignature && record.explorer_url ? (
          <a
            href={record.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3dddb7] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0b1419] shadow-[0_0_24px_rgba(61,221,183,0.4)] transition-all hover:shadow-[0_0_32px_rgba(61,221,183,0.6)]"
          >
            View on Solana Explorer
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="mt-6 text-center text-xs italic text-[#6b7785]">
            {copy.description}
          </p>
        )}
      </section>
    );
  }

  if (variant === "archive") {
    const pill =
      status === "failed"
        ? "bg-amber-100 text-amber-900"
        : inFlight
          ? "bg-[#e6ddc4] text-[#1f3a1f]"
          : "bg-[#dfe9d4] text-[#1f3a1f]";
    return (
      <section className="rounded-2xl border border-[#e6ddc4] bg-[#faf6e9] p-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#e6ddc4] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dfe9d4] text-[#1f3a1f]">
              {inFlight ? <Loader2 className="h-5 w-5 animate-spin" /> :
                status === "failed" ? <AlertTriangle className="h-5 w-5" /> :
                <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
                Provenance Record
              </p>
              <h3 className="mt-0.5 font-serif text-xl font-bold italic text-[#1f3a1f]">
                {status === "confirmed" ? "Anchored on Solana" : copy.label}
              </h3>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${pill}`}>
            {copy.label}
          </span>
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <p className="font-serif text-4xl font-bold text-[#1f3a1f]">
            {stars.toLocaleString()}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a8170]">
            ★ {tier} Stars {status === "confirmed" ? "Minted" : "Pending"}
          </p>
        </div>

        {!hasSignature && (
          <p className="mt-3 text-sm italic text-[#8a8170]">{copy.description}</p>
        )}

        <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Transaction Hash
            </dt>
            <dd className="mt-1">
              {hasSignature ? (
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
              ) : (
                <p className="font-mono text-xs italic text-[#8a8170]">awaiting signature…</p>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8170]">
              Recipient Wallet
            </dt>
            <dd className="mt-1 font-mono text-xs text-[#1f3a1f]">
              {record.wallet_address ? truncate(record.wallet_address) : "—"}
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
              {status === "confirmed" ? "Issued" : "Queued"}
            </dt>
            <dd className="mt-1 text-xs text-[#1f3a1f]">
              {formatDate(record.created_at)}
            </dd>
          </div>
        </dl>

        {hasSignature && record.explorer_url && (
          <a
            href={record.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1f3a1f] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f3a1f] hover:bg-[#1f3a1f] hover:text-[#f4eedf]"
          >
            View on Solana Explorer
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </section>
    );
  }

  // Classic
  const classicPill =
    status === "failed"
      ? "bg-amber-500"
      : inFlight
        ? "bg-gray-500"
        : "bg-emerald-600";
  return (
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            {inFlight ? <Loader2 className="h-4 w-4 animate-spin" /> :
              status === "failed" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
              <Sparkles className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              On-Chain Receipt
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-gray-900">
              {status === "confirmed" ? "Stars Minted on Solana" : copy.description}
            </h3>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${classicPill}`}>
          {inFlight ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {copy.label}
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
          {hasSignature ? (
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
          ) : (
            <p className="mt-0.5 italic text-gray-400">awaiting signature…</p>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-500">Recipient</p>
          <p className="mt-0.5 font-mono text-gray-700">
            {record.wallet_address ? truncate(record.wallet_address) : "—"}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-500">Network</p>
          <p className="mt-0.5 capitalize text-gray-700">
            Solana · {record.network}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-500">{status === "confirmed" ? "Issued" : "Queued"}</p>
          <p className="mt-0.5 text-gray-700">{formatDate(record.created_at)}</p>
        </div>
      </div>

      {hasSignature && record.explorer_url ? (
        <a
          href={record.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
        >
          View on Solana Explorer
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="mt-4 text-xs italic text-gray-500">{copy.description}</p>
      )}
    </section>
  );
}
