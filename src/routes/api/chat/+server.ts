import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { eq, like, and, desc, gte, lte, sql } from 'drizzle-orm';
import { lure as lureTable, fishCatch as catchTable, spot as spotTable, rod as rodTable, reel as reelTable, fishingLine as lineTable, combo as comboTable, reelLineLog, chatMessage as chatMessageTable } from '$lib/server/db/schema';
import { fetchWeather, type WeatherData } from '$lib/server/biteIndex';
import { ownerId, userFilter } from '$lib/server/scope';
import { translations, type Lang } from '$lib/i18n';

const MOON_PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];

const LANG_NAMES: Record<string, string> = {
	en: 'English', de: 'German', fr: 'French', es: 'Spanish',
	it: 'Italian', nl: 'Dutch', pl: 'Polish', pt: 'Portuguese', uk: 'Ukrainian'
};

function buildSystemPrompt(lang: string): string {
	const langName = LANG_NAMES[lang] ?? 'English';
	return `You are a fishing buddy AI integrated into OpenFishing, a personal fishing logbook app. You have access to the user's lures, catches, and spots via tools — call them whenever you need data to answer a question.

When calling get_lures, always apply as many filters as possible to return only relevant results:
- Filter by species when the user mentions a target fish.
- Filter by waterType when the context makes it clear (river/sea/lake).
- Use minLightConditions/maxLightConditions based on current light conditions from the context block: bright sunny day → minLightConditions 7, overcast → 4–6, dawn/dusk → 2–4, night → 0–2.
- Filter by color or type when the user or conditions suggest it (e.g. natural colors on clear days, bright/UV colors in murky water or low light).
- Never fetch all lures without any filter unless the user explicitly asks to see everything.

When mentioning a specific lure by name, always format it as a markdown link using its id: [Lure Name](/lures/ID). Never use plain text for lure names when you have the id available.

Answer questions about their fishing data, give tackle recommendations, and provide practical fishing advice. Be concise and practical.

Always respond in ${langName}. Use fish species names, lure types, and fishing terminology as commonly used in ${langName}.`;
}

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
			description: 'Fetch fishing lures from the database. Always filter when the user mentions a specific fish species, water type, or lure type — do not fetch everything when a filter applies. Returns up to 20 lures by default; check the returned total to decide if you need to paginate.',
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
					color: {
						type: 'string',
						description: 'Return only lures whose color contains this value. Use the color name as the user wrote it — do NOT translate. E.g. "natural", "chartreuse", "white".'
					},
					minLightConditions: {
						type: 'integer',
						description: 'Return only lures with lightConditions >= this value (0=Night, 10=Clear/sunny). Use the current light context to filter: bright sunny day → 7, overcast → 4, dawn/dusk → 2, night → 0.'
					},
					maxLightConditions: {
						type: 'integer',
						description: 'Return only lures with lightConditions <= this value. Combine with minLightConditions to target a range.'
					},
					includeLost: {
						type: 'boolean',
						description: 'Whether to include lost lures. Defaults to false.'
					},
					limit: {
						type: 'integer',
						description: 'Maximum number of lures to return. Defaults to 20.'
					},
					offset: {
						type: 'integer',
						description: 'Number of lures to skip — use with limit to paginate through results if total exceeds limit.'
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
	},
	{
		type: 'function',
		function: {
			name: 'get_rods',
			description: 'Fetch fishing rods from the database.',
			parameters: {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						description: 'Filter by rod type, e.g. "Spinning", "Casting", "Feeder".'
					},
					brand: {
						type: 'string',
						description: 'Filter by brand name (partial match).'
					}
				},
				required: []
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'get_reels',
			description: 'Fetch fishing reels from the database. Each reel includes the currently spooled line if one has been logged.',
			parameters: {
				type: 'object',
				properties: {
					brand: {
						type: 'string',
						description: 'Filter by brand name (partial match).'
					}
				},
				required: []
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'get_lines',
			description: 'Fetch fishing lines from the database.',
			parameters: {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						description: 'Filter by line type: "Mono", "Braid", or "Fluoro".'
					},
					brand: {
						type: 'string',
						description: 'Filter by brand name (partial match).'
					}
				},
				required: []
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'get_combos',
			description: 'Fetch all tackle combos from the database. Each combo includes the linked rod, reel, and the currently spooled line on the reel.',
			parameters: {
				type: 'object',
				properties: {},
				required: []
			}
		}
	}
];

type LureArgs  = { species?: string; waterType?: string; type?: string; color?: string; minLightConditions?: number; maxLightConditions?: number; includeLost?: boolean; limit?: number; offset?: number };
type CatchArgs = { species?: string; limit?: number };
type SpotArgs  = { tag?: string };
type RodArgs   = { type?: string; brand?: string };
type ReelArgs  = { brand?: string };
type LineArgs  = { type?: string; brand?: string };

async function executeTool(name: string, args: Record<string, unknown>, locals: App.Locals): Promise<string> {
	switch (name) {
		case 'get_lures': {
			const { species, waterType, type: lureType, color, minLightConditions, maxLightConditions, includeLost = false, limit = 20, offset = 0 } = args as LureArgs;

			const filters = [];
			filters.push(userFilter(locals, lureTable.userId));
			if (!includeLost) filters.push(eq(lureTable.lost, false));
			if (species)             filters.push(like(lureTable.species,          `%${species}%`));
			if (waterType)           filters.push(eq(lureTable.waterType,           waterType));
			if (lureType)            filters.push(like(lureTable.type,              `%${lureType}%`));
			if (color)               filters.push(like(lureTable.color,             `%${color}%`));
			if (minLightConditions != null) filters.push(gte(lureTable.lightConditions, minLightConditions));
			if (maxLightConditions != null) filters.push(lte(lureTable.lightConditions, maxLightConditions));

			const whereClause = filters.length ? and(...filters) : undefined;
			const [lures, allMatching] = await Promise.all([
				db.query.lure.findMany({ where: whereClause, limit, offset, with: { tags: true } }),
				db.query.lure.findMany({ where: whereClause, columns: { id: true } })
			]);
			const total = allMatching.length;
			return JSON.stringify({
				total,
				offset,
				results: lures.map(({ photoPath: _p, shareToken: _s, qrCoded: _q, lureNumber: _n, createdAt: _c, updatedAt: _u, ...l }) => ({
					...l,
					tags: l.tags.map((t) => t.name)
				}))
			});
		}

		case 'get_catches': {
			const { species, limit } = args as CatchArgs;

			const filters = [];
			filters.push(userFilter(locals, catchTable.userId));
			if (species) filters.push(like(catchTable.species, `%${species}%`));

			const catches = await db.query.fishCatch.findMany({
				where: filters.length ? and(...filters) : undefined,
				orderBy: [desc(catchTable.caughtAt)],
				limit: limit ?? undefined,
				with: { lure: true }
			});
			return JSON.stringify(
				catches.map(({ lure, id: _, shareToken: _s, createdAt: _c, updatedAt: _u, ...c }) => ({
					...c,
					lure: lure ? { name: lure.name } : null
				}))
			);
		}

		case 'get_spots': {
			const { tag } = args as SpotArgs;
			const spots = await db.query.spot.findMany({ where: userFilter(locals, spotTable.userId), with: { tags: true } });
			const filtered = tag
				? spots.filter((s) => s.tags.some((t) => t.name.toLowerCase().includes(tag.toLowerCase())))
				: spots;
			return JSON.stringify(
				filtered.map(({ id: _, shareToken: _s, createdAt: _c, updatedAt: _u, ...s }) => ({
					...s,
					tags: s.tags.map((t) => t.name)
				}))
			);
		}

		case 'get_rods': {
			const { type: rodType, brand } = args as RodArgs;
			const filters = [userFilter(locals, rodTable.userId)];
			if (rodType) filters.push(like(rodTable.type, `%${rodType}%`));
			if (brand)   filters.push(like(rodTable.brand, `%${brand}%`));
			const rods = await db.select().from(rodTable).where(and(...filters));
			return JSON.stringify(rods.map(({ createdAt: _c, updatedAt: _u, ...r }) => r));
		}

		case 'get_reels': {
			const { brand } = args as ReelArgs;
			const filters = [userFilter(locals, reelTable.userId)];
			if (brand) filters.push(like(reelTable.brand, `%${brand}%`));
			const [reels, allLogs] = await Promise.all([
				db.select().from(reelTable).where(and(...filters)),
				db.query.reelLineLog.findMany({
					with: { line: true },
					orderBy: [desc(reelLineLog.spooledAt)]
				})
			]);
			const currentByReel = new Map<string, typeof allLogs[number]>();
			for (const log of allLogs) {
				if (!currentByReel.has(log.reelId)) currentByReel.set(log.reelId, log);
			}
			return JSON.stringify(reels.map(({ createdAt: _c, updatedAt: _u, ...r }) => {
				const log = currentByReel.get(r.id) ?? null;
				return {
					...r,
					currentLine: log ? {
						brand: log.line?.brand ?? null,
						model: log.line?.model ?? null,
						type: log.line?.type ?? null,
						spooledAt: log.spooledAt
					} : null
				};
			}));
		}

		case 'get_lines': {
			const { type: lineType, brand } = args as LineArgs;
			const filters = [userFilter(locals, lineTable.userId)];
			if (lineType) filters.push(like(lineTable.type, `%${lineType}%`));
			if (brand)    filters.push(like(lineTable.brand, `%${brand}%`));
			const lines = await db.select().from(lineTable).where(and(...filters));
			return JSON.stringify(lines.map(({ createdAt: _c, updatedAt: _u, ...l }) => l));
		}

		case 'get_combos': {
			const [combos, allLogs] = await Promise.all([
				db.query.combo.findMany({ where: userFilter(locals, comboTable.userId), with: { rod: true, reel: true } }),
				db.query.reelLineLog.findMany({
					with: { line: true },
					orderBy: [desc(reelLineLog.spooledAt)]
				})
			]);
			const currentByReel = new Map<string, typeof allLogs[number]>();
			for (const log of allLogs) {
				if (!currentByReel.has(log.reelId)) currentByReel.set(log.reelId, log);
			}
			return JSON.stringify(combos.map(({ rod: r, reel: re, createdAt: _c, updatedAt: _u, ...c }) => {
				const log = re ? (currentByReel.get(re.id) ?? null) : null;
				return {
					...c,
					rod: r ? { brand: r.brand, model: r.model, type: r.type } : null,
					reel: re ? { brand: re.brand, model: re.model, size: re.size } : null,
					currentLine: log ? {
						brand: log.line?.brand ?? null,
						model: log.line?.model ?? null,
						type: log.line?.type ?? null,
						spooledAt: log.spooledAt
					} : null
				};
			}));
		}

		default:
			return JSON.stringify({ error: 'Unknown tool' });
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	if (env.DEMO_MODE) return json([]);
	if (!env.CHATBOT) error(503, 'Chatbot not configured');
	if (locals.user && !locals.user.chatbotEnabled) error(403, 'Chatbot disabled for this user');

	const sessions = await db
		.select({
			sessionId: chatMessageTable.sessionId,
			firstMessage: sql<string>`MIN(CASE WHEN ${chatMessageTable.role} = 'user' THEN ${chatMessageTable.content} END)`,
			lastAt: sql<number>`MAX(${chatMessageTable.createdAt})`,
			count: sql<number>`COUNT(*)`
		})
		.from(chatMessageTable)
		.where(userFilter(locals, chatMessageTable.userId))
		.groupBy(chatMessageTable.sessionId)
		.orderBy(sql`MAX(${chatMessageTable.createdAt}) DESC`);

	return json(sessions);
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	if (env.DEMO_MODE) {
		const demoLang = (cookies.get('lang') ?? 'en') as Lang;
		return json({ reply: (translations[demoLang] ?? translations.en).chatbotDemoDisabled });
	}
	if (!env.CHATBOT || !env.LITELLM_URL || !env.LITELLM_MODEL) {
		error(503, 'Chatbot not configured');
	}
	if (locals.user && !locals.user.chatbotEnabled) error(403, 'Chatbot disabled for this user');

	const body = await request.json().catch(() => null);
	if (!body || !Array.isArray(body.messages)) error(400, 'messages array required');
	const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
	const lastUserMessage = body.messages.findLast((m: { role: string }) => m.role === 'user') as { role: string; content: string } | undefined;

	const lang = cookies.get('lang') ?? 'en';
	const ctx = body.context as { lat?: number; lng?: number; datetime?: string } | undefined;
	const weather = (ctx?.lat != null && ctx?.lng != null) ? await fetchWeather(ctx.lat, ctx.lng) : null;
	const systemContent = buildSystemPrompt(lang) + buildContextBlock(ctx?.datetime, ctx?.lat, ctx?.lng, weather);

	const conversation: unknown[] = [
		{ role: 'system', content: systemContent },
		...body.messages
	];

	// Tool call loop — cap at 6 rounds to prevent runaway requests
	for (let round = 0; round < 6; round++) {
		console.log(`[chat] round ${round} — sending ${JSON.stringify(conversation).length} bytes to LiteLLM`);
		let res: Response;
		try {
			const abort = AbortSignal.timeout(45_000);
			res = await fetch(`${env.LITELLM_URL.replace(/\/$/, '')}/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model: env.LITELLM_MODEL, messages: conversation, tools: TOOLS, tool_choice: 'auto' }),
				signal: abort
			});
		} catch (e) {
			console.error(`[chat] round ${round} fetch error:`, (e as Error).message);
			error(502, `LiteLLM unreachable: ${(e as Error).message}`);
		}

		console.log(`[chat] round ${round} — LiteLLM responded ${res.status}`);
		if (!res.ok) {
			const text = await res.text().catch(() => '(unreadable body)');
			console.error(`[chat] round ${round} — LiteLLM error body:`, text);
			error(502, `LiteLLM error ${res.status}: ${text}`);
		}

		const data = await res.json();
		const msg = data.choices?.[0]?.message;
		if (!msg) error(502, 'Unexpected LiteLLM response shape');

		conversation.push(msg);

		if (!msg.tool_calls?.length) {
			const reply = msg.content ?? '';
			if (!env.DEMO_MODE && sessionId && lastUserMessage) {
				try {
					const uid = ownerId(locals);
					await db.insert(chatMessageTable).values([
						{ userId: uid, sessionId, role: 'user', content: lastUserMessage.content },
						{ userId: uid, sessionId, role: 'assistant', content: reply }
					]);
				} catch (e) {
					console.error('[chat] failed to save messages:', e);
				}
			}
			return json({ reply });
		}

		// Execute all tool calls, then continue the loop
		const results = await Promise.all(
			msg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => ({
				role: 'tool' as const,
				tool_call_id: tc.id,
				content: await executeTool(
					tc.function.name,
					JSON.parse(tc.function.arguments || '{}'),
					locals
				)
			}))
		);
		conversation.push(...results);
	}

	error(500, 'Tool call loop did not terminate');
};
