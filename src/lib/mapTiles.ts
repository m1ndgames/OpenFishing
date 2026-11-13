// Base map tiles and marker defaults shared by every Leaflet map.
// Self-hosters can point the maps at their own (or a commercial) tile server with
// MAP_TILE_URL / MAP_TILE_ATTRIBUTION; the root layout passes the resolved value down.

export interface MapTiles {
	url: string;
	attribution: string;
}

// OSM asks clients to use the single host; the {s} subdomains are deprecated.
export const DEFAULT_TILES: MapTiles = {
	url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

export function resolveMapTiles(url?: string, attribution?: string): MapTiles {
	const u = url?.trim();
	if (!u) return DEFAULT_TILES;
	return { url: u, attribution: attribution?.trim() ?? '' };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded dynamically */
export function addBaseTiles(L: any, map: any, tiles: MapTiles = DEFAULT_TILES) {
	return L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: 19 }).addTo(map);
}

/**
 * Options for a pin that only marks a position (detail pages, the pin a form places).
 * Leaflet makes markers focusable buttons by default, which leaves an unnamed tab stop.
 */
export const STATIC_PIN = { keyboard: false, interactive: false } as const;

export interface MapControlLabels {
	mapZoomIn: string;
	mapZoomOut: string;
}

/** Credit Leaflet without its English "A JavaScript library for interactive maps" tooltip. */
export const LEAFLET_PREFIX = '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>';

/**
 * Translated zoom buttons (Leaflet's built-in control is hard-wired to "Zoom in"/"Zoom out",
 * which screen readers announce in every language). Create the map with `zoomControl: false`.
 */
export function addMapControls(L: any, map: any, labels: MapControlLabels) {
	map.attributionControl?.setPrefix(LEAFLET_PREFIX);
	return L.control.zoom({ zoomInTitle: labels.mapZoomIn, zoomOutTitle: labels.mapZoomOut }).addTo(map);
}
