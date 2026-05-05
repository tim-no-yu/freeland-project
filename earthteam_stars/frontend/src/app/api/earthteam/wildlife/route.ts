import { NextResponse } from "next/server";

/**
 * Server-side proxy for the public EarthTeam Wildlife Crime feed.
 * The upstream API doesn't set CORS headers; we fetch from the Next.js
 * server and re-emit. Cached at the Vercel edge for 1 hour.
 */

const UPSTREAM =
  "https://apiv2.earth-team.org/api/v1/posts/?post_type=wildlife-crimedb&language=en&page=1&limit=1000";

export const revalidate = 3600;

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
