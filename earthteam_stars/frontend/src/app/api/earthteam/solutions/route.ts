import { NextResponse } from "next/server";

/**
 * Server-side proxy for the public EarthTeam Solutions feed.
 * The upstream API (apiv2.earth-team.org) doesn't set CORS headers,
 * so the browser can't call it directly — we fetch it from the
 * Next.js server instead and re-emit with our own CORS headers.
 *
 * Cached at the Vercel edge for 1 hour.
 */

const UPSTREAM =
  "https://apiv2.earth-team.org/api/v1/markers/?language=en&post_type=et_partners";

export const revalidate = 3600; // 1h ISR cache

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}`, results: [] },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, results: [] },
      { status: 502 },
    );
  }
}
