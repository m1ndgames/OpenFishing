import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from '../biteIndex';

// 13:00 UTC in Berlin in July: sun high (~58°) → "day"
const FIXED_NOW = new Date('2024-07-15T13:00:00Z');
const NOW_SEC = FIXED_NOW.getTime() / 1000;
const HOURS = 100; // 96 h of history + now + a few future hours

/** Hourly unixtime series ending a few hours after now; index HOURS-4 is "now". */
function hourly(tempFor: (hoursAgo: number) => number, pressureFor: (hoursAgo: number) => number) {
	const time: number[] = [], temperature_2m: number[] = [], pressure_msl: number[] = [];
	for (let i = 0; i < HOURS; i++) {
		const hoursAgo = HOURS - 4 - i;
		time.push(NOW_SEC - hoursAgo * 3600);
		temperature_2m.push(tempFor(hoursAgo));
		pressure_msl.push(pressureFor(hoursAgo));
	}
	return { time, temperature_2m, pressure_msl };
}

const mockApiResponse = {
	current: {
		temperature_2m: 20, relative_humidity_2m: 65, pressure_msl: 1013,
		cloud_cover: 40, wind_speed_10m: 3.2, wind_gusts_10m: 6.5, weather_code: 2,
	},
	// pressure 3 h ago = 1011 → delta +2.0; temps: 18 °C before the last 24 h, 20 °C within it
	hourly: hourly(h => (h < 24 ? 20 : 18), h => (h === 3 ? 1011 : 1013)),
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

	it('requests unixtime hourly data with 4 days of history and the current wind/cloud/weather code', async () => {
		mockFetch(mockApiResponse);
		await fetchWeather(52, 13);
		const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
		expect(url).toContain('timeformat=unixtime');
		expect(url).toContain('past_days=4');
		expect(url).toContain('wind_speed_unit=ms');
		expect(url).toMatch(/current=[^&]*cloud_cover[^&]*wind_speed_10m[^&]*wind_gusts_10m[^&]*weather_code/);
	});

	it('returns the current conditions', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.temperature).toBe(20);
		expect(result!.humidity).toBe(65);
		expect(result!.pressure).toBe(1013);
		expect(result!.cloudCover).toBe(40);
		expect(result!.windSpeed).toBe(3.2);
		expect(result!.windGusts).toBe(6.5);
		expect(result!.weatherCode).toBe(2);
	});

	it('computes pressure delta between now and 3 hours ago', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.pressureDelta).toBe(2);
	});

	it('computes the temperature trend (last 24 h vs the 72 h before)', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.tempTrend).toBe(2);
	});

	it('detects a cold snap and lowers the index', async () => {
		mockFetch({ ...mockApiResponse, hourly: hourly(h => (h < 24 ? 10 : 17), () => 1013) });
		const result = await fetchWeather(52, 13);
		expect(result!.tempTrend).toBe(-7);
		expect(result!.biteContributions.tempTrend).toBe(-1.5);
	});

	it('derives light from the real sun elevation (high sun at 13:00 UTC in Berlin)', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.sunElevation).toBeGreaterThan(50);
		expect(result!.lightingKey).toBe('day');
		expect(result!.biteContributions.light).toBeLessThan(0);
	});

	it('includes a biteIndex equal to 5 + the sum of contributions', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		const c = result!.biteContributions;
		const sum = c.light + c.tempTrend + c.wind + c.weather + c.pressure + c.moon;
		expect(result!.biteIndex).toBeCloseTo(5 + sum, 5);
		expect(result!.biteIndex).toBeGreaterThanOrEqual(0);
		expect(result!.biteIndex).toBeLessThanOrEqual(10);
	});

	it('includes a moonPhaseIndex in the 0–7 range', async () => {
		mockFetch(mockApiResponse);
		const result = await fetchWeather(52, 13);
		expect(result!.moonPhaseIndex).toBeGreaterThanOrEqual(0);
		expect(result!.moonPhaseIndex).toBeLessThanOrEqual(7);
	});

	it('falls back gracefully when hourly arrays are empty', async () => {
		mockFetch({
			current: { temperature_2m: 15, relative_humidity_2m: 70, pressure_msl: 1010 },
			hourly: { time: [], pressure_msl: [], temperature_2m: [] },
		});
		const result = await fetchWeather(52, 13);
		expect(result!.pressureDelta).toBe(0);
		expect(result!.tempTrend).toBeNull();
		expect(result!.windSpeed).toBeNull();
		expect(result!.biteContributions.tempTrend).toBe(0);
	});
});
