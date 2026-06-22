import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const LANG_NAMES: Record<string, string> = {
	en: 'English', de: 'German', fr: 'French', es: 'Spanish',
	it: 'Italian', nl: 'Dutch', pl: 'Polish', pt: 'Portuguese', uk: 'Ukrainian'
};

function buildPrompt(lang: string): string {
	const langName = LANG_NAMES[lang] ?? 'English';
	return `You are a fish species identification expert. Analyze this image of a fish catch and identify the species.

Respond ONLY with a valid JSON object in this exact format, with no text before or after:
{"species": "Common Name", "confidence": 85, "note": "Brief reason"}

Rules:
- species: the common name of the fish in ${langName}, or null if you cannot identify it
- confidence: integer 0–100 representing your certainty
- note: 1–2 sentences in ${langName} explaining your reasoning or why you could not identify it
- If the fish is not clearly visible, obscured, or you genuinely cannot identify it, set species to null and confidence to 0
- Do not guess blindly — if your confidence would be below 40, set species to null instead and be honest in the note`;
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
				max_tokens: 200
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
		return json({ species: null, confidence: null, note: 'Could not parse the model response.' });
	}

	try {
		const result = JSON.parse(jsonMatch[0]);
		const confidence = typeof result.confidence === 'number' ? Math.round(result.confidence) : null;
		const species = typeof result.species === 'string' && (confidence ?? 0) >= 40 ? result.species : null;
		return json({
			species,
			confidence,
			note: typeof result.note === 'string' ? result.note : ''
		});
	} catch {
		return json({ species: null, confidence: null, note: 'Could not parse the model response.' });
	}
};
