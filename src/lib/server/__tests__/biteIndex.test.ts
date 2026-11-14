import { describe, it, expect } from 'vitest';
import { getMoonPhaseIndex, getLightingKey, sunElevation, computeBiteIndex, type BiteInputs } from '../biteIndex';

describe('getMoonPhaseIndex', () => {
	it('returns an integer in the 0-7 range', () => {
		const idx = getMoonPhaseIndex(new Date());
		expect(idx).toBeGreaterThanOrEqual(0);
		expect(idx).toBeLessThanOrEqual(7);
		expect(Number.isInteger(idx)).toBe(true);
	});

	it('returns 0 at the known new moon reference date', () => {
		expect(getMoonPhaseIndex(new Date('2000-01-06T18:14:00Z'))).toBe(0);
	});
});

describe('sunElevation', () => {
	it('matches the June-solstice solar noon in Berlin (~61°)', () => {
		expect(sunElevation(52.52, 13.405, new Date('2024-06-21T11:07:00Z'))).toBeCloseTo(61, 0);
	});

	it('is about 0° at published sunrise (Duisburg, 2026-11-14 07:48 CET)', () => {
		const elev = sunElevation(51.2556, 6.7384, new Date('2026-11-14T06:48:00Z'));
		expect(Math.abs(elev)).toBeLessThan(1.5);
	});

	it('uses real longitude, not a fixed timezone (New York sunrise 06:40 EST)', () => {
		const elev = sunElevation(40.71, -74, new Date('2026-11-14T11:40:00Z'));
		expect(Math.abs(elev)).toBeLessThan(1.5);
	});

	it('is deeply negative at night', () => {
		expect(sunElevation(51.2556, 6.7384, new Date('2026-11-14T23:00:00Z'))).toBeLessThan(-40);
	});

	it('works in the southern hemisphere (Sydney noon in December is high)', () => {
		expect(sunElevation(-33.86, 151.2, new Date('2024-12-21T02:00:00Z'))).toBeGreaterThan(75);
	});
});

describe('getLightingKey', () => {
	const lat = 52.52, lng = 13.405; // Berlin, 2024-07-15: sunrise ~03:00Z, sunset ~19:25Z

	it('returns night well before sunrise', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T00:00:00Z'))).toBe('night');
	});

	it('returns dawn around sunrise', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T03:00:00Z'))).toBe('dawn');
	});

	it('returns morning with a low rising sun', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T05:00:00Z'))).toBe('morning');
	});

	it('returns day with a high sun', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T11:00:00Z'))).toBe('day');
	});

	it('returns golden with a low setting sun', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T17:45:00Z'))).toBe('golden');
	});

	it('returns dusk around sunset', () => {
		expect(getLightingKey(lat, lng, new Date('2024-07-15T19:30:00Z'))).toBe('dusk');
	});
});

const base: BiteInputs = {
	sunElevation: 30,
	cloudCover: 50,
	tempTrend: 0,
	tempBaseline: 12,
	windSpeed: 0.5,
	windGusts: 2,
	weatherCode: 2,
	pressureDelta: 0,
	moonPhaseIndex: 2,
};
const c = (over: Partial<BiteInputs>) => computeBiteIndex({ ...base, ...over }).contributions;

describe('computeBiteIndex — light', () => {
	it('gives twilight (-6°…+6°) the biggest boost', () => {
		expect(c({ sunElevation: -6 }).light).toBe(2);
		expect(c({ sunElevation: 0 }).light).toBe(2);
		expect(c({ sunElevation: 6 }).light).toBe(2);
	});

	it('gives low sun (6°…20°) a moderate boost', () => {
		expect(c({ sunElevation: 6.1 }).light).toBe(0.8);
		expect(c({ sunElevation: 20 }).light).toBe(0.8);
	});

	it('penalises high sun, softened by cloud cover', () => {
		expect(c({ sunElevation: 40, cloudCover: 0 }).light).toBe(-1);
		expect(c({ sunElevation: 40, cloudCover: 100 }).light).toBe(-0.3);
		expect(c({ sunElevation: 40, cloudCover: null }).light).toBe(-1);
	});

	it('is slightly positive in nautical/astronomical twilight, slightly negative in deep night', () => {
		expect(c({ sunElevation: -10 }).light).toBe(0.3);
		expect(c({ sunElevation: -18 }).light).toBe(0.3);
		expect(c({ sunElevation: -30 }).light).toBe(-0.3);
	});
});

describe('computeBiteIndex — temperature trend', () => {
	it('penalises a strong cold snap', () => {
		expect(c({ tempTrend: -5 }).tempTrend).toBe(-1.5);
		expect(c({ tempTrend: -8 }).tempTrend).toBe(-1.5);
	});

	it('penalises a moderate cold snap', () => {
		expect(c({ tempTrend: -3 }).tempTrend).toBe(-0.8);
		expect(c({ tempTrend: -4.9 }).tempTrend).toBe(-0.8);
	});

	it('is neutral for stable temperatures or missing data', () => {
		expect(c({ tempTrend: -2.9 }).tempTrend).toBe(0);
		expect(c({ tempTrend: 2.9 }).tempTrend).toBe(0);
		expect(c({ tempTrend: null }).tempTrend).toBe(0);
	});

	it('rewards warming only in the cold season', () => {
		expect(c({ tempTrend: 3, tempBaseline: 8 }).tempTrend).toBe(0.4);
		expect(c({ tempTrend: 3, tempBaseline: 20 }).tempTrend).toBe(0);
		expect(c({ tempTrend: 3, tempBaseline: null }).tempTrend).toBe(0);
	});
});

describe('computeBiteIndex — wind', () => {
	it('rewards a light breeze', () => {
		expect(c({ windSpeed: 1.5 }).wind).toBe(0.5);
		expect(c({ windSpeed: 8 }).wind).toBe(0.5);
	});

	it('is neutral when calm or fresh', () => {
		expect(c({ windSpeed: 1 }).wind).toBe(0);
		expect(c({ windSpeed: 10 }).wind).toBe(0);
		expect(c({ windSpeed: null, windGusts: null }).wind).toBe(0);
	});

	it('penalises strong wind or gusts', () => {
		expect(c({ windSpeed: 12.1 }).wind).toBe(-1);
		expect(c({ windSpeed: 5, windGusts: 18 }).wind).toBe(-1);
	});
});

describe('computeBiteIndex — weather code', () => {
	it('heavily penalises thunderstorms', () => {
		for (const code of [95, 96, 99]) expect(c({ weatherCode: code }).weather).toBe(-2.5);
	});

	it('penalises heavy rain', () => {
		for (const code of [65, 67, 82]) expect(c({ weatherCode: code }).weather).toBe(-0.7);
	});

	it('slightly rewards drizzle and light rain', () => {
		for (const code of [51, 53, 61, 80]) expect(c({ weatherCode: code }).weather).toBe(0.3);
	});

	it('is neutral otherwise', () => {
		expect(c({ weatherCode: 0 }).weather).toBe(0);
		expect(c({ weatherCode: null }).weather).toBe(0);
	});
});

describe('computeBiteIndex — pressure trend', () => {
	it('slightly rewards a slow fall', () => {
		expect(c({ pressureDelta: -1 }).pressure).toBe(0.5);
		expect(c({ pressureDelta: -3 }).pressure).toBe(0.5);
	});

	it('penalises a storm-like crash and a sharp rise', () => {
		expect(c({ pressureDelta: -4.1 }).pressure).toBe(-0.5);
		expect(c({ pressureDelta: 2.1 }).pressure).toBe(-0.5);
	});

	it('is neutral when stable', () => {
		expect(c({ pressureDelta: 0 }).pressure).toBe(0);
		expect(c({ pressureDelta: -0.9 }).pressure).toBe(0);
		expect(c({ pressureDelta: 2 }).pressure).toBe(0);
		expect(c({ pressureDelta: -3.5 }).pressure).toBe(0);
	});
});

describe('computeBiteIndex — moon', () => {
	it('adds a small bonus around new and full moon only', () => {
		expect(c({ moonPhaseIndex: 0 }).moon).toBe(0.3);
		expect(c({ moonPhaseIndex: 4 }).moon).toBe(0.3);
		expect(c({ moonPhaseIndex: 2 }).moon).toBe(0);
		expect(c({ moonPhaseIndex: 6 }).moon).toBe(0);
	});
});

describe('computeBiteIndex — total', () => {
	it('is baseline + sum of contributions', () => {
		const { biteIndex, contributions } = computeBiteIndex(base);
		const sum = Object.values(contributions).reduce((a, b) => a + b, 0);
		expect(biteIndex).toBeCloseTo(5 + sum, 5);
	});

	it('scores an ordinary partly cloudy midday as fair (4–5.5)', () => {
		const { biteIndex } = computeBiteIndex(base);
		expect(biteIndex).toBeGreaterThanOrEqual(4);
		expect(biteIndex).toBeLessThanOrEqual(5.5);
	});

	it('scores an overcast, breezy evening twilight as good (> 7)', () => {
		const { biteIndex } = computeBiteIndex({ ...base, sunElevation: -2, cloudCover: 90, windSpeed: 4, weatherCode: 61, pressureDelta: -1.5 });
		expect(biteIndex).toBeGreaterThan(7);
	});

	it('scores a thunderstorm as poor (< 3)', () => {
		const { biteIndex } = computeBiteIndex({ ...base, weatherCode: 95, windGusts: 20, pressureDelta: -5 });
		expect(biteIndex).toBeLessThan(3);
	});

	it('scores the Duisburg 2026-11-14 22:00 case (night, falling pressure, breeze, clear) at 5.7', () => {
		const { biteIndex } = computeBiteIndex({
			sunElevation: -47, cloudCover: 20, tempTrend: -0.9, tempBaseline: 6,
			windSpeed: 4.6, windGusts: 8.8, weatherCode: 1, pressureDelta: -2.5, moonPhaseIndex: 1,
		});
		expect(biteIndex).toBe(5.7);
	});

	it('clamps to the 0–10 range', () => {
		const low = computeBiteIndex({ ...base, sunElevation: 60, cloudCover: 0, tempTrend: -10, weatherCode: 95, windSpeed: 20, pressureDelta: 5 });
		expect(low.biteIndex).toBeGreaterThanOrEqual(0);
		const high = computeBiteIndex({ ...base, sunElevation: 0, tempTrend: 4, tempBaseline: 5, windSpeed: 4, weatherCode: 61, pressureDelta: -2, moonPhaseIndex: 0 });
		expect(high.biteIndex).toBeLessThanOrEqual(10);
		expect(high.biteIndex).toBe(9);
	});
});
