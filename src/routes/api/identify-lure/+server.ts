import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const LANG_NAMES: Record<string, string> = {
	en: 'English', de: 'German', fr: 'French', es: 'Spanish',
	it: 'Italian', nl: 'Dutch', pl: 'Polish', pt: 'Portuguese', uk: 'Ukrainian'
};

const PROMPT_BASE = `You are a fishing lure identification expert. Analyze this image of a fishing lure and identify as many fields as possible.

Respond ONLY with a valid JSON object in this exact format, with no text before or after:
{"brand":null,"name":null,"type":null,"color":null,"weight":null,"size":null,"runningDepth":null,"waterType":null,"lightConditions":null,"species":null,"notes":""}

Field rules:
- brand: manufacturer name — set if a logo/text is visible, OR if the lure has distinctive design characteristics that strongly suggest a specific brand (e.g. Rapala's metal-cup line tie at nose and tail, body shape, hardware style; Savage Gear's realistic finishes; Storm's Thunderstick profile). Do NOT default to "generic" or "unknown" for recognizable designs — use your visual knowledge of well-known lure manufacturers. Set null only if the lure is truly unrecognizable.
- name: model name — set if markings are readable, OR if you confidently recognize the model from its distinctive shape, hardware, and color (e.g. Rapala Original Floater F-series, Rapala CD Magnum, Savage Gear 4Play). Well-known classic lures can be identified by visual characteristics alone. Set null only if genuinely uncertain.
- type: lure category from this list: Crankbait, Jerkbait, Popper, Stickbait, Swimbait, Twitchbait, Wobbler, Spoon, Spinner, Spinnerbait, Buzzbait, Chatterbait, Jig, Soft Plastic, Frog, Shad — pick the single best match, or null
- color: the official color name as used by the manufacturer (e.g. "Fire Tiger", "Gold Fluorescent Red Head", "Natural Perch", "Clown") — set only if you can confidently identify the official color name or code. Do NOT invent a description like "yellow with red markings". Set null if you cannot match it to a known official color name.
- weight: weight in grams as a number — only set if text markings are visible (e.g. "7g"), otherwise null
- size: length in centimeters as a number — only set if text markings are visible (e.g. "7cm"), otherwise null
- runningDepth: only set for lures whose depth is determined by their physical design (lip size/angle on crankbaits, jerkbaits, wobblers). Use "shallow" for surface/shallow runners (no lip or tiny lip), "medium" for moderate-diving lips, "deep" for large/long diving lips. Set null for lures where depth is controlled by the angler's technique, not the lure's design — this includes spinners, spinnerbaits, spoons, jigs, soft plastics, shads, swimbaits, buzzbaits, and any other weight-based or technique-driven lure.
- waterType: "freshwater" or "saltwater" — only set if you are fairly confident (bright/flashy colors suggest saltwater, natural minnow patterns suggest freshwater), otherwise null
- lightConditions: integer 0–10 inferred from the lure's color and UV/glow properties — always provide this when the color is visible. Scale: 0=Night (dark/black with glow or UV), 1=Twilight, 2=Very dark (UV/glow colors like chartreuse UV, pink glow), 3=Dark (bright neon/UV without glow), 4=Dim (bright orange, bright yellow), 5=Overcast (mixed bright+natural), 6=Medium (balanced natural+flash), 7=Slightly cloudy (natural patterns with some flash), 8=Slightly hazy (natural realistic patterns), 9=Sunny (silver/gold flash, clear natural), 10=Clear (subtle natural, pearl, ghost). Examples: chartreuse UV or pink glow → 1–2; bright orange/yellow → 4; fire tiger → 4–5; natural perch/roach → 7–8; silver/gold → 9; ghost/pearl → 9–10
- species: array of likely target species based on lure type/size (e.g. ["Pike", "Perch"] or ["Bass"] or ["Salmon", "Trout"]) — always provide if type is identifiable, otherwise null
- notes: 1–2 sentences explaining what you see and your confidence

Use your visual knowledge confidently for well-known lures. For obscure or ambiguous lures, prefer null over a guess. Never call a lure a "clone" or "generic" based on appearance alone — if it matches a known model, name it.`;

function buildPrompt(lang: string): string {
	const langName = LANG_NAMES[lang] ?? 'English';
	return PROMPT_BASE + `\n\nIMPORTANT: Write the species names in ${langName} (e.g. "Hecht" not "Pike" in German). Write the notes field in ${langName}.`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const model = env.LITELLM_VISION_MODEL || env.LITELLM_MODEL;
	if (!model || !env.LITELLM_URL) {
		error(503, 'Vision model not configured — set LITELLM_VISION_MODEL or LITELLM_MODEL');
	}

	const lang = cookies.get('lang') ?? 'en';
	const body = await request.json().catch(() => null);
	if (!body?.imageData || typeof body.imageData !== 'string') {
		error(400, 'imageData required');
	}

	let res: Response;
	try {
		res = await fetch(`${env.LITELLM_URL.replace(/\/$/, '')}/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'user',
						content: [
							{ type: 'text', text: buildPrompt(lang) },
							{ type: 'image_url', image_url: { url: body.imageData } }
						]
					}
				],
				max_tokens: 400
			}),
			signal: AbortSignal.timeout(30_000)
		});
	} catch (e) {
		error(502, `Vision model unreachable: ${(e as Error).message}`);
	}

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		error(502, `Vision model error ${res.status}: ${text}`);
	}

	const data = await res.json();
	const content: string = data.choices?.[0]?.message?.content ?? '';

	const jsonMatch = content.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		return json({ brand: null, name: null, type: null, color: null, weight: null, size: null, runningDepth: null, waterType: null, lightConditions: null, species: null, notes: 'Could not parse the model response.' });
	}

	try {
		const result = JSON.parse(jsonMatch[0]);
		const lc = typeof result.lightConditions === 'number' ? Math.round(result.lightConditions) : null;
		return json({
			brand: typeof result.brand === 'string' ? result.brand : null,
			name: typeof result.name === 'string' ? result.name : null,
			type: typeof result.type === 'string' ? result.type : null,
			color: typeof result.color === 'string' ? result.color : null,
			weight: typeof result.weight === 'number' ? result.weight : null,
			size: typeof result.size === 'number' ? result.size : null,
			runningDepth: ['shallow', 'medium', 'deep'].includes(result.runningDepth) ? result.runningDepth : null,
			waterType: ['freshwater', 'saltwater'].includes(result.waterType) ? result.waterType : null,
			lightConditions: lc !== null && lc >= 0 && lc <= 10 ? lc : null,
			species: Array.isArray(result.species) ? result.species.filter((s: unknown) => typeof s === 'string') : null,
			notes: typeof result.notes === 'string' ? result.notes : ''
		});
	} catch {
		return json({ brand: null, name: null, type: null, color: null, weight: null, size: null, runningDepth: null, waterType: null, lightConditions: null, species: null, notes: 'Could not parse the model response.' });
	}
};
