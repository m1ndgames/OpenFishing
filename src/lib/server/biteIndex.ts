/**
 * Bite index v2: an evidence-weighted, species-agnostic estimate (0–10) of how
 * favourable the current conditions are for angling.
 *
 * It starts at 5 (an ordinary day) and adds signed contributions sized by how
 * strongly field studies support each factor:
 *   - Light (strongest, consistent): twilight is the most reliable bite window,
 *     bright high sun lowers catch rates, cloud cover softens that
 *     (Shaw et al. 2021, PLOS ONE; Kuparinen et al. 2010; Stoner 2004).
 *   - Temperature trend: a sudden cold snap (cold front) slows most fish down;
 *     the direction of absolute temperature effects is species-specific, so only
 *     the change is scored (Stoner 2004; Quigley et al. 2023).
 *   - Severe weather and wind: thunderstorms and gales shut the bite (and the
 *     angler) down; a light breeze is mildly positive (Kuparinen et al. 2010).
 *   - Pressure trend: weak / no support in peer-reviewed work (Shaw et al. 2021),
 *     so it only gets a small term.
 *   - Moon: small effects of roughly 5 % near new and full moon
 *     (Vinson & Angradi 2014; Pulver 2017); solunar tables fail (Quigley 2023).
 */

export type LightingKey = 'night' | 'dawn' | 'morning' | 'day' | 'golden' | 'dusk';

export function getMoonPhaseIndex(date: Date): number {
	const reference = new Date('2000-01-06T18:14:00Z').getTime();
	const lunarCycleDays = 29.53058867;
	const elapsed = (date.getTime() - reference) / 86_400_000;
	const phase = ((elapsed % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
	return Math.floor(((phase / lunarCycleDays) + 1 / 16) * 8) % 8;
}

const RAD = Math.PI / 180;

/**
 * Solar elevation in degrees (NOAA solar position algorithm, ~0.1° accuracy,
 * no atmospheric refraction). Depends only on coordinates and the instant, so it
 * is correct in any timezone.
 */
export function sunElevation(lat: number, lng: number, date: Date): number {
	const ms = date.getTime();
	const jd = ms / 86_400_000 + 2440587.5;
	const T = (jd - 2451545) / 36525;

	const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
	const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
	const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
	const C =
		Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
		Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
		Math.sin(3 * M * RAD) * 0.000289;
	const omega = 125.04 - 1934.136 * T;
	const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
	const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
	const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
	const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));

	const y = Math.tan((eps * RAD) / 2) ** 2;
	const eqTimeMin =
		(4 / RAD) *
		(y * Math.sin(2 * L0 * RAD) -
			2 * e * Math.sin(M * RAD) +
			4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
			0.5 * y * y * Math.sin(4 * L0 * RAD) -
			1.25 * e * e * Math.sin(2 * M * RAD));

	const utcMinutes = (((ms % 86_400_000) + 86_400_000) % 86_400_000) / 60_000;
	const trueSolarMin = (((utcMinutes + eqTimeMin + 4 * lng) % 1440) + 1440) % 1440;
	const hourAngle = trueSolarMin / 4 - 180;

	const cosZenith =
		Math.sin(lat * RAD) * Math.sin(decl) +
		Math.cos(lat * RAD) * Math.cos(decl) * Math.cos(hourAngle * RAD);
	return 90 - Math.acos(Math.min(1, Math.max(-1, cosZenith))) / RAD;
}

/** Human-readable light phase, derived from the sun's elevation and direction. */
export function getLightingKey(lat: number, lng: number, date: Date): LightingKey {
	const elev = sunElevation(lat, lng, date);
	const rising = sunElevation(lat, lng, new Date(date.getTime() + 10 * 60_000)) > elev;
	if (elev < -6) return 'night';
	if (elev <= 6) return rising ? 'dawn' : 'dusk';
	if (elev <= 20) return rising ? 'morning' : 'golden';
	return 'day';
}

export type BiteInputs = {
	/** Solar elevation in degrees. */
	sunElevation: number;
	/** Total cloud cover in %. */
	cloudCover: number | null;
	/** Mean air temperature of the last 24 h minus the mean of the 72 h before (°C). */
	tempTrend: number | null;
	/** Mean air temperature of the 72 h before the last 24 h (°C). */
	tempBaseline: number | null;
	/** Wind speed at 10 m (m/s). */
	windSpeed: number | null;
	/** Wind gusts at 10 m (m/s). */
	windGusts: number | null;
	/** WMO weather code. */
	weatherCode: number | null;
	/** Pressure change over the last 3 h (hPa). */
	pressureDelta: number;
	/** 0–7, 0 = new moon, 4 = full moon. */
	moonPhaseIndex: number;
};

export type BiteContributions = {
	light: number;
	tempTrend: number;
	wind: number;
	weather: number;
	pressure: number;
	moon: number;
};

export const BITE_BASELINE = 5;

const round1 = (n: number) => Math.round(n * 10) / 10;

function lightScore(elev: number, cloud: number | null): number {
	if (elev >= -6 && elev <= 6) return 2;
	if (elev > 6 && elev <= 20) return 0.8;
	if (elev > 20) return round1(-1 * (1 - ((cloud ?? 0) / 100) * 0.7));
	if (elev >= -18) return 0.3;
	return -0.3;
}

function tempTrendScore(trend: number | null, baseline: number | null): number {
	if (trend == null) return 0;
	if (trend <= -5) return -1.5;
	if (trend <= -3) return -0.8;
	if (trend >= 3 && baseline != null && baseline < 15) return 0.4;
	return 0;
}

function windScore(speed: number | null, gusts: number | null): number {
	if ((speed != null && speed > 12) || (gusts != null && gusts > 17)) return -1;
	if (speed != null && speed >= 1.5 && speed <= 8) return 0.5;
	return 0;
}

function weatherScore(code: number | null): number {
	if (code == null) return 0;
	if (code === 95 || code === 96 || code === 99) return -2.5;
	if (code === 65 || code === 67 || code === 82) return -0.7;
	if (code === 51 || code === 53 || code === 61 || code === 80) return 0.3;
	return 0;
}

function pressureScore(delta: number): number {
	if (delta < -4) return -0.5;
	if (delta >= -3 && delta <= -1) return 0.5;
	if (delta > 2) return -0.5;
	return 0;
}

export function computeBiteIndex(inputs: BiteInputs): { biteIndex: number; contributions: BiteContributions } {
	const contributions: BiteContributions = {
		light: lightScore(inputs.sunElevation, inputs.cloudCover),
		tempTrend: tempTrendScore(inputs.tempTrend, inputs.tempBaseline),
		wind: windScore(inputs.windSpeed, inputs.windGusts),
		weather: weatherScore(inputs.weatherCode),
		pressure: pressureScore(inputs.pressureDelta),
		moon: inputs.moonPhaseIndex === 0 || inputs.moonPhaseIndex === 4 ? 0.3 : 0,
	};
	const sum = Object.values(contributions).reduce((a, b) => a + b, 0);
	const biteIndex = round1(Math.min(10, Math.max(0, BITE_BASELINE + sum)));
	return { biteIndex, contributions };
}

export type WeatherData = {
	temperature: number | null;
	humidity: number | null;
	pressure: number | null;
	pressureDelta: number;
	tempDelta: number;
	tempTrend: number | null;
	windSpeed: number | null;
	windGusts: number | null;
	cloudCover: number | null;
	weatherCode: number | null;
	sunElevation: number;
	moonPhaseIndex: number;
	lightingKey: LightingKey;
	biteIndex: number;
	biteContributions: BiteContributions;
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
	try {
		const url =
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
			`&current=temperature_2m,relative_humidity_2m,pressure_msl,cloud_cover,wind_speed_10m,wind_gusts_10m,weather_code` +
			`&hourly=temperature_2m,pressure_msl` +
			`&wind_speed_unit=ms&timeformat=unixtime&timezone=GMT&past_days=4&forecast_days=1`;
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) return null;
		const json = await res.json();
		const now = new Date();
		const nowSec = now.getTime() / 1000;

		// Unix seconds: no local-time parsing, so the server's timezone can't shift the hour.
		const times: number[]          = json.hourly?.time ?? [];
		const hourlyPressure: number[] = json.hourly?.pressure_msl ?? [];
		const hourlyTemp: number[]     = json.hourly?.temperature_2m ?? [];

		let nowIdx = -1;
		for (let i = 0; i < times.length; i++) if (times[i] <= nowSec) nowIdx = i;

		let oldIdx = -1, minDiff = Infinity;
		for (let i = 0; i < times.length; i++) {
			const d = Math.abs(times[i] - (nowSec - 3 * 3600));
			if (d < minDiff) { minDiff = d; oldIdx = i; }
		}

		const cur = json.current ?? {};
		const pressureNow  = isNum(cur.pressure_msl) ? cur.pressure_msl : (nowIdx >= 0 ? hourlyPressure[nowIdx] : null);
		const tempNow      = isNum(cur.temperature_2m) ? cur.temperature_2m : (nowIdx >= 0 ? hourlyTemp[nowIdx] : null);
		const pressureThen = oldIdx >= 0 && isNum(hourlyPressure[oldIdx]) ? hourlyPressure[oldIdx] : pressureNow;
		const tempThen     = oldIdx >= 0 && isNum(hourlyTemp[oldIdx]) ? hourlyTemp[oldIdx] : tempNow;

		const pressureDelta = isNum(pressureNow) && isNum(pressureThen) ? round1(pressureNow - pressureThen) : 0;
		const tempDelta     = isNum(tempNow) && isNum(tempThen) ? round1(Math.abs(tempNow - tempThen)) : 0;

		// Cold-front proxy: last 24 h mean vs the 72 h before.
		let tempTrend: number | null = null;
		let tempBaseline: number | null = null;
		if (nowIdx >= 95) {
			const recent = hourlyTemp.slice(nowIdx - 23, nowIdx + 1).filter(isNum);
			const before = hourlyTemp.slice(nowIdx - 95, nowIdx - 23).filter(isNum);
			if (recent.length >= 18 && before.length >= 54) {
				tempBaseline = round1(mean(before));
				tempTrend = round1(mean(recent) - mean(before));
			}
		}

		const elev = sunElevation(lat, lng, now);
		const moonPhaseIndex = getMoonPhaseIndex(now);
		const cloudCover  = isNum(cur.cloud_cover) ? cur.cloud_cover : null;
		const windSpeed   = isNum(cur.wind_speed_10m) ? round1(cur.wind_speed_10m) : null;
		const windGusts   = isNum(cur.wind_gusts_10m) ? round1(cur.wind_gusts_10m) : null;
		const weatherCode = isNum(cur.weather_code) ? cur.weather_code : null;

		const { biteIndex, contributions } = computeBiteIndex({
			sunElevation: elev,
			cloudCover,
			tempTrend,
			tempBaseline,
			windSpeed,
			windGusts,
			weatherCode,
			pressureDelta,
			moonPhaseIndex,
		});

		return {
			temperature:    isNum(cur.temperature_2m) ? cur.temperature_2m : null,
			humidity:       isNum(cur.relative_humidity_2m) ? cur.relative_humidity_2m : null,
			pressure:       isNum(pressureNow) ? Math.round(pressureNow) : null,
			pressureDelta,
			tempDelta,
			tempTrend,
			windSpeed,
			windGusts,
			cloudCover,
			weatherCode,
			sunElevation:   round1(elev),
			moonPhaseIndex,
			lightingKey:    getLightingKey(lat, lng, now),
			biteIndex,
			biteContributions: contributions,
		};
	} catch {
		return null;
	}
}
