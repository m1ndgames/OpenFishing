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
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">{t.qrCodesTitle}</h1>
		{#if items.length > 0}
			<button
				onclick={() => window.print()}
				class="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
			>
				{t.printQrCodes}
			</button>
		{/if}
	</div>

	{#if items.length === 0}
		<p class="text-gray-500">{t.noUnlabeledLures}</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each items as item}
				<div class="flex items-center gap-4 border-2 border-black bg-white p-2">
					<div class="shrink-0">
						{@html item.qrSvg}
					</div>
					<span class="w-24 shrink-0 font-mono font-bold text-black text-sm">{formatNumber(item.lureNumber)}</span>
					<span class="w-40 shrink-0 text-gray-700 text-sm truncate">{item.brand ?? '—'}</span>
					<span class="text-gray-900 font-medium text-sm truncate flex-1">{item.name}</span>
					<form
						method="POST"
						action="?/markLabeled"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' || result.type === 'redirect') {
									items = items.filter((i) => i.id !== item.id);
								}
							};
						}}
					>
						<input type="hidden" name="id" value={item.id} />
						<button
							type="submit"
							class="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-300"
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
			<div class="print-item">
				<div class="print-qr">
					{@html item.qrSvg}
				</div>
				<span class="print-id">{formatNumber(item.lureNumber)}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	@media print {
		@page {
			margin: 6mm;
			size: auto;
		}

		:global(header),
		:global(nav) {
			display: none !important;
		}

		:global(main) {
			padding: 0 !important;
			max-width: none !important;
		}

		.print-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 2mm;
		}

		.print-item {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 1mm;
			break-inside: avoid;
		}

		.print-qr {
			border: 1px solid #000;
			padding: 0;
			line-height: 0;
		}

		.print-qr :global(svg) {
			display: block;
			width: 12.5mm;
			height: 12.5mm;
		}

		.print-id {
			font-family: monospace;
			font-size: 7pt;
			font-weight: bold;
			color: #000;
			white-space: nowrap;
			writing-mode: vertical-rl;
			text-orientation: mixed;
			transform: rotate(180deg);
		}
	}
</style>
