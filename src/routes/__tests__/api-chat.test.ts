import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	json: (data: any) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

function makeChain(result: any = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		groupBy: vi.fn(() => self),
		orderBy: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

const mockSelect = vi.fn(() => makeChain([]));

vi.mock('$lib/server/db', () => ({
	db: {
		select: mockSelect,
		query: {},
	},
}));

const mockEnv = await import('../../__mocks__/env');
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { GET, POST } = await import('../api/chat/+server');

function makeGetReq(): any {
	return { locals: {} };
}

function makePostReq(body: any, lang = 'en'): any {
	return {
		request: { json: () => Promise.resolve(body) },
		cookies: { get: vi.fn().mockReturnValue(lang) },
		locals: {},
	};
}

describe('GET /api/chat', () => {
	beforeEach(() => {
		mockEnv.env.DEMO_MODE = undefined;
		mockEnv.env.CHATBOT = undefined;
		mockSelect.mockClear();
	});

	it('returns an empty session list in demo mode without touching the db', async () => {
		mockEnv.env.DEMO_MODE = '1';
		const res = await GET(makeGetReq());
		const data = await res.json();
		expect(data).toEqual([]);
		expect(mockSelect).not.toHaveBeenCalled();
	});

	it('returns 503 when chatbot not configured (non-demo)', async () => {
		await expect(GET(makeGetReq())).rejects.toMatchObject({ status: 503 });
	});
});

describe('POST /api/chat', () => {
	beforeEach(() => {
		mockEnv.env.DEMO_MODE = undefined;
		mockEnv.env.CHATBOT = undefined;
		mockEnv.env.LITELLM_URL = undefined;
		mockEnv.env.LITELLM_MODEL = undefined;
		mockFetch.mockReset();
	});

	it('returns a canned reply in demo mode without calling LiteLLM', async () => {
		mockEnv.env.DEMO_MODE = '1';
		const res = await POST(makePostReq({ messages: [{ role: 'user', content: 'hi' }] }));
		const data = await res.json();
		expect(data.reply).toBe('The AI chatbot is disabled in this demo.');
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('localizes the canned reply based on the lang cookie', async () => {
		mockEnv.env.DEMO_MODE = '1';
		const res = await POST(makePostReq({ messages: [{ role: 'user', content: 'hi' }] }, 'de'));
		const data = await res.json();
		expect(data.reply).toBe('Der KI-Chatbot ist in dieser Demo deaktiviert.');
	});

	it('ignores demo mode reply when DEMO_MODE is unset and falls through to config check', async () => {
		await expect(POST(makePostReq({ messages: [] }))).rejects.toMatchObject({ status: 503 });
	});
});
