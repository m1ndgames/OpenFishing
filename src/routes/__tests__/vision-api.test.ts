import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	json: (data: any) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockEnv = await import('../../__mocks__/env');

const { POST: identifyFish } = await import('../api/identify-fish/+server');
const { POST: identifyLure } = await import('../api/identify-lure/+server');

function makeReq(body: any, lang = 'en'): any {
	return {
		request: { json: () => Promise.resolve(body) },
		cookies: { get: vi.fn().mockReturnValue(lang) },
	};
}

function mockLiteLLMResponse(content: string) {
	mockFetch.mockResolvedValue({
		ok: true,
		json: () => Promise.resolve({ choices: [{ message: { content } }] }),
	});
}

// ─── identify-fish ────────────────────────────────────────────────────────────

describe('POST /api/identify-fish', () => {
	beforeEach(() => {
		mockEnv.env.LITELLM_MODEL = 'gpt-4o';
		mockEnv.env.LITELLM_URL = 'http://litellm:4000';
		mockEnv.env.LITELLM_VISION_MODEL = undefined;
		mockFetch.mockReset();
	});

	it('returns 503 when model not configured', async () => {
		mockEnv.env.LITELLM_MODEL = undefined;
		await expect(identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 503 });
	});

	it('returns 503 when URL not configured', async () => {
		mockEnv.env.LITELLM_URL = undefined;
		await expect(identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 503 });
	});

	it('returns 400 when imageData is missing', async () => {
		await expect(identifyFish(makeReq({}))).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 when imageData is not a string', async () => {
		await expect(identifyFish(makeReq({ imageData: 123 }))).rejects.toMatchObject({ status: 400 });
	});

	it('returns 502 when fetch throws (unreachable)', async () => {
		mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
		await expect(identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 502 });
	});

	it('returns 502 when LiteLLM responds with error status', async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('internal error') });
		await expect(identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 502 });
	});

	it('returns parsed species and confidence', async () => {
		mockLiteLLMResponse('{"species":"Pike","confidence":90,"note":"Clear fin pattern"}');
		const res = await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.species).toBe('Pike');
		expect(data.confidence).toBe(90);
		expect(data.note).toBe('Clear fin pattern');
	});

	it('sets species to null when confidence is below 40', async () => {
		mockLiteLLMResponse('{"species":"Perch","confidence":30,"note":"Very unclear image"}');
		const res = await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.species).toBeNull();
		expect(data.confidence).toBe(30);
	});

	it('handles response with no JSON block gracefully', async () => {
		mockLiteLLMResponse('Sorry, I cannot identify this fish.');
		const res = await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.species).toBeNull();
		expect(data.confidence).toBeNull();
	});

	it('uses LITELLM_VISION_MODEL when set instead of LITELLM_MODEL', async () => {
		mockEnv.env.LITELLM_VISION_MODEL = 'claude-3-5-sonnet';
		mockLiteLLMResponse('{"species":"Trout","confidence":85,"note":"Spotted pattern"}');
		await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.model).toBe('claude-3-5-sonnet');
	});

	it('strips trailing slash from LITELLM_URL', async () => {
		mockEnv.env.LITELLM_URL = 'http://litellm:4000/';
		mockLiteLLMResponse('{"species":"Bass","confidence":80,"note":"ok"}');
		await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		expect(mockFetch.mock.calls[0][0]).toBe('http://litellm:4000/chat/completions');
	});

	it('responds in the requested language', async () => {
		mockLiteLLMResponse('{"species":"Hecht","confidence":88,"note":"Typische Kieferform"}');
		const res = await identifyFish(makeReq({ imageData: 'data:image/jpeg;base64,abc' }, 'de'));
		const data = await res.json();
		expect(data.species).toBe('Hecht');
	});
});

// ─── identify-lure ────────────────────────────────────────────────────────────

describe('POST /api/identify-lure', () => {
	beforeEach(() => {
		mockEnv.env.LITELLM_MODEL = 'gpt-4o';
		mockEnv.env.LITELLM_URL = 'http://litellm:4000';
		mockEnv.env.LITELLM_VISION_MODEL = undefined;
		mockFetch.mockReset();
	});

	it('returns 503 when not configured', async () => {
		mockEnv.env.LITELLM_MODEL = undefined;
		await expect(identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 503 });
	});

	it('returns 400 when imageData is missing', async () => {
		await expect(identifyLure(makeReq({}))).rejects.toMatchObject({ status: 400 });
	});

	it('returns 502 when fetch throws', async () => {
		mockFetch.mockRejectedValue(new Error('timeout'));
		await expect(identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }))).rejects.toMatchObject({ status: 502 });
	});

	it('returns parsed lure fields', async () => {
		mockLiteLLMResponse(JSON.stringify({
			brand: 'Rapala', name: 'Original Floater', type: 'Jerkbait', color: 'Clown',
			weight: 7, size: 9, runningDepth: 'shallow', waterType: 'freshwater',
			lightConditions: 6, species: ['Pike', 'Perch'], notes: 'Classic design'
		}));
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.brand).toBe('Rapala');
		expect(data.type).toBe('Jerkbait');
		expect(data.species).toEqual(['Pike', 'Perch']);
		expect(data.lightConditions).toBe(6);
		expect(data.runningDepth).toBe('shallow');
		expect(data.waterType).toBe('freshwater');
	});

	it('rejects lightConditions out of 0-10 range', async () => {
		mockLiteLLMResponse(JSON.stringify({
			brand: null, name: null, type: null, color: null, weight: null, size: null,
			runningDepth: null, waterType: null, lightConditions: 15, species: null, notes: ''
		}));
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.lightConditions).toBeNull();
	});

	it('rejects invalid runningDepth values', async () => {
		mockLiteLLMResponse(JSON.stringify({
			brand: null, name: null, type: null, color: null, weight: null, size: null,
			runningDepth: 'very-deep', waterType: 'ocean', lightConditions: null, species: null, notes: ''
		}));
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.runningDepth).toBeNull();
		expect(data.waterType).toBeNull();
	});

	it('filters non-string values from species array', async () => {
		mockLiteLLMResponse(JSON.stringify({
			brand: null, name: null, type: null, color: null, weight: null, size: null,
			runningDepth: null, waterType: null, lightConditions: null,
			species: ['Pike', 42, null, 'Perch'], notes: ''
		}));
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.species).toEqual(['Pike', 'Perch']);
	});

	it('handles response with no JSON block gracefully', async () => {
		mockLiteLLMResponse('I cannot identify this lure.');
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.brand).toBeNull();
		expect(data.notes).toBe('Could not parse the model response.');
	});

	it('rounds lightConditions to integer', async () => {
		mockLiteLLMResponse(JSON.stringify({
			brand: null, name: null, type: null, color: null, weight: null, size: null,
			runningDepth: null, waterType: null, lightConditions: 6.7, species: null, notes: ''
		}));
		const res = await identifyLure(makeReq({ imageData: 'data:image/jpeg;base64,abc' }));
		const data = await res.json();
		expect(data.lightConditions).toBe(7);
	});
});
