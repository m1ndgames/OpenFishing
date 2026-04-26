type LightingKey = 'night' | 'dawn' | 'morning' | 'day' | 'golden' | 'dusk';

function getMoonPhaseIndex(date: Date): number {
	const reference = new Date('2000-01-06T18:14:00Z').getTime();
	const lunarCycleDays = 29.53058867;
	const elapsed = (date.getTime() - reference) / 86_400_000;
	const phase = ((elapsed % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
	return Math.floor(((phase / lunarCycleDays) + 1 / 16) * 8) % 8;
}

function getLightingKey(now: Date, sunriseStr: string, sunsetStr: string): LightingKey {
	if (!sunriseStr || !sunsetStr) return 'day';
	const nowMs = now.getTime();
	const riseMs = new Date(sunriseStr).getTime();
	const setMs  = new Date(sunsetStr).getTime();
	const hr = 3_600_000;
	if (nowMs < riseMs - hr)     return 'night';
	if (nowMs < riseMs)          return 'dawn';
	if (nowMs < riseMs + 2 * hr) return 'morning';
	if (nowMs < setMs - hr)      return 'day';
	if (nowMs < setMs)           return 'golden';
	if (nowMs < setMs + hr)      return 'dusk';
	return 'night';
}

export type WeatherData = {
	temperature: number | null;
	humidity: number | null;
	pressure: number | null;
	pressureDelta: number;
	tempDelta: number;
	moonPhaseIndex: number;
	lightingKey: LightingKey;
	biteIndex: number;
	biteScores: { pressure: number; light: number; temp: number };
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
	try {
		const url =
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
			`&current=temperature_2m,relative_humidity_2m,pressure_msl` +
			`&hourly=temperature_2m,pressure_msl` +
			`&daily=sunrise,sunset&timezone=auto&forecast_days=1&past_hours=3`;
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) return null;
		const json = await res.json();
		const now = new Date();

		const times: string[]          = json.hourly?.time ?? [];
		const hourlyPressure: number[] = json.hourly?.pressure_msl ?? [];
		const hourlyTemp: number[]     = json.hourly?.temperature_2m ?? [];
		const threeAgo = now.getTime() - 3 * 3_600_000;

		let oldIdx = 0, minDiff = Infinity;
		for (let i = 0; i < times.length; i++) {
			const d = Math.abs(new Date(times[i]).getTime() - threeAgo);
			if (d < minDiff) { minDiff = d; oldIdx = i; }
		}
		let nowIdx = 0;
		for (let i = 0; i < times.length; i++) {
			if (new Date(times[i]).getTime() <= now.getTime()) nowIdx = i;
		}

		const pressureNow  = (json.current?.pressure_msl ?? hourlyPressure[nowIdx]) as number;
		const pressureThen = (hourlyPressure[oldIdx] ?? pressureNow) as number;
		const tempNow      = (json.current?.temperature_2m ?? hourlyTemp[nowIdx]) as number;
		const tempThen     = (hourlyTemp[oldIdx] ?? tempNow) as number;

		const pressureDelta = Math.round((pressureNow - pressureThen) * 10) / 10;
		const tempDelta     = Math.abs(tempNow - tempThen);

		const lightingKey = getLightingKey(now, json.daily?.sunrise?.[0] ?? '', json.daily?.sunset?.[0] ?? '');

		const pScore = pressureDelta < -1.5 ? 10 : pressureDelta <= 1.5 ? 7 : 2;
		const lScore = (lightingKey === 'dawn' || lightingKey === 'dusk') ? 10
		             : lightingKey === 'golden'  ? 8
		             : (lightingKey === 'night' || lightingKey === 'morning') ? 6
		             : 2;
		const tScore = tempDelta >= 3 ? 2 : 10;
		const biteIndex = Math.round((pScore * 0.5 + lScore * 0.3 + tScore * 0.2) * 10) / 10;

		return {
			temperature:    json.current?.temperature_2m ?? null,
			humidity:       json.current?.relative_humidity_2m ?? null,
			pressure:       pressureNow != null ? Math.round(pressureNow) : null,
			pressureDelta,
			tempDelta:      Math.round(tempDelta * 10) / 10,
			moonPhaseIndex: getMoonPhaseIndex(now),
			lightingKey,
			biteIndex,
			biteScores:     { pressure: pScore, light: lScore, temp: tScore },
		};
	} catch {
		return null;
	}
}
