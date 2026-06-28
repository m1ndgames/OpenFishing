import { describe, it, expect } from 'vitest';
import { haversineMeters } from '../haversine';

describe('haversineMeters', () => {
	it('returns 0 for the same point', () => {
		expect(haversineMeters(52.0, 13.0, 52.0, 13.0)).toBe(0);
	});

	it('is symmetric', () => {
		const d1 = haversineMeters(52.0, 13.0, 52.1, 13.1);
		const d2 = haversineMeters(52.1, 13.1, 52.0, 13.0);
		expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
	});

	it('returns ~504 km between Berlin and Munich', () => {
		const dist = haversineMeters(52.52, 13.405, 48.137, 11.576);
		expect(dist).toBeGreaterThan(503_000);
		expect(dist).toBeLessThan(508_000);
	});

	it('detects points within the 100m catch-to-spot threshold', () => {
		// ~50m north along the meridian
		const dist = haversineMeters(52.0, 13.0, 52.00045, 13.0);
		expect(dist).toBeLessThan(100);
	});

	it('detects points beyond the 100m threshold', () => {
		// ~200m north
		const dist = haversineMeters(52.0, 13.0, 52.0018, 13.0);
		expect(dist).toBeGreaterThan(100);
	});
});
