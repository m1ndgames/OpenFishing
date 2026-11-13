import { describe, it, expect, vi } from 'vitest';
import { resolveMapTiles, addBaseTiles, addMapControls, LEAFLET_PREFIX, DEFAULT_TILES, STATIC_PIN } from '../mapTiles';

describe('resolveMapTiles', () => {
	it('defaults to OpenStreetMap without the deprecated subdomains', () => {
		expect(resolveMapTiles()).toEqual(DEFAULT_TILES);
		expect(resolveMapTiles('  ')).toEqual(DEFAULT_TILES);
		expect(DEFAULT_TILES.url).not.toContain('{s}');
	});

	it('uses a configured tile server and its attribution', () => {
		expect(resolveMapTiles(' https://tiles.example/{z}/{x}/{y}.png ', ' © Example ')).toEqual({
			url: 'https://tiles.example/{z}/{x}/{y}.png',
			attribution: '© Example'
		});
	});

	it('allows a custom server without attribution', () => {
		expect(resolveMapTiles('https://tiles.example/{z}/{x}/{y}.png').attribution).toBe('');
	});
});

describe('addBaseTiles', () => {
	it('adds the tile layer to the map', () => {
		const layer = { addTo: vi.fn(() => 'layer') };
		const L = { tileLayer: vi.fn(() => layer) };
		const map = {};
		expect(addBaseTiles(L, map, { url: 'u', attribution: 'a' })).toBe('layer');
		expect(L.tileLayer).toHaveBeenCalledWith('u', { attribution: 'a', maxZoom: 19 });
		expect(layer.addTo).toHaveBeenCalledWith(map);
	});
});

describe('STATIC_PIN', () => {
	it('keeps display-only pins out of the tab order', () => {
		expect(STATIC_PIN).toEqual({ keyboard: false, interactive: false });
	});
});

describe('addMapControls', () => {
	it('adds a zoom control with translated button names and a tooltip-free Leaflet credit', () => {
		const control = { addTo: vi.fn(() => 'zoom') };
		const L = { control: { zoom: vi.fn(() => control) } };
		const setPrefix = vi.fn();
		const map = { attributionControl: { setPrefix } };
		expect(addMapControls(L, map, { mapZoomIn: 'Vergrößern', mapZoomOut: 'Verkleinern' })).toBe('zoom');
		expect(L.control.zoom).toHaveBeenCalledWith({ zoomInTitle: 'Vergrößern', zoomOutTitle: 'Verkleinern' });
		expect(control.addTo).toHaveBeenCalledWith(map);
		expect(setPrefix).toHaveBeenCalledWith(LEAFLET_PREFIX);
		expect(LEAFLET_PREFIX).not.toContain('title=');
	});

	it('copes with a map that has no attribution control', () => {
		const L = { control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) } };
		expect(() => addMapControls(L, {}, { mapZoomIn: 'a', mapZoomOut: 'b' })).not.toThrow();
	});
});
