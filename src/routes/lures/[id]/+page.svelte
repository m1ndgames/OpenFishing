<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lure, qrSvg, t } = data;

	const waterTypeLabels: Record<string, string> = {
		freshwater: t.waterType_freshwater,
		saltwater: t.waterType_saltwater
	};

	const runningDepthLabels: Record<string, string> = {
		shallow: t.runningDepth_shallow,
		medium: t.runningDepth_medium,
		deep: t.runningDepth_deep
	};
</script>

<div class="max-w-xl">
	<div class="mb-6 flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-gray-600 transition-colors">{t.back}</a>
		<h1 class="text-2xl font-bold text-gray-900 truncate">{lure.name}</h1>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
		<!-- Photo -->
		{#if lure.photoPath}
			<div class="bg-gray-100" style="aspect-ratio: 4/3;">
				<img
					src="/uploads/{lure.photoPath}"
					alt={lure.name}
					class="w-full h-full object-cover"
				/>
			</div>
		{/if}

		<div class="relative p-4 sm:p-6 space-y-4">
			<!-- QR code — top right of content box -->
			<div class="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-center gap-1">
				<div class="relative w-16 h-16 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
					{@html qrSvg}
					{#if !lure.qrCoded}
						<div class="absolute bottom-0.5 right-0.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path d="M5 2.5v3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
								<circle cx="5" cy="7.5" r="0.9" fill="white"/>
							</svg>
						</div>
					{/if}
				</div>
				{#if lure.lureNumber}
					<span class="font-mono text-xs text-gray-400">#{String(lure.lureNumber).padStart(4, '0')}</span>
				{/if}
			</div>

			<!-- Core details -->
			<dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm pr-20 sm:pr-24">
				{#if lure.brand}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.brand}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.brand}</dd>
					</div>
				{/if}
				{#if lure.type}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.type}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.type}</dd>
					</div>
				{/if}
				{#if lure.color}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.color}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.color}</dd>
					</div>
				{/if}
				{#if lure.weight}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.weightG}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.weight}g</dd>
					</div>
				{/if}
				{#if lure.size}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.size}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.size}</dd>
					</div>
				{/if}
				{#if lure.runningDepth}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.runningDepth}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{runningDepthLabels[lure.runningDepth] ?? lure.runningDepth}</dd>
					</div>
				{/if}
				{#if lure.waterType}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.waterType}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{waterTypeLabels[lure.waterType] ?? lure.waterType}</dd>
					</div>
				{/if}
				{#if lure.weather}
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">{t.weather}</dt>
						<dd class="font-medium text-gray-900 mt-0.5">{lure.weather}</dd>
					</div>
				{/if}
				</dl>

			<!-- Species -->
			{#if lure.species}
				<div>
					<p class="text-gray-400 text-xs uppercase tracking-wide mb-1.5">{t.fishSpecies}</p>
					<div class="flex flex-wrap gap-1.5">
						{#each lure.species.split(/\s+/).filter(Boolean) as s}
							<span class="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium">{s}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Tags -->
			{#if lure.tags.length > 0}
				<div>
					<p class="text-gray-400 text-xs uppercase tracking-wide mb-1.5">{t.tags}</p>
					<div class="flex flex-wrap gap-1.5">
						{#each lure.tags as tag (tag.id)}
							<span class="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">{tag.name}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Notes -->
			{#if lure.notes}
				<div>
					<p class="text-gray-400 text-xs uppercase tracking-wide mb-1">{t.notes}</p>
					<p class="text-sm text-gray-700 whitespace-pre-wrap">{lure.notes}</p>
				</div>
			{/if}

			<!-- Status -->
			{#if lure.qrCoded}
				<div>
					<span class="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
						<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						{t.labeledStatus}
					</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
				<a
					href="/lures/{lure.id}/edit"
					class="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
				>
					{t.edit}
				</a>
			</div>
		</div>
	</div>
</div>
