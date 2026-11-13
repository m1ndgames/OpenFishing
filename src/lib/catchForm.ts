/**
 * Pure helpers for the catch new/edit forms. Client-safe (no server imports) so the
 * ranking rules are unit-testable and shared by both forms.
 */

export interface PickerLure {
	id: string;
	lureNumber: number | null;
	name: string;
	photoPath: string | null;
	favourite: boolean;
	lost: boolean;
}

/** `#0042 Name`, or just the name for lures without a number. */
export function lureLabel(l: { lureNumber: number | null; name: string }): string {
	return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
}

/** `#0042`, or an empty string for lures without a number. */
export function lurePlate(n: number | null): string {
	return n ? `#${String(n).padStart(4, '0')}` : '';
}

/**
 * The lures offered as one-tap tiles on the catch form: the most recently used
 * lures first (in order of their latest catch), then favourites by lure number.
 * Lost lures are left out — they can't have caught this fish. The full list stays
 * available in the "other lure" select.
 */
export function rankQuickLures(lures: PickerLure[], recentLureIds: (string | null)[], limit = 6): PickerLure[] {
	const byId = new Map(lures.map((l) => [l.id, l]));
	const picked: PickerLure[] = [];
	const seen = new Set<string>();
	const take = (l: PickerLure | undefined) => {
		if (!l || l.lost || seen.has(l.id) || picked.length >= limit) return;
		seen.add(l.id);
		picked.push(l);
	};
	for (const id of recentLureIds) if (id) take(byId.get(id));
	for (const l of lures) if (l.favourite) take(l);
	return picked;
}

/** Options ordered by how often they were used (most first); ties keep their original order. */
export function sortByUsage(options: readonly string[], counts: Record<string, number>): string[] {
	return options
		.map((o, i) => ({ o, i, n: counts[o] ?? 0 }))
		.sort((a, b) => b.n - a.n || a.i - b.i)
		.map((x) => x.o);
}
