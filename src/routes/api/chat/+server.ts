import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { eq, like, and, desc } from 'drizzle-orm';
import { lure as lureTable, fishCatch as catchTable } from '$lib/server/db/schema';
import { fetchWeather, type WeatherData } from '$lib/server/biteIndex';

const MOON_PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];

const SYSTEM_PROMPT = `You are a fishing buddy AI integrated into OpenFishing, a personal fishing logbook app. You have access to the user's lures, catches, and spots via tools — call them whenever you need data to answer a question. Always use the available filter parameters to request only relevant data (e.g. filter by species when the user mentions a specific fish). Answer questions about their fishing data, give tackle recommendations, and provide practical fishing advice. Be concise and practical.`;

function buildContextBlock(
	datetime: string | undefined,
	lat: number | undefined,
	lng: number | undefined,
	weather: WeatherData | null
): string {
	const lines: string[] = [];

	if (datetime) lines.push(`Date/time: ${datetime}`);
	if (lat != null && lng != null) lines.push(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

	if (weather) {
		const pressureTrend = weather.pressureDelta > 0 ? `rising (+${weather.pressureDelta} hPa/3h)` : weather.pressureDelta < 0 ? `falling (${weather.pressureDelta} hPa/3h)` : 'stable';
		lines.push(`Temperature: ${weather.temperature}°C (Δ${weather.tempDelta}°C/3h)`);
		lines.push(`Humidity: ${weather.humidity}%`);
		lines.push(`Pressure: ${weather.pressure} hPa, ${pressureTrend}`);
		lines.push(`Light: ${weather.lightingKey}`);
		lines.push(`Moon: ${MOON_PHASES[weather.moonPhaseIndex]}`);
		lines.push(`Bite index: ${weather.biteIndex}/10`);
	}

	if (!lines.length) return '';
	return '\n\nCurrent context:\n' + lines.join('\n');
}

const TOOLS = [
	{
		type: 'function',
		function: {
			name: 'get_lures',
			description: 'Fetch fishing lures from the database. Always filter when the user mentions a specific fish species, water type, or lure type — do not fetch everything when a filter applies.',
			parameters: {
				type: 'object',
				properties: {
					species: {
						type: 'string',
						description: 'Return only lures suitable for this fish species. Use the species name exactly as the user wrote it — do NOT translate it to English. Partial match, so "Barsch" will match "Barsch", "Flussbarsch", etc.'
					},
					waterType: {
						type: 'string',
						enum: ['freshwater', 'saltwater'],
						description: 'Return only lures for this water type.'
					},
					type: {
						type: 'string',
						description: 'Return only lures of this type, e.g. "wobbler", "swimbait", "jig", "spoon".'
					},
					includeLost: {
						type: 'boolean',
						description: 'Whether to include lost lures. Defaults to false.'
					}
				},
				required: []
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'get_catches',
			description: 'Fetch logged catches from the database. Filter by species or limit to recent catches to avoid fetching the full history.',
			parameters: {
				type: 'object',
				properties: {
					species: {
						type: 'string',
						description: 'Return only catches of this fish species. Use the species name exactly as the user wrote it — do NOT translate it to English. Partial match.'
					},
					limit: {
						type: 'integer',
						description: 'Maximum number of catches to return, ordered by most recent first. Omit for all catches.'
					}
				},
				required: []
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'get_spots',
			description: 'Fetch fishing spots from the database, including their tags.',
			parameters: {
				type: 'object',
				properties: {
					tag: {
						type: 'string',
						description: 'Return only spots that have a tag containing this value. Use the name exactly as the user wrote it — do NOT translate it to English (e.g. pass "Rhein" not "Rhine", "See" not "lake").'
					}
				},
				required: []
			}
		}
	}
];

type LureArgs  = { species?: string; waterType?: string; type?: string; includeLost?: boolean };
type CatchArgs = { species?: string; limit?: number };
type SpotArgs  = { tag?: string };

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
	switch (name) {
		case 'get_lures': {
			const { species, waterType, type: lureType, includeLost = false } = args as LureArgs;

			const filters = [];
			if (!includeLost) filters.push(eq(lureTable.lost, false));
			if (species)   filters.push(like(lureTable.species,   `%${species}%`));
			if (waterType) filters.push(eq(lureTable.waterType,   waterType));
			if (lureType)  filters.push(like(lureTable.type,      `%${lureType}%`));

			const lures = await db.query.lure.findMany({
				where: filters.length ? and(...filters) : undefined,
				with: { tags: true }
			});
			return JSON.stringify(
				lures.map(({ photoPath: _, ...l }) => ({ ...l, tags: l.tags.map((t) => t.name) }))
			);
		}

		case 'get_catches': {
			const { species, limit } = args as CatchArgs;

			const filters = [];
			if (species) filters.push(like(catchTable.species, `%${species}%`));

			const catches = await db.query.fishCatch.findMany({
				where: filters.length ? and(...filters) : undefined,
				orderBy: [desc(catchTable.caughtAt)],
				limit: limit ?? undefined,
				with: { lure: true }
			});
			return JSON.stringify(
				catches.map(({ lure, ...c }) => ({
					...c,
					lure: lure ? { id: lure.id, name: lure.name } : null
				}))
			);
		}

		case 'get_spots': {
			const { tag } = args as SpotArgs;
			const spots = await db.query.spot.findMany({ with: { tags: true } });
			const filtered = tag
				? spots.filter((s) => s.tags.some((t) => t.name.toLowerCase().includes(tag.toLowerCase())))
				: spots;
			return JSON.stringify(
				filtered.map(({ ...s }) => ({ ...s, tags: s.tags.map((t) => t.name) }))
			);
		}

		default:
			return JSON.stringify({ error: 'Unknown tool' });
	}
}

export const POST: RequestHandler = async ({ request }) => {
	if (!env.CHATBOT || !env.LITELLM_URL || !env.LITELLM_MODEL) {
		error(503, 'Chatbot not configured');
	}

	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.messages)) error(400, 'messages array required');

	const ctx = body.context as { lat?: number; lng?: number; datetime?: string } | undefined;
	const weather = (ctx?.lat != null && ctx?.lng != null) ? await fetchWeather(ctx.lat, ctx.lng) : null;
	const systemContent = SYSTEM_PROMPT + buildContextBlock(ctx?.datetime, ctx?.lat, ctx?.lng, weather);

	const conversation: unknown[] = [
		{ role: 'system', content: systemContent },
		...body.messages
	];

	// Tool call loop — cap at 6 rounds to prevent runaway requests
	for (let round = 0; round < 6; round++) {
		let res: Response;
		try {
			res = await fetch(`${env.LITELLM_URL.replace(/\/$/, '')}/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model: env.LITELLM_MODEL, messages: conversation, tools: TOOLS, tool_choice: 'auto' })
			});
		} catch (e) {
			error(502, `LiteLLM unreachable: ${(e as Error).message}`);
		}

		if (!res.ok) {
			const text = await res.text();
			error(502, `LiteLLM error ${res.status}: ${text}`);
		}

		const data = await res.json();
		const msg = data.choices?.[0]?.message;
		if (!msg) error(502, 'Unexpected LiteLLM response shape');

		conversation.push(msg);

		if (!msg.tool_calls?.length) {
			return json({ reply: msg.content ?? '' });
		}

		// Execute all tool calls, then continue the loop
		const results = await Promise.all(
			msg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => ({
				role: 'tool' as const,
				tool_call_id: tc.id,
				content: await executeTool(
					tc.function.name,
					JSON.parse(tc.function.arguments || '{}')
				)
			}))
		);
		conversation.push(...results);
	}

	error(500, 'Tool call loop did not terminate');
};
