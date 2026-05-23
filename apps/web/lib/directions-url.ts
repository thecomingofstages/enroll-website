import type { ActivityVenue } from "@enroll-website/types";

export type DirectionsFallbackProvider = "google" | "apple" | "osm";

function normalizedFallback(): DirectionsFallbackProvider {
  const raw = process.env.NEXT_PUBLIC_DIRECTIONS_FALLBACK?.trim().toLowerCase();
  if (raw === "apple" || raw === "maps.apple") return "apple";
  if (raw === "osm" || raw === "openstreetmap") return "osm";
  return "google";
}

/** When `venue.directionsUrl` is absent, open this maps provider with name + address as search query. */
export function buildDirectionsFallbackHref(query: string): string {
  const q = encodeURIComponent(query);
  switch (normalizedFallback()) {
    case "apple":
      return `https://maps.apple.com/?q=${q}`;
    case "osm":
      return `https://www.openstreetmap.org/search?query=${q}`;
    default:
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
}

/** `directionsUrl` wins; otherwise fallback URL from venue text + env provider. */
export function directionsHref(venue: ActivityVenue): string {
  const explicit = venue.directions_url?.trim();
  if (explicit) return explicit;
  const query = [venue.name, ...(venue.address_lines || [])].filter(Boolean).join(", ");
  return buildDirectionsFallbackHref(query);
}
