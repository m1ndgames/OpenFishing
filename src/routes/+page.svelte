<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t } = data;

	const PAGE_SIZES = [4, 8, 16, 32, 50, 100];

	// Filter state
	let search   = $state('');
	let fType    = $state('');
	let fBrand   = $state('');
	let fColor   = $state('');
	let fWater   = $state('');
	let fDepth   = $state('');
	let fSpecies = $state('');

	// Pagination state
	let page     = $state(1);
	let pageSize = $state(16);

	// Distinct option lists
	const types   = $derived([...new Set(data.lures.map(l => l.type).filter(Boolean))].sort());
	const brands  = $derived([...new Set(data.lures.map(l => l.brand).filter(Boolean))].sort());
	const colors  = $derived([...new Set(data.lures.map(l => l.color).filter(Boolean))].sort());
	const waters  = $derived([...new Set(data.lures.map(l => l.waterType).filter(Boolean))].sort());
	const depths  = $derived([...new Set(data.lures.map(l => l.runningDepth).filter(Boolean))].sort());
	const species = $derived([
		...new Set(data.lures.flatMap(l => l.species ? l.species.split(' ').filter(Boolean) : []))
	].sort());

	const anyActive = $derived(search || fType || fBrand || fColor || fWater || fDepth || fSpecies);

	const filtered = $derived(data.lures.filter(l => {
		if (fType    && l.type         !== fType)    return false;
		if (fBrand   && l.brand        !== fBrand)   return false;
		if (fColor   && l.color        !== fColor)   return false;
		if (fWater   && l.waterType    !== fWater)   return false;
		if (fDepth   && l.runningDepth !== fDepth)   return false;
		if (fSpecies && !(l.species ?? '').split(' ').includes(fSpecies)) return false;
		if (search) {
			const q = search.toLowerCase();
			return (
				l.name.toLowerCase().includes(q) ||
				(l.brand  ?? '').toLowerCase().includes(q) ||
				(l.type   ?? '').toLowerCase().includes(q) ||
				(l.color  ?? '').toLowerCase().includes(q)
			);
		}
		return true;
	}));

	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const pageClamped = $derived(Math.min(page, totalPages));
	const pageItems = $derived(filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize));

	// Reset to page 1 when filters or page size change
	$effect(() => {
		search; fType; fBrand; fColor; fWater; fDepth; fSpecies; pageSize;
		page = 1;
	});

	function clearAll() {
		search = ''; fType = ''; fBrand = ''; fColor = '';
		fWater = ''; fDepth = ''; fSpecies = '';
	}
</script>

<div class="space-y-4">

	<!-- Filter bar -->
	<div class="bg-white border border-gray-200 rounded-xl p-3 space-y-3 shadow-sm">

		<!-- Text search -->
		<input
			type="search"
			bind:value={search}
			placeholder={t.searchPlaceholder}
			class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>

		<!-- Dropdown filters — horizontally scrollable on mobile -->
		<div class="flex gap-2 overflow-x-auto pb-1 -mb-1">
			{#if types.length > 0}
				<select bind:value={fType}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fType ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.type}: {t.filterAll}</option>
					{#each types as o}<option value={o}>{o}</option>{/each}
				</select>
			{/if}
			{#if brands.length > 0}
				<select bind:value={fBrand}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fBrand ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.brand}: {t.filterAll}</option>
					{#each brands as o}<option value={o}>{o}</option>{/each}
				</select>
			{/if}
			{#if colors.length > 0}
				<select bind:value={fColor}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fColor ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.color}: {t.filterAll}</option>
					{#each colors as o}<option value={o}>{o}</option>{/each}
				</select>
			{/if}
			{#if waters.length > 0}
				<select bind:value={fWater}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fWater ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.waterType}: {t.filterAll}</option>
					{#each waters as o}<option value={o}>{t[`waterType_${o}` as keyof typeof t] ?? o}</option>{/each}
				</select>
			{/if}
			{#if depths.length > 0}
				<select bind:value={fDepth}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fDepth ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.runningDepth}: {t.filterAll}</option>
					{#each depths as o}<option value={o}>{t[`runningDepth_${o}` as keyof typeof t] ?? o}</option>{/each}
				</select>
			{/if}
			{#if species.length > 0}
				<select bind:value={fSpecies}
					class="shrink-0 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
					       {fSpecies ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 bg-white text-gray-600'}">
					<option value="">{t.fishSpecies}: {t.filterAll}</option>
					{#each species as o}<option value={o}>{o}</option>{/each}
				</select>
			{/if}
		</div>

		<!-- Clear filters -->
		{#if anyActive}
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-500">
					{filtered.length}
					{filtered.length === 1 ? t.lure_singular : t.lure_plural}
					{t.matching} {t.filterActive}
				</span>
				<button onclick={clearAll} class="text-blue-600 hover:text-blue-800 font-medium">
					{t.clear}
				</button>
			</div>
		{/if}
	</div>

	<!-- Empty state -->
	{#if filtered.length === 0}
		<div class="text-center py-20 text-gray-400">
			<p class="text-5xl mb-4">🎣</p>
			{#if anyActive}
				<p class="text-lg font-medium">{t.noLuresMatch} {t.filterActive}</p>
			{:else}
				<p class="text-lg font-medium">{t.noLuresYet}</p>
				<p class="text-sm mt-1">
					<a href="/lures/new" class="text-blue-600 hover:underline">{t.addFirstLure}</a>
					{t.toGetStarted}
				</p>
			{/if}
		</div>
	{:else}
		<!-- Lure grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each pageItems as lure (lure.id)}
				<a
					href="/lures/{lure.id}"
					class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden group"
				>
					<div class="bg-gray-100 h-40 flex items-center justify-center">
						{#if lure.photoPath}
							<img src="/uploads/{lure.photoPath}" alt={lure.name} class="h-full w-full object-cover" />
						{:else}
							<span class="text-4xl opacity-30">🐟</span>
						{/if}
					</div>
					<div class="p-4 space-y-2">
						<h2 class="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
							{lure.name}
						</h2>
						<div class="text-sm text-gray-500 space-y-0.5">
							{#if lure.brand}<p class="truncate">{lure.brand}</p>{/if}
							<div class="flex gap-2 flex-wrap">
								{#if lure.type}<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{lure.type}</span>{/if}
								{#if lure.color}<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{lure.color}</span>{/if}
							</div>
						</div>
						{#if lure.tags.length > 0}
							<div class="flex flex-wrap gap-1 pt-1">
								{#each lure.tags as tag (tag.id)}
									<span class="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">{tag.name}</span>
								{/each}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1 || filtered.length > PAGE_SIZES[0]}
			<div class="flex items-center justify-between gap-4 pt-2">
				<!-- Prev / page indicator / Next -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => page = Math.max(1, pageClamped - 1)}
						disabled={pageClamped <= 1}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
					>
						←
					</button>
					<span class="text-sm text-gray-600 tabular-nums">
						{pageClamped} / {totalPages}
					</span>
					<button
						onclick={() => page = Math.min(totalPages, pageClamped + 1)}
						disabled={pageClamped >= totalPages}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
					>
						→
					</button>
				</div>

				<!-- Page size selector -->
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<span>{t.perPage}</span>
					<select
						bind:value={pageSize}
						class="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
					>
						{#each PAGE_SIZES as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}
	{/if}
</div>
