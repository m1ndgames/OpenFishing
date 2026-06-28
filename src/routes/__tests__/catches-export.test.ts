import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			fishCatch: { findMany: mockFindMany }
		}
	}
}));

const { GET } = await import('../api/catches/export/+server');

function makeEvent(params: Record<string, string> = {}): any {
	const url = new URL('http://localhost/api/catches/export');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return { url };
}

const sampleLure = { id: 'lure-1', name: 'Silver Spinner' };

const sampleCatch = {
	id: 'catch-1',
	caughtAt: new Date('2025-06-15T08:30:00.000Z'),
	species: 'Pike',
	weightG: 1800,
	lengthCm: 62,
	lat: 52.52,
	lng: 13.40,
	notes: 'Great fish',
	catchAndRelease: false,
	presentation: 'Slow Roll',
	biteIndex: 7.5,
	lureId: 'lure-1',
	lure: sampleLure,
};

describe('GET /api/catches/export', () => {
	beforeEach(() => {
		mockFindMany.mockResolvedValue([]);
	});

	it('returns text/csv content-type', async () => {
		const res = await GET(makeEvent());
		expect(res.headers.get('Content-Type')).toContain('text/csv');
	});

	it('sets a Content-Disposition attachment header with csv filename', async () => {
		const res = await GET(makeEvent());
		const disposition = res.headers.get('Content-Disposition') ?? '';
		expect(disposition).toContain('attachment');
		expect(disposition).toContain('.csv');
	});

	it('sends UTF-8 BOM bytes so Excel opens the file in correct encoding', async () => {
		// Response.text() strips BOM via TextDecoder — check raw bytes instead
		const res = await GET(makeEvent());
		const buf = new Uint8Array(await res.arrayBuffer());
		expect(buf[0]).toBe(0xEF); // BOM byte 1
		expect(buf[1]).toBe(0xBB); // BOM byte 2
		expect(buf[2]).toBe(0xBF); // BOM byte 3
	});

	it('includes correct column headers on first data line', async () => {
		// TextDecoder strips BOM, so .text() starts directly with 'Date'
		const res = await GET(makeEvent());
		const text = await res.text();
		const firstLine = text.split('\r\n')[0];
		expect(firstLine).toBe('Date,Time,Species,Weight (g),Length (cm),Catch & Release,Lure,Retrieve Style,Notes,Latitude,Longitude');
	});

	it('returns only the header row when there are no catches', async () => {
		const res = await GET(makeEvent());
		const text = await res.text();
		const lines = text.split('\r\n').filter(Boolean);
		expect(lines).toHaveLength(1);
	});

	it('returns a data row for each catch', async () => {
		mockFindMany.mockResolvedValue([sampleCatch, { ...sampleCatch, id: 'catch-2' }]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const lines = text.split('\r\n').filter(Boolean);
		expect(lines).toHaveLength(3); // header + 2 data rows
	});

	it('formats catch data fields correctly', async () => {
		mockFindMany.mockResolvedValue([sampleCatch]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.split('\r\n');
		const fields = dataRow.split(',');
		expect(fields[0]).toBe('2025-06-15'); // Date (ISO)
		expect(fields[1]).toBe('08:30');       // Time
		expect(fields[2]).toBe('Pike');         // Species
		expect(fields[3]).toBe('1800');         // Weight
		expect(fields[4]).toBe('62');           // Length
		expect(fields[5]).toBe('No');           // C&R
		expect(fields[6]).toBe('Silver Spinner'); // Lure
		expect(fields[7]).toBe('Slow Roll');    // Presentation
		expect(fields[8]).toBe('Great fish');   // Notes
		expect(fields[9]).toBe('52.52');        // Lat
		expect(fields[10]).toBe('13.4');        // Lng
	});

	it('writes Yes for catch-and-release catches', async () => {
		mockFindMany.mockResolvedValue([{ ...sampleCatch, catchAndRelease: true }]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.split('\r\n');
		const fields = dataRow.split(',');
		expect(fields[5]).toBe('Yes');
	});

	it('leaves lure field empty when catch has no lure', async () => {
		mockFindMany.mockResolvedValue([{ ...sampleCatch, lure: null }]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.split('\r\n');
		const fields = dataRow.split(',');
		expect(fields[6]).toBe('');
	});

	it('leaves optional fields empty when null', async () => {
		mockFindMany.mockResolvedValue([{
			...sampleCatch,
			weightG: null,
			lengthCm: null,
			notes: null,
			presentation: null,
			lat: null,
			lng: null,
		}]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.split('\r\n');
		const fields = dataRow.split(',');
		expect(fields[3]).toBe('');  // weight
		expect(fields[4]).toBe('');  // length
		expect(fields[8]).toBe('');  // notes
		expect(fields[7]).toBe('');  // presentation
		expect(fields[9]).toBe('');  // lat
		expect(fields[10]).toBe(''); // lng
	});

	it('quotes values that contain commas', async () => {
		mockFindMany.mockResolvedValue([{ ...sampleCatch, notes: 'Early morning, near reeds' }]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.replace(/^﻿/, '').split('\r\n');
		expect(dataRow).toContain('"Early morning, near reeds"');
	});

	it('escapes double-quotes inside CSV values', async () => {
		mockFindMany.mockResolvedValue([{ ...sampleCatch, notes: 'He said "great fish"' }]);
		const res = await GET(makeEvent());
		const text = await res.text();
		const [, dataRow] = text.replace(/^﻿/, '').split('\r\n');
		expect(dataRow).toContain('"He said ""great fish"""');
	});

	it('passes date range to findMany', async () => {
		await GET(makeEvent({ from: '2025-01-01', to: '2025-12-31' }));
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.anything() })
		);
	});
});
