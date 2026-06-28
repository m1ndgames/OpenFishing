<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t } = data;

	const PAGE_SIZES = [4, 8, 12, 24, 48, 100];

	type ChipMode = 'include' | 'exclude';
	type ChipFilter = Record<string, ChipMode>;

	let search           = $state('');
	let filterType       = $state<ChipFilter>({});
	let filterDepth      = $state<ChipFilter>({});
	let filterLight      = $state<ChipFilter>({});
	let filterSpecies    = $state<ChipFilter>({});
	let filterFavourites = $state(false);
	let filterHasCatch   = $state(false);

	const lureIdsWithCatches = new Set(data.lureIdsWithCatches);
	let filterSizeMin    = $state('');
	let filterSizeMax    = $state('');
	let filterWeightMin  = $state('');
	let filterWeightMax  = $state('');
	let filtersExpanded  = $state(false);

	let favourites = $state<Record<string, boolean>>(
		Object.fromEntries(data.lures.map(l => [l.id, l.favourite]))
	);

	let page     = $state(1);
	let pageSize = $state(12);

	const types   = $derived([...new Set(data.lures.map(l => l.type).filter(Boolean))].sort() as string[]);
	const depths  = $derived([...new Set(data.lures.map(l => l.runningDepth).filter(Boolean))].sort() as string[]);
	const lights  = $derived([...new Set(data.lures.map(l => l.lightConditions).filter(v => v != null))].sort((a, b) => (a as number) - (b as number)) as number[]);
	const species = $derived([
		...new Set(data.lures.flatMap(l => l.species ? l.species.split(' ').filter(Boolean) : []))
	].sort() as string[]);

	const hasSizes   = $derived(data.lures.some(l => l.size !== null && l.size !== '' && !isNaN(parseFloat(l.size!))));
	const hasWeights = $derived(data.lures.some(l => l.weight !== null));

	const activeFilterCount = $derived(
		Object.keys(filterType).length + Object.keys(filterDepth).length +
		Object.keys(filterLight).length + Object.keys(filterSpecies).length +
		(filterFavourites ? 1 : 0) + (filterHasCatch ? 1 : 0) +
		(filterSizeMin !== '' ? 1 : 0) + (filterSizeMax !== '' ? 1 : 0) +
		(filterWeightMin !== '' ? 1 : 0) + (filterWeightMax !== '' ? 1 : 0)
	);

	const hasAnyOptions = $derived(
		types.length > 0 || depths.length > 0 || lights.length > 0 || species.length > 0 || hasSizes || hasWeights
	);
	const anyActive = $derived(
		!!search ||
		filterFavourites || filterHasCatch ||
		Object.keys(filterType).length > 0 ||
		Object.keys(filterDepth).length > 0 || Object.keys(filterLight).length > 0 ||
		Object.keys(filterSpecies).length > 0 ||
		filterSizeMin !== '' || filterSizeMax !== '' ||
		filterWeightMin !== '' || filterWeightMax !== ''
	);

	function toggleChip(current: ChipFilter, value: string): ChipFilter {
		const mode = current[value];
		if (!mode) return { ...current, [value]: 'include' };
		if (mode === 'include') return { ...current, [value]: 'exclude' };
		const next = { ...current };
		delete next[value];
		return next;
	}

	// OR for includes (show if matches any), AND-NOT for excludes (hide if matches any)
	function passesFilter(lureVal: string | null | undefined, f: ChipFilter): boolean {
		const entries = Object.entries(f);
		if (entries.length === 0) return true;
		const val = lureVal ?? '';
		const includes = entries.filter(([, m]) => m === 'include').map(([v]) => v);
		const excludes = entries.filter(([, m]) => m === 'exclude').map(([v]) => v);
		if (excludes.includes(val)) return false;
		if (includes.length > 0 && !includes.includes(val)) return false;
		return true;
	}

	function passesSpeciesFilter(lureSpeciesStr: string | null | undefined, f: ChipFilter): boolean {
		const entries = Object.entries(f);
		if (entries.length === 0) return true;
		const lureSpecies = (lureSpeciesStr ?? '').split(' ').filter(Boolean);
		const includes = entries.filter(([, m]) => m === 'include').map(([v]) => v);
		const excludes = entries.filter(([, m]) => m === 'exclude').map(([v]) => v);
		if (excludes.some(ex => lureSpecies.includes(ex))) return false;
		if (includes.length > 0 && !includes.some(inc => lureSpecies.includes(inc))) return false;
		return true;
	}

	const filtered = $derived(data.lures.filter(l => {
		if (filterFavourites && !favourites[l.id])           return false;
		if (filterHasCatch   && !lureIdsWithCatches.has(l.id)) return false;
		if (!passesFilter(l.type,             filterType))   return false;
		if (!passesFilter(l.runningDepth,     filterDepth))  return false;
		if (!passesFilter(l.lightConditions != null ? String(l.lightConditions) : null, filterLight)) return false;
		if (!passesSpeciesFilter(l.species, filterSpecies)) return false;

		if (filterSizeMin !== '' || filterSizeMax !== '') {
			const sz = l.size !== null && l.size !== '' ? parseFloat(l.size!) : null;
			if (filterSizeMin !== '') { const mn = parseFloat(filterSizeMin); if (!isNaN(mn) && (sz === null || sz < mn)) return false; }
			if (filterSizeMax !== '') { const mx = parseFloat(filterSizeMax); if (!isNaN(mx) && (sz === null || sz > mx)) return false; }
		}
		if (filterWeightMin !== '') { const mn = parseFloat(filterWeightMin); if (!isNaN(mn) && (l.weight === null || l.weight < mn)) return false; }
		if (filterWeightMax !== '') { const mx = parseFloat(filterWeightMax); if (!isNaN(mx) && (l.weight === null || l.weight > mx)) return false; }

		if (search) {
			const q = search.toLowerCase();
			return (
				l.name.toLowerCase().includes(q) ||
				(l.brand  ?? '').toLowerCase().includes(q) ||
				(l.type   ?? '').toLowerCase().includes(q) ||
				(l.color  ?? '').toLowerCase().includes(q) ||
				l.tags.some(tag => tag.name.toLowerCase().includes(q))
			);
		}
		return true;
	}));

	const totalPages    = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const pageClamped   = $derived(Math.min(page, totalPages));
	const pageItems     = $derived(filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize));
	// Stable grid height: assumes 4-col xl layout; at 3-col the natural row count is already larger
	const gridRows      = $derived(Math.ceil(pageSize / 4));
	const gridMinHeight = $derived(gridRows * 295 + Math.max(0, gridRows - 1) * 16);

	$effect(() => {
		search; filterFavourites; filterHasCatch; filterType; filterDepth; filterLight; filterSpecies;
		filterSizeMin; filterSizeMax; filterWeightMin; filterWeightMax; pageSize;
		page = 1;
	});

	function clearAll() {
		search = '';
		filterFavourites = false;
		filterHasCatch = false;
		filterType = {}; filterDepth = {}; filterLight = {}; filterSpecies = {};
		filterSizeMin = ''; filterSizeMax = ''; filterWeightMin = ''; filterWeightMax = '';
	}

	async function toggleFavourite(id: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		favourites[id] = !favourites[id];
		try {
			const res = await fetch(`/api/lures/${id}/favourite`, { method: 'POST' });
			if (!res.ok) favourites[id] = !favourites[id]; // revert on error
		} catch {
			favourites[id] = !favourites[id];
		}
	}

	function chipStyle(mode: ChipMode | undefined): string {
		const base = "font-size:0.72rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; line-height:1.5; white-space:nowrap; border-style:solid; border-width:1px;";
		if (mode === 'include') return base + "background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);";
		if (mode === 'exclude') return base + "background:var(--of-danger-bg); border-color:var(--of-danger-border); color:var(--of-danger); text-decoration:line-through;";
		return base + "background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);";
	}

	function chipTitle(mode: ChipMode | undefined): string {
		if (mode === 'include') return 'Click to exclude';
		if (mode === 'exclude') return 'Click to clear';
		return 'Click to include';
	}

	function padNum(n: number | null | undefined) {
		if (n == null) return null;
		return '#' + String(n).padStart(4, '0');
	}
</script>

<div class="space-y-5">

	<!-- Filter bar -->
	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:10px;">

		<!-- Search -->
		<div style="position:relative;">
			<svg style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--of-text-4); pointer-events:none;" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
				<path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<input
				type="search"
				bind:value={search}
				placeholder={t.searchPlaceholder}
				style="width:100%; padding:9px 12px 9px 36px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif;"
				onfocus={function(e) { (e.target as HTMLElement).style.borderColor = 'var(--of-accent-solid)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px var(--of-accent-bg-hover)'; }}
				onblur={function(e) { (e.target as HTMLElement).style.borderColor = 'var(--of-border)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
			/>
		</div>

		<!-- Filter toggle -->
		{#if hasAnyOptions}
			<div style="display:flex; justify-content:center;">
				<button
					onclick={() => filtersExpanded = !filtersExpanded}
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); border:1px solid {filtersExpanded || activeFilterCount > 0 ? 'var(--of-accent-border)' : 'var(--of-border)'}; color:{filtersExpanded || activeFilterCount > 0 ? 'var(--of-accent)' : 'var(--of-text-2)'}; padding:6px 14px; border-radius:20px; cursor:pointer; font-size:0.82rem; font-weight:500; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor=filtersExpanded||activeFilterCount>0?'var(--of-accent-border)':'var(--of-border)'; (e.currentTarget as HTMLElement).style.color=filtersExpanded||activeFilterCount>0?'var(--of-accent)':'var(--of-text-2)';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
						<line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						<line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						<line x1="11" y1="18" x2="13" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					{t.filterButton}
					{#if activeFilterCount > 0}
						<span style="font-size:0.68rem; font-weight:700; background:var(--of-accent-bg-hover); color:var(--of-accent); border:1px solid var(--of-accent-border); border-radius:20px; padding:1px 7px; line-height:1.5;">{activeFilterCount}</span>
					{/if}
					<svg width="12" height="12" viewBox="0 0 14 14" fill="none"
						style="transform:rotate({filtersExpanded ? '180deg' : '0deg'}); transition:transform 0.2s; flex-shrink:0;">
						<path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>

			<!-- Expanded filter rows -->
			{#if filtersExpanded}
			<div style="display:flex; flex-direction:column; gap:6px;">

				{#if types.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.type}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each types as opt}
								<button style={chipStyle(filterType[opt])} title={chipTitle(filterType[opt])}
									onclick={() => filterType = toggleChip(filterType, opt)}>{opt}</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if depths.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.runningDepth}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each depths as opt}
								<button style={chipStyle(filterDepth[opt])} title={chipTitle(filterDepth[opt])}
									onclick={() => filterDepth = toggleChip(filterDepth, opt)}>
									{(t[`runningDepth_${opt}` as keyof typeof t] as string) ?? opt}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if lights.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.lightConditions}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each lights as opt}
								<button style={chipStyle(filterLight[String(opt)])} title={chipTitle(filterLight[String(opt)])}
									onclick={() => filterLight = toggleChip(filterLight, String(opt))}>
									{t[`lightConditions_${opt}` as keyof typeof t] ?? opt}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if species.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.fishSpecies}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each species as opt}
								<button style={chipStyle(filterSpecies[opt])} title={chipTitle(filterSpecies[opt])}
									onclick={() => filterSpecies = toggleChip(filterSpecies, opt)}>{opt}</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Size range -->
				{#if hasSizes}
					<div style="display:flex; align-items:center; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.size} (cm)</span>
						<div style="display:flex; align-items:center; gap:5px;">
							<input type="number" min="0" step="0.1" placeholder={t.filterFrom} class="no-spin"
								bind:value={filterSizeMin}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterSizeMin !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterSizeMin !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.72rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
							<span style="color:var(--of-text-4); font-size:0.72rem; flex-shrink:0;">—</span>
							<input type="number" min="0" step="0.1" placeholder={t.filterTo} class="no-spin"
								bind:value={filterSizeMax}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterSizeMax !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterSizeMax !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.72rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
						</div>
					</div>
				{/if}

				<!-- Weight range -->
				{#if hasWeights}
					<div style="display:flex; align-items:center; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.weightG}</span>
						<div style="display:flex; align-items:center; gap:5px;">
							<input type="number" min="0" step="0.1" placeholder={t.filterFrom} class="no-spin"
								bind:value={filterWeightMin}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterWeightMin !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterWeightMin !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.72rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
							<span style="color:var(--of-text-4); font-size:0.72rem; flex-shrink:0;">—</span>
							<input type="number" min="0" step="0.1" placeholder={t.filterTo} class="no-spin"
								bind:value={filterWeightMax}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterWeightMax !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterWeightMax !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.72rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
						</div>
					</div>
				{/if}

				<!-- Favourites row -->
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.filterFavourites}</span>
					<button
						onclick={() => filterFavourites = !filterFavourites}
						style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; border-style:solid; border-width:1px; line-height:1.5; {filterFavourites ? 'background:var(--of-danger-bg); border-color:var(--of-danger-border); color:var(--of-danger);' : 'background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);'}"
					>
						<svg width="11" height="11" viewBox="0 0 24 24" fill={filterFavourites ? 'var(--of-danger)' : 'none'} stroke={filterFavourites ? 'var(--of-danger)' : 'var(--of-text-4)'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
					</button>
				</div>

				<!-- Has Catch row -->
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="min-width:88px; text-align:right; font-size:0.7rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.filterHasCatch}</span>
					<button
						onclick={() => filterHasCatch = !filterHasCatch}
						style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; border-style:solid; border-width:1px; line-height:1.5; {filterHasCatch ? 'background:var(--of-accent-glow); border-color:var(--of-accent-border); color:var(--of-accent);' : 'background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);'}"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6.5C18 6.5 16 4 12 4C8 4 4 7 4 12C4 17 8 20 12 20C16 20 18 17.5 18 17.5"/>
							<path d="M18 12H22"/>
							<path d="M20 10L22 12L20 14"/>
							<circle cx="9" cy="11" r="1" fill="currentColor"/>
						</svg>
					</button>
				</div>

			</div>
			{/if}
		{/if}

		<!-- Active filter summary -->
		{#if anyActive}
			<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8rem; padding-top:2px; border-top:1px solid var(--of-border-subtle);">
				<span style="color:var(--of-text-4);">
					{filtered.length}
					{filtered.length === 1 ? t.lure_singular : t.lure_plural}
					{t.matching} {t.filterActive}
				</span>
				<button onclick={clearAll} style="color:var(--of-accent); font-weight:600; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.8rem; padding:0;">
					{t.clear}
				</button>
			</div>
		{/if}
	</div>

	<!-- Empty state -->
	{#if filtered.length === 0}
		<div style="text-align:center; padding:80px 24px;">
			<div style="display:inline-flex; align-items:center; justify-content:center; width:88px; height:88px; border-radius:50%; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); margin-bottom:20px;">
				<svg width="44" height="44" viewBox="0 0 64 64" fill="none" style="color:var(--of-border);">
					<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.5"/>
					<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none" opacity="0.8" style="color:var(--of-text-4);"/>
					<ellipse cx="31" cy="29" rx="5" ry="2.5" fill="currentColor" opacity="0.4" style="color:var(--of-text-3);"/>
					<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none" style="color:var(--of-text-4);"/>
					<circle cx="48" cy="32" r="1.1" fill="currentColor" style="color:var(--of-text-4);"/>
					<line x1="18" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--of-border-strong);"/>
					<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" style="color:var(--of-border-strong);"/>
					<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--of-border);"/>
				</svg>
			</div>
			{#if anyActive}
				<p style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1.1rem; color:var(--of-text-2); margin:0 0 6px;">{t.noLuresMatch} {t.filterActive}</p>
				<p style="color:var(--of-text-4); font-size:0.875rem; margin:0;">
					<button onclick={clearAll} style="color:var(--of-accent); background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.875rem; text-decoration:underline; padding:0;">{t.clear}</button>
				</p>
			{:else}
				<p style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1.1rem; color:var(--of-text-2); margin:0 0 6px;">{t.noLuresYet}</p>
				<p style="color:var(--of-text-4); font-size:0.875rem; margin:0 0 20px;">
					<a href="/lures/new" style="color:var(--of-accent);">{t.addFirstLure}</a>
					{t.toGetStarted}
				</p>
			{/if}
		</div>
	{:else}
		<!-- Lure grid — wrapper reserves space so pagination doesn't jump on sparse pages -->
		<div style="min-height: {gridMinHeight}px;">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style="grid-auto-rows: minmax(295px, auto);">
			{#each pageItems as lure (lure.id)}
				<a
					href="/lures/{lure.id}"
					style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; overflow:hidden; text-decoration:none; display:flex; flex-direction:column; transition:border-color 0.2s, box-shadow 0.2s;"
					onmouseenter={function(e) {
						(e.currentTarget as HTMLElement).style.borderColor = 'var(--of-accent-border)';
						(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px var(--of-accent-glow)';
					}}
					onmouseleave={function(e) {
						(e.currentTarget as HTMLElement).style.borderColor = 'var(--of-border-subtle)';
						(e.currentTarget as HTMLElement).style.boxShadow = 'none';
					}}
				>
					<!-- Photo area -->
					<div style="position:relative; height:176px; background:var(--of-bg-overlay); overflow:hidden;">
						{#if lure.photoPath}
							<img src="/uploads/{lure.photoPath}" alt={lure.name}
								style="width:100%; height:100%; object-fit:cover; display:block;" />
						{:else}
							<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
								<svg width="52" height="52" viewBox="0 0 64 64" fill="none" style="color:var(--of-border-subtle);">
									<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.8"/>
									<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none" style="color:var(--of-bg-hover); opacity:0.8;"/>
									<ellipse cx="31" cy="29" rx="5" ry="2.5" fill="currentColor" style="color:var(--of-bg-hover); opacity:0.6;"/>
									<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none" style="color:var(--of-bg-hover);"/>
									<circle cx="48" cy="32" r="1.1" fill="currentColor" style="color:var(--of-bg-hover);"/>
									<line x1="18" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--of-border-subtle);"/>
									<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" style="color:var(--of-border-subtle);"/>
									<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--of-border-subtle);"/>
								</svg>
							</div>
						{/if}

						<!-- Lure number + amount badge -->
						{#if lure.lureNumber != null || lure.amount > 1}
							<div style="position:absolute; top:8px; left:8px; display:flex; gap:4px; align-items:center;">
								{#if lure.lureNumber != null}
									<div style="background:rgba(0,0,0,0.62); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:2px 7px; backdrop-filter:blur(6px);">
										<span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; font-weight:600; color:var(--of-badge-num-text); letter-spacing:0.05em;">{padNum(lure.lureNumber)}</span>
									</div>
								{/if}
								{#if lure.amount > 1}
									<div style="background:rgba(0,0,0,0.62); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:2px 7px; backdrop-filter:blur(6px);">
										<span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; font-weight:600; color:var(--of-warning); letter-spacing:0.05em;">×{lure.amount}</span>
									</div>
								{/if}
							</div>
						{/if}

						<!-- QR labeled indicator -->
						{#if lure.qrCoded}
							<div style="position:absolute; top:8px; right:8px; background:rgba(3,10,18,0.75); border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:1px solid var(--of-success-border);">
								<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
									<path d="M2 5L4.2 7.5L8 3" stroke="var(--of-success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
						{/if}

						<!-- Lost indicator -->
						{#if lure.lost}
							<div style="position:absolute; bottom:8px; left:8px; background:rgba(245,158,11,0.85); border-radius:6px; padding:2px 7px; backdrop-filter:blur(4px);">
								<span style="font-size:0.65rem; font-weight:700; color:var(--of-ink); letter-spacing:0.06em; text-transform:uppercase;">{t.lostStatus}</span>
							</div>
						{/if}

						<!-- Favourite heart -->
						<button
							type="button"
							onclick={(e) => toggleFavourite(lure.id, e)}
							aria-label={favourites[lure.id] ? 'Remove from favourites' : 'Add to favourites'}
							style="position:absolute; bottom:8px; right:8px; background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center;"
						>
							<svg width="14" height="14" viewBox="0 0 24 24"
								fill={favourites[lure.id] ? 'var(--of-danger)' : 'none'}
								stroke={favourites[lure.id] ? 'var(--of-danger)' : 'var(--of-text-2)'}
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								style="transition:fill 0.15s, stroke 0.15s; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.7));"
							>
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
							</svg>
						</button>
					</div>

					<!-- Card body -->
					<div style="padding:14px 14px 12px; flex:1; display:flex; flex-direction:column;">
						<h2 style="font-family:'Carter One',sans-serif; font-weight:700; font-size:0.95rem; color:var(--of-text-bright); margin:0 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
							{lure.name}
						</h2>

						{#if lure.brand}
							<p style="font-size:0.8rem; color:var(--of-text-2); margin:0 0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{lure.brand}</p>
						{:else}
							<div style="height:20px; margin-bottom:8px;"></div>
						{/if}

						<div style="flex:1;"></div>

						{#if lure.tags.length > 0}
							<div style="display:flex; flex-wrap:nowrap; gap:4px; margin-top:6px; overflow:hidden;">
								{#each lure.tags.slice(0, 2) as tag (tag.id)}
									<span style="font-size:0.68rem; padding:2px 7px; border-radius:20px; background:var(--of-success-bg); color:var(--of-success); border:1px solid var(--of-success-border); white-space:nowrap;">{tag.name}</span>
								{/each}
								{#if lure.tags.length > 2}
									<span style="font-size:0.68rem; padding:2px 7px; border-radius:20px; background:var(--of-border); color:var(--of-text-3); white-space:nowrap;">+{lure.tags.length - 2}</span>
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1 || filtered.length > PAGE_SIZES[0]}
			<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding-top:8px;">
				<div style="display:flex; align-items:center; gap:8px;">
					<button
						onclick={() => page = Math.max(1, pageClamped - 1)}
						disabled={pageClamped <= 1}
						style="padding:6px 14px; font-size:0.8rem; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-surface); color:var(--of-text-2); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {pageClamped <= 1 ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					>←</button>
					<span style="font-size:0.85rem; color:var(--of-text-3); font-variant-numeric:tabular-nums;">
						{pageClamped} / {totalPages}
					</span>
					<button
						onclick={() => page = Math.min(totalPages, pageClamped + 1)}
						disabled={pageClamped >= totalPages}
						style="padding:6px 14px; font-size:0.8rem; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-surface); color:var(--of-text-2); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {pageClamped >= totalPages ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					>→</button>
				</div>

				<div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:var(--of-text-4);">
					<span>{t.perPage}</span>
					<select
						bind:value={pageSize}
						style="padding:5px 10px; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.82rem; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif;"
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

<style>
	input.no-spin::-webkit-outer-spin-button,
	input.no-spin::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input.no-spin[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
