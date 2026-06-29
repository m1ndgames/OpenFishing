export interface ThemeDefinition {
	id: string;
	label: string;
	/** Preview swatches — dark-mode colors, used in the picker card regardless of current mode */
	accent: string;
	bg: string;
	surface: string;
	border: string;
}

export const THEMES: ThemeDefinition[] = [
	{
		id: 'ocean',
		label: 'Ocean',
		accent: '#06b6d4',
		bg: '#091929',
		surface: '#0f2238',
		border: '#1a3a5c',
	},
	{
		id: 'forrest',
		label: 'Forrest',
		accent: '#4ade80',
		bg: '#050e07',
		surface: '#0d1e14',
		border: '#22452e',
	},
	{
		id: 'sunset',
		label: 'Sunset',
		accent: '#fb923c',
		bg: '#100804',
		surface: '#251508',
		border: '#522e12',
	},
	{
		id: 'dusk',
		label: 'Dusk',
		accent: '#a78bfa',
		bg: '#0a0612',
		surface: '#1a1128',
		border: '#3d2860',
	},
];

export const THEME_IDS = THEMES.map(t => t.id);
