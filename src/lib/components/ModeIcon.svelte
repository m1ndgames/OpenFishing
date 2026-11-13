<script lang="ts">
	// Line icons for the colour-mode picker (replaces emoji, which render
	// differently per platform and ignore the theme colour).
	let { mode, size = 16 }: { mode: 'dark' | 'light' | 'system' | string; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
	stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
	{#if mode === 'dark'}
		<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
	{:else if mode === 'light'}
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
	{:else}
		<rect x="3" y="4.5" width="18" height="12" rx="2" />
		<path d="M9 20h6M12 16.5V20" />
	{/if}
</svg>
