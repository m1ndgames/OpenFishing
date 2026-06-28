<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t } = data;

	let items = $state(data.items);

	function formatNumber(n: number | null | undefined): string {
		if (n == null) return '—';
		return '#' + String(n).padStart(4, '0');
	}
</script>

<!-- Screen view -->
<div class="print:hidden">
	{#if items.length > 0}
		<div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
			<button
				onclick={() => window.print()}
				style="background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:9px 18px; border-radius:9px; border:1px solid var(--of-border); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:7px;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
			>
				<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
					<path d="M3 10.5V12.5H12V10.5M7.5 1.5V9.5M5 7L7.5 9.5L10 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				{t.printQrCodes}
			</button>
		</div>
	{/if}

	{#if items.length === 0}
		<div style="text-align:center; padding:60px 24px;">
			<div style="display:inline-flex; align-items:center; justify-content:center; width:72px; height:72px; border-radius:50%; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); margin-bottom:16px;">
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="color:var(--of-border-strong);">
					<rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
					<rect x="6" y="6" width="6" height="6" fill="currentColor" opacity="0.4"/>
					<rect x="18" y="4" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
					<rect x="20" y="6" width="6" height="6" fill="currentColor" opacity="0.4"/>
					<rect x="4" y="18" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
					<rect x="6" y="20" width="6" height="6" fill="currentColor" opacity="0.4"/>
					<rect x="18" y="18" width="4" height="4" fill="currentColor" opacity="0.4"/>
					<rect x="24" y="18" width="4" height="4" fill="currentColor" opacity="0.4"/>
					<rect x="18" y="24" width="4" height="4" fill="currentColor" opacity="0.4"/>
					<rect x="24" y="24" width="4" height="4" fill="currentColor" opacity="0.4"/>
				</svg>
			</div>
			<p style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1rem; color:var(--of-text-2); margin:0 0 6px;">{t.noUnlabeledLures}</p>
		</div>
	{:else}
		<div style="display:flex; flex-direction:column; gap:6px;">
			{#each items as item}
				<div style="display:flex; align-items:center; gap:12px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; padding:10px 14px;">
					<div class="qr-thumb" style="flex-shrink:0; background:#e8f0f7; border-radius:6px; padding:3px; width:44px; height:44px; overflow:hidden;">
						{@html item.qrSvg}
					</div>
					<span style="width:56px; flex-shrink:0; font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:600; color:var(--of-accent-hover);">{formatNumber(item.lureNumber)}</span>
					<span style="width:120px; flex-shrink:0; font-size:0.8rem; color:var(--of-text-3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{item.brand ?? '—'}</span>
					<span style="font-size:0.875rem; font-weight:600; color:var(--of-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">{item.name}</span>
					<form
						method="POST"
						action="?/markLabeled"
						style="flex-shrink:0;"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' || result.type === 'redirect') {
									items = items.filter((i) => i.id !== item.id);
								}
							};
						}}
					>
						<input type="hidden" name="id" value={item.id} />
						<button type="submit"
							style="background:var(--of-accent-bg); color:var(--of-accent); font-size:0.78rem; font-weight:500; padding:6px 12px; border-radius:7px; border:1px solid var(--of-accent-bg-hover); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; white-space:nowrap;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(6,182,212,0.16)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}}
						>
							{t.placeLabel}
						</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Print view -->
<div class="hidden print:block">
	<div class="print-grid">
		{#each items as item}
			<div class="print-label">
				<div class="print-qr">
					{@html item.qrSvg}
				</div>
				<div class="print-info">
					<span class="print-id">{formatNumber(item.lureNumber)}</span>
					<span class="print-brand">{item.brand ?? '—'}</span>
					<span class="print-name">{item.name}</span>
					{#if item.color}
						<span class="print-color">{item.color}</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	:global(.qr-thumb svg) {
		width: 100% !important;
		height: 100% !important;
		display: block;
	}

	@media print {
		@page {
			margin: 6mm;
			size: auto;
		}

		:global(header),
		:global(nav),
		:global(.no-print) {
			display: none !important;
		}

		:global(main) {
			padding: 0 !important;
			max-width: none !important;
		}

		.print-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 1.5mm;
		}

		.print-label {
			display: flex;
			flex-direction: row;
			align-items: stretch;
			height: 12.5mm;
			border: 0.3mm solid #000;
			border-radius: 0.5mm;
			overflow: hidden;
			break-inside: avoid;
		}

		.print-qr {
			flex-shrink: 0;
			line-height: 0;
			border-right: 0.3mm solid #000;
		}

		.print-qr :global(svg) {
			display: block;
			width: 12.5mm;
			height: 12.5mm;
		}

		.print-info {
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: 0.8mm 1.5mm;
			gap: 0;
			overflow: hidden;
			min-width: 0;
			width: 28mm;
		}

		.print-id {
			font-family: monospace;
			font-size: 7pt;
			font-weight: bold;
			color: #000;
			white-space: nowrap;
			line-height: 1.2;
		}

		.print-brand {
			font-family: sans-serif;
			font-size: 5pt;
			color: #555;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1.3;
		}

		.print-name {
			font-family: sans-serif;
			font-size: 6.5pt;
			font-weight: bold;
			color: #000;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1.2;
		}

		.print-color {
			font-family: sans-serif;
			font-size: 5pt;
			color: #444;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1.3;
		}
	}
</style>
