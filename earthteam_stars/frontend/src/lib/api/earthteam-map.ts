/**
 * Real EarthTeam map feed adapters.
 * Pulls live pins from the public EarthTeam map API
 * (the same data shown at https://map.earth-team.org).
 *
 *  - Solutions feed: conservation projects, partners (~86 pins)
 *  - Wildlife Crime feed: incident reports (~682 pins)
 */

const SOLUTIONS_URL =
  "https://apiv2.earth-team.org/api/v1/markers/?language=en&post_type=et_partners";
const WILDLIFE_URL =
  "https://apiv2.earth-team.org/api/v1/posts/?post_type=wildlife-crimedb&language=en&page=1&limit=1000";

export type FeedKind = "solutions" | "wildlife";

export interface EarthTeamPin {
  id: string;
  feed: FeedKind;
  lat: number;
  lng: number;
  title: string;
  category: string; // ProjectType / Event_Type
  organization?: string;
  country?: string;
  description?: string;
  date?: string;
  species?: string;
  sourceUrl?: string;
}

/* ── Color map: ProjectType → celestial-palette accent ─────────── */
export const FEED_COLORS: Record<string, string> = {
  // Solutions
  "Habitat Protection": "#3DDDB7",
  "Counter-poaching": "#F5D547",
  "Counter-poaching - Wildlife Protection": "#F5D547",
  "Counter-trafficking": "#A78BFA",
  "Counter-trafficking - Wildlife Protection": "#A78BFA",
  "Demand Reduction": "#C08A52",
  "Demand Reduction - Wildlife Protection": "#C08A52",
  "Regenerative Agriculture": "#A0E374",
  // Wildlife crime catch-all
  "Wildlife Crime": "#E27676",
};

export function colorForCategory(cat: string, feed: FeedKind): string {
  if (FEED_COLORS[cat]) return FEED_COLORS[cat];
  return feed === "wildlife" ? "#E27676" : "#3DDDB7";
}

/* ── Fetchers ──────────────────────────────────────────────────── */

interface SolutionsRaw {
  id: number;
  ProjectType: string;
  LatLong?: { latitude: number; longitude: number };
  Organization?: string;
  Country?: string;
}

interface WildlifeRaw {
  id: number;
  title: string;
  LatLong?: { latitude: number; longitude: number };
  body?: {
    BasicData?: {
      Country?: string;
      State?: string;
      Date?: string;
      Event_Type?: string;
      Facility?: string;
    };
    Description?: { Event_Description?: string };
    SpeciesDetails?: { Species_Common_Name?: string };
    SourcesInfo?: { Source1?: string };
  };
}

interface PaginatedResults<T> {
  results?: T[];
  count?: number;
}

function isValidLatLng(coords?: {
  latitude: number;
  longitude: number;
}): coords is { latitude: number; longitude: number } {
  if (!coords) return false;
  const { latitude, longitude } = coords;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
  if (latitude === 0 && longitude === 0) return false; // skip null-island
  return true;
}

export async function fetchSolutionsPins(): Promise<EarthTeamPin[]> {
  try {
    const res = await fetch(SOLUTIONS_URL);
    if (!res.ok) return [];
    const data: PaginatedResults<SolutionsRaw> | SolutionsRaw[] = await res.json();
    const arr: SolutionsRaw[] = Array.isArray(data)
      ? data
      : (data.results ?? []);
    return arr
      .filter((m) => isValidLatLng(m.LatLong))
      .map((m) => ({
        id: `sol-${m.id}`,
        feed: "solutions" as const,
        lat: m.LatLong!.latitude,
        lng: m.LatLong!.longitude,
        title: m.Organization || m.ProjectType,
        category: m.ProjectType,
        organization: m.Organization,
        country: m.Country,
      }));
  } catch {
    return [];
  }
}

export async function fetchWildlifePins(): Promise<EarthTeamPin[]> {
  try {
    const res = await fetch(WILDLIFE_URL);
    if (!res.ok) return [];
    const data: PaginatedResults<WildlifeRaw> = await res.json();
    const arr = data.results ?? [];
    return arr
      .filter((m) => isValidLatLng(m.LatLong))
      .map((m) => {
        const bd = m.body?.BasicData ?? {};
        const species = m.body?.SpeciesDetails?.Species_Common_Name?.trim();
        const country = bd.Country?.trim();
        // Tighter title: "Species · Country" or fallback to truncated original
        const compactTitle =
          species && country
            ? `${species} · ${country}`
            : species || (m.title?.length > 70
                ? m.title.slice(0, 68) + "…"
                : m.title);
        return {
          id: `wl-${m.id}`,
          feed: "wildlife" as const,
          lat: m.LatLong!.latitude,
          lng: m.LatLong!.longitude,
          title: compactTitle,
          category: bd.Event_Type || "Wildlife Crime",
          country,
          species,
          date: bd.Date,
          description: m.body?.Description?.Event_Description?.slice(0, 200),
          sourceUrl: m.body?.SourcesInfo?.Source1,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchAllEarthTeamPins(): Promise<EarthTeamPin[]> {
  const [solutions, wildlife] = await Promise.all([
    fetchSolutionsPins(),
    fetchWildlifePins(),
  ]);
  return [...solutions, ...wildlife];
}
