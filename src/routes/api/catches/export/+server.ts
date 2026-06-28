import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { fishCatch } from '$lib/server/db/schema';
import { gte, lte, and } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

function escapeCsv(value: string | number | boolean | null | undefined): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

export const GET: RequestHandler = async ({ url }) => {
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');

	const year = new Date().getFullYear();
	const fromDate = fromParam ? new Date(fromParam + 'T00:00:00') : new Date(year, 0, 1);
	const toDate = toParam ? new Date(toParam + 'T23:59:59') : new Date(year, 11, 31, 23, 59, 59);

	const catches = await db.query.fishCatch.findMany({
		where: and(gte(fishCatch.caughtAt, fromDate), lte(fishCatch.caughtAt, toDate)),
		orderBy: [asc(fishCatch.caughtAt)],
		with: { lure: true }
	});

	const headerRow = [
		'Date', 'Time', 'Species', 'Weight (g)', 'Length (cm)',
		'Catch & Release', 'Lure', 'Retrieve Style', 'Notes', 'Latitude', 'Longitude'
	].join(',');

	const rows = catches.map((c) => {
		const dt = new Date(c.caughtAt);
		const date = dt.toISOString().split('T')[0];
		const time = dt.toISOString().split('T')[1].slice(0, 5);
		return [
			date,
			time,
			c.species,
			c.weightG,
			c.lengthCm,
			c.catchAndRelease ? 'Yes' : 'No',
			c.lure?.name,
			c.presentation,
			c.notes,
			c.lat,
			c.lng
		].map(escapeCsv).join(',');
	});

	const csv = '﻿' + [headerRow, ...rows].join('\r\n');
	const exportDate = new Date().toISOString().split('T')[0];

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="catches-${exportDate}.csv"`
		}
	});
};
