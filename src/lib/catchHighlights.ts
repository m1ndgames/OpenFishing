// Small "story" facts shown on a catch's detail page: whether it is the
// angler's personal best for that species, and which fish it was on the lure.
// Pure so it can be unit tested without the database.

export interface SpeciesSibling {
	id: string;
	lengthCm: number | null;
	weightG: number | null;
}

export interface CatchHighlights {
	/** 'length' / 'weight' when this catch is the biggest of its species (needs ≥ 2 catches). */
	personalBest: 'length' | 'weight' | null;
	/** 1-based position of this catch among all catches on the same lure, by time. */
	lureCatchNumber: number | null;
}

function isTop(value: number | null, others: (number | null)[]): boolean {
	if (value == null || value <= 0) return false;
	return others.every((o) => o == null || o <= value);
}

export function catchHighlights(
	current: { id: string; lengthCm: number | null; weightG: number | null },
	sameSpecies: SpeciesSibling[],
	lureCatchNumber: number | null
): CatchHighlights {
	const others = sameSpecies.filter((s) => s.id !== current.id);
	let personalBest: CatchHighlights['personalBest'] = null;
	// A "best" of one is not a best: only call it once there is something to beat.
	if (others.length > 0) {
		if (isTop(current.lengthCm, others.map((o) => o.lengthCm))) personalBest = 'length';
		else if (isTop(current.weightG, others.map((o) => o.weightG))) personalBest = 'weight';
	}
	return {
		personalBest,
		lureCatchNumber: lureCatchNumber && lureCatchNumber > 0 ? lureCatchNumber : null
	};
}
