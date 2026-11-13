// Document title for every page inside the app chrome, derived in one place
// (the layout) from the path and the page's loaded data. Login and share pages
// set their own titles.

export const APP_NAME = 'OpenFishing';

type Dict = Record<string, unknown>;

function str(v: unknown): string | null {
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function tackleName(item: unknown): string | null {
	if (!item || typeof item !== 'object') return null;
	const o = item as Dict;
	return str(o.name) ?? (([str(o.brand), str(o.model)].filter(Boolean).join(' ')) || null);
}

/** The page-specific part of the title, or null for the bare app name. */
export function pageTitlePart(pathname: string, t: Dict, data: Dict = {}): string | null {
	const tt = (k: string) => str(t[k]);
	const p = pathname.replace(/\/+$/, '') || '/';
	const seg = p.split('/').filter(Boolean);

	if (p === '/') return tt('navLures');

	const [root, a, b, c] = seg;
	switch (root) {
		case 'lures':
			if (a === 'new') return tt('addLureTitle');
			if (b === 'edit') return tt('editLureTitle');
			return str((data.lure as Dict | undefined)?.name) ?? tt('navLures');
		case 'spots':
			if (!a) return tt('navSpots');
			if (a === 'new') return tt('addSpot');
			if (b === 'edit') return tt('spotEditTitle');
			return str((data.spot as Dict | undefined)?.name) ?? tt('navSpots');
		case 'catches':
			if (!a) return tt('navCatches');
			if (a === 'new') return tt('catchNewTitle');
			if (b === 'edit') return tt('catchEditTitle');
			return str((data.catch as Dict | undefined)?.species) ?? tt('navCatches');
		case 'stats':
			return tt('statsTitle');
		case 'tackle': {
			if (!a) return tt('tackleTitle');
			const kind = ({ rods: 'rod', reels: 'reel', lines: 'line', combos: 'combo' } as Record<string, string>)[a];
			if (!kind) return tt('tackleTitle');
			if (b === 'new') return tt(`${kind}AddTitle`);
			if (c === 'edit') return tt(`${kind}EditTitle`);
			return tackleName(data[kind]) ?? tt('tackleTitle');
		}
		case 'settings':
			if (!a) return tt('navSettings');
			return (
				{ qr: tt('qrCodesTitle'), appearance: tt('appearanceTitle'), export: tt('catchExportTitle'),
				  account: tt('accountTitle'), admin: tt('adminTitle') } as Record<string, string | null>
			)[a] ?? tt('navSettings');
		case 'api-docs':
			return 'API';
		default:
			return null;
	}
}

export function pageTitle(pathname: string, t: Dict, data: Dict = {}): string {
	const part = pageTitlePart(pathname, t, data);
	return part ? `${part} · ${APP_NAME}` : APP_NAME;
}
