import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from '../biteIndex';

const FIXED_NOW = new Date('2024-07-15T13:00:00Z');

const mockApiResponse = {
	current: { temperature_2m: 20, relative_humidity_2m: 65, pressure_msl: 1013 },
	hourly: {
		// index 1 is closest to 3h ago (10:00Z); index 4 is closest to now (13:00Z)
		time: [
			'2024-07-15T09:00:00Z',
			'2024-07-15T10:00:00Z',
			'2024-07-15T11:00:00Z',
			'2024-07-15T12:00:00Z',
			'2024-07-15T13:00:00Z',
		],
		pressure_msl: [1009, 1011, 1012, 1012.5, 1013],
		temperature_2m: [17, 18, 19, 19.5, 20],
	},
	daily: {
		sunrise: ['2024-07-15T05:00:00Z'],
		sunset: ['2024-07-15T21:00:00Z'],
	},
};

function mockFetch(response: object) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ ok: true, json: async () => response })
	);
}

describe('fetchWeather', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns null when fetch throws', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		expect(await fetchWeather(52, 13)).toBeNull();
	});

	it('returns null on a non-ok HTTP response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
		expect(await fetchWeather(52, 13)).toBeNull();
	});

	it('returns the correct current temperature and humidity', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.temperature).toBe(20);
		expect(result!.humidity).toBe(65);
		expect(result!.pressure).toBe(1013);
	});

	it('computes pressure delta between now and 3 hours ago', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		// pressureNow=1013, pressure at 10:00=1011 → delta=+2.0
		expect(result!.pressureDelta).toBe(2);
	});

	it('computes temp delta between now and 3 hours ago', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		// tempNow=20, temp at 10:00=18 → delta=2.0
		expect(result!.tempDelta).toBe(2);
	});

	it('resolves lightingKey to day at 13:00 UTC with sunrise 05:00 / sunset 21:00', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.lightingKey).toBe('day');
	});

	it('includes a biteIndex in the 0–10 range', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.biteIndex).toBeGreaterThanOrEqual(0);
		expect(result!.biteIndex).toBeLessThanOrEqual(10);
	});

	it('includes a moonPhaseIndex in the 0–7 range', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.moonPhaseIndex).toBeGreaterThanOrEqual(0);
		expect(result!.moonPhaseIndex).toBeLessThanOrEqual(7);
	});

	it('includes biteScores with pressure, light, and temp components', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.biteScores).toHaveProperty('pressure');
		expect(result!.biteScores).toHaveProperty('light');
		expect(result!.biteScores).toHaveProperty('temp');
	});

	it('falls back gracefully when hourly arrays are empty', async () => {
		mockFetch({
			current: { temperature_2m: 15, relative_humidity_2m: 70, pressure_msl: 1010 },
			hourly: { time: [], pressure_msl: [], temperature_2m: [] },
			daily: { sunrise: ['2024-07-15T05:00:00Z'], sunset: ['2024-07-15T21:00:00Z'] },
		});
		const result = await fetchWeather(52, 13);
		// pressureDelta = 0 when fallback kicks in (pressureThen === pressureNow)
		expect(result!.pressureDelta).toBe(0);
	});
});
