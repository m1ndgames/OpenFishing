import { describe, it, expect } from 'vitest';
import { getMoonPhaseIndex, getLightingKey, computeBiteScores } from '../biteIndex';

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

describe('getLightingKey', () => {
	const sunrise = '2024-07-15T05:00:00Z';
	const sunset = '2024-07-15T21:00:00Z';

	it('returns night more than 1h before sunrise', () => {
		expect(getLightingKey(new Date('2024-07-15T03:00:00Z'), sunrise, sunset)).toBe('night');
	});

	it('returns dawn within 1h before sunrise', () => {
		expect(getLightingKey(new Date('2024-07-15T04:30:00Z'), sunrise, sunset)).toBe('dawn');
	});

	it('returns morning within 2h after sunrise', () => {
		expect(getLightingKey(new Date('2024-07-15T06:00:00Z'), sunrise, sunset)).toBe('morning');
	});

	it('returns day during midday', () => {
		expect(getLightingKey(new Date('2024-07-15T13:00:00Z'), sunrise, sunset)).toBe('day');
	});

	it('returns golden within 1h before sunset', () => {
		expect(getLightingKey(new Date('2024-07-15T20:30:00Z'), sunrise, sunset)).toBe('golden');
	});

	it('returns dusk within 1h after sunset', () => {
		expect(getLightingKey(new Date('2024-07-15T21:30:00Z'), sunrise, sunset)).toBe('dusk');
	});

	it('returns night well after sunset', () => {
		expect(getLightingKey(new Date('2024-07-15T23:00:00Z'), sunrise, sunset)).toBe('night');
	});

	it('falls back to day when sunrise/sunset are missing', () => {
		expect(getLightingKey(new Date(), '', '')).toBe('day');
	});
});

describe('computeBiteScores', () => {
	it('scores perfect conditions: falling pressure, dawn, stable temp → 10', () => {
		const result = computeBiteScores(-2, 'dawn', 1);
		expect(result.pressure).toBe(10);
		expect(result.light).toBe(10);
		expect(result.temp).toBe(10);
		expect(result.biteIndex).toBe(10);
	});

	it('scores worst conditions: rising pressure, midday, unstable temp → 2', () => {
		const result = computeBiteScores(2, 'day', 5);
		expect(result.pressure).toBe(2);
		expect(result.light).toBe(2);
		expect(result.temp).toBe(2);
		expect(result.biteIndex).toBe(2);
	});

	it('stable pressure (0 hPa/3h) scores 7', () => {
		expect(computeBiteScores(0, 'day', 1).pressure).toBe(7);
	});

	it('pressure boundary: exactly -1.5 is stable, not falling', () => {
		expect(computeBiteScores(-1.5, 'day', 1).pressure).toBe(7);
	});

	it('pressure boundary: -1.6 crosses into falling', () => {
		expect(computeBiteScores(-1.6, 'day', 1).pressure).toBe(10);
	});

	it('golden hour scores 8', () => {
		expect(computeBiteScores(0, 'golden', 1).light).toBe(8);
	});

	it('dusk scores 10', () => {
		expect(computeBiteScores(0, 'dusk', 1).light).toBe(10);
	});

	it('night and morning both score 6', () => {
		expect(computeBiteScores(0, 'night', 1).light).toBe(6);
		expect(computeBiteScores(0, 'morning', 1).light).toBe(6);
	});

	it('temp delta >= 3°C scores 2', () => {
		expect(computeBiteScores(0, 'day', 3).temp).toBe(2);
		expect(computeBiteScores(0, 'day', 5).temp).toBe(2);
	});

	it('temp delta < 3°C scores 10', () => {
		expect(computeBiteScores(0, 'day', 2.9).temp).toBe(10);
	});

	it('computes weighted biteIndex correctly (stable/night/stable → 7.3)', () => {
		// 7*0.5 + 6*0.3 + 10*0.2 = 3.5 + 1.8 + 2.0 = 7.3
		expect(computeBiteScores(0, 'night', 1).biteIndex).toBe(7.3);
	});
});
