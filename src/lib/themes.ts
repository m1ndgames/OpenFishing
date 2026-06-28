export interface ThemeDefinition {
	id: string;
	labelKey: string;
	/** Preview swatches — dark-mode colors, used in the picker card regardless of current mode */
	accent: string;
	bg: string;
	surface: string;
	border: string;
}

export const THEMES: ThemeDefinition[] = [
	{
		id: 'ocean',
		labelKey: 'appearanceThemeOcean',
		accent: '#06b6d4',
		bg: '#091929',
		surface: '#0f2238',
		border: '#1a3a5c',
	},
];

export const THEME_IDS = THEMES.map(t => t.id);
