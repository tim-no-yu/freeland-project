"""
Solana mint service for EarthTeam Stars.

Devnet-only for the MVP. All RPC traffic goes through `settings.SOLANA_RPC_URL`.
The mint authority keypair lives in `STARS_MINT_AUTHORITY_SECRET` (base58). For
mainnet someday, move that secret out of env into a vault/KMS; see
`apps/chain/README.md`.

The module is intentionally split into two narrow operations:

    send_mint_tx(...)       -> submits a new MintTo (+ optional ATA create + memo)
                               and returns the signature. Does NOT wait for confirm.

    check_confirmation(...) -> polls a previously-submitted signature.

The mint worker uses both so a confirm-timeout never causes a double-mint:
the worker writes the signature to the ChainTx row right after submit and, on a
retry, asks Solana whether that signature confirmed before building a new tx.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass

from django.conf import settings

logger = logging.getLogger(__name__)


# Public Memo program ID. Stable across devnet/mainnet.
MEMO_PROGRAM_ID_STR = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"


class SolanaConfigError(RuntimeError):
    """Service is asked to mint but env vars/deps are missing."""


class SolanaTransientError(RuntimeError):
    """Retryable: blockhash expired, RPC timeout, rate limit, confirm timeout."""


class SolanaPermanentError(RuntimeError):
    """Non-retryable: invalid pubkey, insufficient SOL for rent, mint mismatch."""


@dataclass
class MintResult:
    signature: str
    explorer_url: str
    memo_hash: str
    network: str


# ---------------------------------------------------------------------------
# Pure helpers (safe to import without solana/solders installed)
# ---------------------------------------------------------------------------


def hash_memo(memo: str) -> str:
    """Stable fingerprint of the memo text we send on-chain."""
    return hashlib.sha256(memo.encode("utf-8")).hexdigest()


def explorer_url(signature: str, cluster: str | None = None) -> str:
    """Solana Explorer URL for a signature on the active cluster."""
    cluster = cluster or settings.SOLANA_CLUSTER
    base = f"https://explorer.solana.com/tx/{signature}"
    if cluster in ("mainnet", "mainnet-beta"):
        return base
    return f"{base}?cluster={cluster}"


def build_memo(report_card_id: int) -> str:
    """The on-chain memo binding a tx to one report card."""
    return f"earthteam-stars://report-card/{report_card_id}"


# ---------------------------------------------------------------------------
# RPC-facing operations (require solana + solders)
# ---------------------------------------------------------------------------


def _load_solana_deps():
    """Import the heavy deps lazily so dev environments / tests can stub them."""
    try:
        import base58  # noqa: F401
        from solana.rpc.api import Client
        from solana.rpc.commitment import Confirmed
        from solders.instruction import Instruction
        from solders.keypair import Keypair
        from solders.message import Message
        from solders.pubkey import Pubkey
        from solders.signature import Signature
        from solders.transaction import Transaction
        from spl.token.constants import TOKEN_PROGRAM_ID
        from spl.token.instructions import (
            MintToParams,
            create_associated_token_account,
            get_associated_token_address,
            mint_to,
        )
    except ImportError as exc:  # pragma: no cover - exercised in deploys w/o deps
        raise SolanaConfigError(f"Solana dependencies are not installed: {exc}") from exc

    return {
        "Client": Client,
        "Confirmed": Confirmed,
        "Instruction": Instruction,
        "Keypair": Keypair,
        "Message": Message,
        "Pubkey": Pubkey,
        "Signature": Signature,
        "Transaction": Transaction,
        "TOKEN_PROGRAM_ID": TOKEN_PROGRAM_ID,
        "MintToParams": MintToParams,
        "create_associated_token_account": create_associated_token_account,
        "get_associated_token_address": get_associated_token_address,
        "mint_to": mint_to,
    }


def _load_authority(deps):
    import base58

    secret_b58 = settings.STARS_MINT_AUTHORITY_SECRET
    if not secret_b58:
        raise SolanaConfigError("STARS_MINT_AUTHORITY_SECRET is not set")
    try:
        raw = base58.b58decode(secret_b58)
    except Exception as exc:
        raise SolanaConfigError(f"STARS_MINT_AUTHORITY_SECRET is not valid base58: {exc}") from exc
    return deps["Keypair"].from_bytes(raw)


def _load_mint(deps):
    mint_str = settings.STARS_MINT_ADDRESS
    if not mint_str:
        raise SolanaConfigError("STARS_MINT_ADDRESS is not set")
    try:
        return deps["Pubkey"].from_string(mint_str)
    except Exception as exc:
        raise SolanaConfigError(f"STARS_MINT_ADDRESS is not a valid pubkey: {exc}") from exc


def _classify_rpc_error(exc: Exception) -> Exception:
    """Map a raw RPC error into transient vs permanent."""
    msg = str(exc).lower()
    transient_markers = (
        "blockhash",
        "timeout",
        "timed out",
        "rate",
        "429",
        "503",
        "502",
        "connection",
        "unable to confirm",
        "node is behind",
    )
    if any(marker in msg for marker in transient_markers):
        return SolanaTransientError(str(exc))
    return SolanaPermanentError(str(exc))


def send_mint_tx(recipient_wallet: str, amount: int, memo: str) -> str:
    """
    Build + submit a MintTo (+ ATA-create if needed + memo) to the configured
    Solana cluster. Returns the tx signature immediately; does NOT wait for
    confirmation. The caller is expected to record this signature and call
    `check_confirmation(signature)` to learn the on-chain outcome.

    Raises:
        SolanaPermanentError on bad input or non-retryable RPC failures.
        SolanaTransientError on rate-limit / blockhash / network failures.
    """
    if amount <= 0:
        raise SolanaPermanentError(f"amount must be > 0, got {amount}")
    if not recipient_wallet:
        raise SolanaPermanentError("recipient_wallet is required")

    deps = _load_solana_deps()

    try:
        recipient = deps["Pubkey"].from_string(recipient_wallet)
    except Exception as exc:
        raise SolanaPermanentError(f"invalid recipient wallet: {exc}") from exc

    authority = _load_authority(deps)
    mint = _load_mint(deps)
    client = deps["Client"](settings.SOLANA_RPC_URL)

    ata = deps["get_associated_token_address"](recipient, mint)

    instructions = []

    try:
        ata_info = client.get_account_info(ata, commitment=deps["Confirmed"])
    except Exception as exc:
        raise _classify_rpc_error(exc) from exc

    if getattr(ata_info, "value", None) is None:
        instructions.append(
            deps["create_associated_token_account"](
                payer=authority.pubkey(),
                owner=recipient,
                mint=mint,
            )
        )

    instructions.append(
        deps["mint_to"](
            deps["MintToParams"](
                program_id=deps["TOKEN_PROGRAM_ID"],
                mint=mint,
                dest=ata,
                mint_authority=authority.pubkey(),
                amount=int(amount),
                signers=[],
            )
        )
    )

    instructions.append(
        deps["Instruction"](
            program_id=deps["Pubkey"].from_string(MEMO_PROGRAM_ID_STR),
            accounts=[],
            data=memo.encode("utf-8"),
        )
    )

    try:
        recent = client.get_latest_blockhash(commitment=deps["Confirmed"])
        blockhash = recent.value.blockhash
    except Exception as exc:
        raise _classify_rpc_error(exc) from exc

    message = deps["Message"].new_with_blockhash(
        instructions,
        authority.pubkey(),
        blockhash,
    )
    tx = deps["Transaction"].new_unsigned(message)
    tx.sign([authority], blockhash)

    try:
        send_resp = client.send_raw_transaction(bytes(tx))
    except Exception as exc:
        raise _classify_rpc_error(exc) from exc

    signature_str = str(send_resp.value)
    logger.info(
        "send_mint_tx submitted",
        extra={
            "signature": signature_str,
            "recipient": recipient_wallet,
            "amount": amount,
            "cluster": settings.SOLANA_CLUSTER,
        },
    )
    return signature_str


def check_confirmation(signature: str) -> bool:
    """
    Ask Solana whether a previously-submitted signature reached `Confirmed`.

    Returns:
        True  -> confirmed on-chain.
        False -> still in flight or expired without landing.

    Raises:
        SolanaPermanentError if the chain reports the tx itself failed
        (instruction error). Worker should mark the ChainTx as failed.
    """
    if not signature:
        raise SolanaPermanentError("signature is required")

    deps = _load_solana_deps()
    client = deps["Client"](settings.SOLANA_RPC_URL)

    try:
        sig = deps["Signature"].from_string(signature)
    except Exception as exc:
        raise SolanaPermanentError(f"invalid signature: {exc}") from exc

    try:
        resp = client.get_signature_statuses([sig], search_transaction_history=True)
    except Exception as exc:
        raise _classify_rpc_error(exc) from exc

    value = getattr(resp, "value", None)
    if not value:
        return False
    status = value[0]
    if status is None:
        return False

    # If Solana recorded an instruction error, this signature is dead.
    err = getattr(status, "err", None)
    if err is not None:
        raise SolanaPermanentError(f"tx failed on-chain: {err}")

    confirmation_status = getattr(status, "confirmation_status", None)
    if confirmation_status is None:
        return False
    # `confirmed` or `finalized` both mean we can stop polling.
    return str(confirmation_status).lower() in ("confirmed", "finalized")
