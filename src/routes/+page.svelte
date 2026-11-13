<script lang="ts">
	import type { PageData } from './$types';
	import { photoUrl, gridSrcset, GRID_SIZES, THUMB_SMALL } from '#lib/photo.js';
	import { onMount } from 'svelte';
	import { readLureView, writeLureView, type LureView } from '#lib/lureView.js';

	let { data }: { data: PageData } = $props();
	const { t } = $derived(data);

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

	const lureIdsWithCatches = $derived(new Set(data.lureIdsWithCatches));
	const catchCounts: Record<string, number> = $derived(data.catchCounts ?? {});

	// Box (compartment grid) or dense list; remembered per browser.
	let view = $state<LureView>('box');
	onMount(() => { view = readLureView(); });
	function setView(v: LureView) { view = v; writeLureView(v); }
	let filterSizeMin    = $state('');
	let filterSizeMax    = $state('');
	let filterWeightMin  = $state('');
	let filterWeightMax  = $state('');
	let filtersExpanded  = $state(false);

	let favourites = $derived<Record<string, boolean>>(
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
	// Stable grid height on wide screens (4 columns, box view only; see .of-lure-wrap)
	const gridRows      = $derived(Math.ceil(pageSize / 4));
	const gridMinHeight = $derived(view === 'box' ? gridRows * 300 + Math.max(0, gridRows - 1) * 16 : 0);

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
		const flip = () => { favourites = { ...favourites, [id]: !favourites[id] }; };
		flip();
		try {
			const res = await fetch(`/api/lures/${id}/favourite`, { method: 'POST' });
			if (!res.ok) flip(); // revert on error
		} catch {
			flip();
		}
	}

	function chipStyle(mode: ChipMode | undefined): string {
		const base = "font-size:0.75rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; line-height:1.5; white-space:nowrap; border-style:solid; border-width:1px;";
		if (mode === 'include') return base + "background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);";
		if (mode === 'exclude') return base + "background:var(--of-danger-bg); border-color:var(--of-danger-border); color:var(--of-danger); text-decoration:line-through;";
		return base + "background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);";
	}

	function chipTitle(mode: ChipMode | undefined): string {
		if (mode === 'include') return t.filterHintExclude;
		if (mode === 'exclude') return t.filterHintClear;
		return t.filterHintInclude;
	}

	function padNum(n: number | null | undefined) {
		if (n == null) return null;
		return '#' + String(n).padStart(4, '0');
	}
</script>

<div class="space-y-5">
	<h1 class="sr-only">{t.navLures}</h1>

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
				aria-label={t.search}
				bind:value={search}
				placeholder={t.searchPlaceholder}
				style="width:100%; padding:9px 12px 9px 36px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif;"
				onfocus={function(e) { (e.target as HTMLElement).style.borderColor = 'var(--of-accent-solid)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px var(--of-accent-bg-hover)'; }}
				onblur={function(e) { (e.target as HTMLElement).style.borderColor = 'var(--of-border)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
			/>
		</div>

		<!-- Filter toggle + layout switch -->
		<div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
			{#if hasAnyOptions}
				<button
					onclick={() => filtersExpanded = !filtersExpanded}
					aria-expanded={filtersExpanded}
					class="of-touch"
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); border:1px solid {filtersExpanded || activeFilterCount > 0 ? 'var(--of-accent-border)' : 'var(--of-border)'}; color:{filtersExpanded || activeFilterCount > 0 ? 'var(--of-accent)' : 'var(--of-text-2)'}; padding:6px 14px; border-radius:20px; cursor:pointer; font-size:0.8125rem; font-weight:500; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor=filtersExpanded||activeFilterCount>0?'var(--of-accent-border)':'var(--of-border)'; (e.currentTarget as HTMLElement).style.color=filtersExpanded||activeFilterCount>0?'var(--of-accent)':'var(--of-text-2)';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;" aria-hidden="true">
						<line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						<line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						<line x1="11" y1="18" x2="13" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					{t.filterButton}
					{#if activeFilterCount > 0}
						<span style="font-size:0.75rem; font-weight:600; background:var(--of-accent-bg-hover); color:var(--of-accent); border:1px solid var(--of-accent-border); border-radius:20px; padding:1px 7px; line-height:1.5;">{activeFilterCount}</span>
					{/if}
					<svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"
						style="transform:rotate({filtersExpanded ? '180deg' : '0deg'}); transition:transform 0.2s; flex-shrink:0;">
						<path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			{:else}
				<span></span>
			{/if}

			<div role="group" aria-label={t.lureViewLabel} class="of-seg">
				<button type="button" aria-pressed={view === 'box'} aria-label={t.lureViewBox} title={t.lureViewBox} onclick={() => setView('box')} class="of-tap">
					<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/></svg>
				</button>
				<button type="button" aria-pressed={view === 'list'} aria-label={t.lureViewList} title={t.lureViewList} onclick={() => setView('list')} class="of-tap">
					<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5h12M2 8h12M2 12.5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
				</button>
			</div>
		</div>

		{#if hasAnyOptions}

			<!-- Expanded filter rows -->
			{#if filtersExpanded}
			<div style="display:flex; flex-direction:column; gap:6px;">

				{#if types.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.type}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each types as opt}
								<button class="of-chip" style={chipStyle(filterType[opt])} title={chipTitle(filterType[opt])} aria-pressed={!!filterType[opt]} data-mode={filterType[opt] ?? 'off'}
									onclick={() => filterType = toggleChip(filterType, opt)}>{opt}{#if filterType[opt] === 'exclude'}<span class="sr-only"> ({t.filterExcluded})</span>{/if}</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if depths.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.runningDepth}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each depths as opt}
								<button class="of-chip" style={chipStyle(filterDepth[opt])} title={chipTitle(filterDepth[opt])} aria-pressed={!!filterDepth[opt]} data-mode={filterDepth[opt] ?? 'off'}
									onclick={() => filterDepth = toggleChip(filterDepth, opt)}>
									{(t[`runningDepth_${opt}` as keyof typeof t] as string) ?? opt}{#if filterDepth[opt] === 'exclude'}<span class="sr-only"> ({t.filterExcluded})</span>{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if lights.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.lightConditions}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each lights as opt}
								<button class="of-chip" style={chipStyle(filterLight[String(opt)])} title={chipTitle(filterLight[String(opt)])} aria-pressed={!!filterLight[String(opt)]} data-mode={filterLight[String(opt)] ?? 'off'}
									onclick={() => filterLight = toggleChip(filterLight, String(opt))}>
									{t[`lightConditions_${opt}` as keyof typeof t] ?? opt}{#if filterLight[String(opt)] === 'exclude'}<span class="sr-only"> ({t.filterExcluded})</span>{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if species.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; padding-top:4px; flex-shrink:0;">{t.fishSpecies}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each species as opt}
								<button class="of-chip" style={chipStyle(filterSpecies[opt])} title={chipTitle(filterSpecies[opt])} aria-pressed={!!filterSpecies[opt]} data-mode={filterSpecies[opt] ?? 'off'}
									onclick={() => filterSpecies = toggleChip(filterSpecies, opt)}>{opt}{#if filterSpecies[opt] === 'exclude'}<span class="sr-only"> ({t.filterExcluded})</span>{/if}</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Size range -->
				{#if hasSizes}
					<div style="display:flex; align-items:center; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.size} (cm)</span>
						<div style="display:flex; align-items:center; gap:5px;">
							<input type="number" min="0" step="0.1" placeholder={t.filterFrom} class="no-spin"
								bind:value={filterSizeMin}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterSizeMin !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterSizeMin !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.75rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
							<span style="color:var(--of-text-4); font-size:0.75rem; flex-shrink:0;">—</span>
							<input type="number" min="0" step="0.1" placeholder={t.filterTo} class="no-spin"
								bind:value={filterSizeMax}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterSizeMax !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterSizeMax !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.75rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
						</div>
					</div>
				{/if}

				<!-- Weight range -->
				{#if hasWeights}
					<div style="display:flex; align-items:center; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.weightG}</span>
						<div style="display:flex; align-items:center; gap:5px;">
							<input type="number" min="0" step="0.1" placeholder={t.filterFrom} class="no-spin"
								bind:value={filterWeightMin}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterWeightMin !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterWeightMin !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.75rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
							<span style="color:var(--of-text-4); font-size:0.75rem; flex-shrink:0;">—</span>
							<input type="number" min="0" step="0.1" placeholder={t.filterTo} class="no-spin"
								bind:value={filterWeightMax}
								style="width:66px; padding:4px 7px; background:var(--of-bg-elevated); border:1px solid {filterWeightMax !== '' ? 'var(--of-accent-border)' : 'var(--of-border)'}; border-radius:8px; color:{filterWeightMax !== '' ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-size:0.75rem; outline:none; font-family:'JetBrains Mono',monospace; box-sizing:border-box;" />
						</div>
					</div>
				{/if}

				<!-- Favourites row -->
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.filterFavourites}</span>
					<button
						onclick={() => filterFavourites = !filterFavourites}
						aria-label={t.filterFavourites}
						aria-pressed={filterFavourites}
						class="of-chip"
						style="display:inline-flex; align-items:center; gap:5px; font-size:0.75rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; border-style:solid; border-width:1px; line-height:1.5; {filterFavourites ? 'background:var(--of-danger-bg); border-color:var(--of-danger-border); color:var(--of-danger);' : 'background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);'}"
					>
						<svg width="11" height="11" viewBox="0 0 24 24" fill={filterFavourites ? 'var(--of-danger)' : 'none'} stroke={filterFavourites ? 'var(--of-danger)' : 'var(--of-text-4)'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
					</button>
				</div>

				<!-- Has Catch row -->
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="min-width:88px; text-align:right; font-size:0.75rem; color:var(--of-text-4); font-weight:500; flex-shrink:0;">{t.filterHasCatch}</span>
					<button
						onclick={() => filterHasCatch = !filterHasCatch}
						aria-label={t.filterHasCatch}
						aria-pressed={filterHasCatch}
						class="of-chip"
						style="display:inline-flex; align-items:center; gap:5px; font-size:0.75rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; border-style:solid; border-width:1px; line-height:1.5; {filterHasCatch ? 'background:var(--of-accent-glow); border-color:var(--of-accent-border); color:var(--of-accent);' : 'background:transparent; border-color:var(--of-border-subtle); color:var(--of-text-4);'}"
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
			<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8125rem; padding-top:2px; border-top:1px solid var(--of-border-subtle);">
				<span style="color:var(--of-text-4);">
					{filtered.length}
					{filtered.length === 1 ? t.lure_singular : t.lure_plural}
					{t.matching} {t.filterActive}
				</span>
				<button onclick={clearAll} style="color:var(--of-accent); font-weight:600; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.8125rem; padding:0;">
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
				<p style="font-family:'DM Sans',sans-serif; font-weight:500; font-size:var(--of-fs-section); color:var(--of-text-2); margin:0 0 6px;">{t.noLuresMatch} {t.filterActive}</p>
				<p style="color:var(--of-text-4); font-size:0.875rem; margin:0;">
					<button onclick={clearAll} style="color:var(--of-accent); background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.875rem; text-decoration:underline; padding:0;">{t.clear}</button>
				</p>
			{:else}
				<p style="font-family:'DM Sans',sans-serif; font-weight:500; font-size:var(--of-fs-section); color:var(--of-text-2); margin:0 0 6px;">{t.noLuresYet}</p>
				<p style="color:var(--of-text-4); font-size:0.875rem; margin:0 0 20px;">
					<a href="/lures/new" style="color:var(--of-accent);">{t.addFirstLure}</a>
					{t.toGetStarted}
				</p>
			{/if}
		</div>
	{:else}
		<!-- Lure box / list. The wrapper reserves height on wide screens so pagination doesn't jump on sparse pages. -->
		<div class="of-lure-wrap" style="--grid-min:{gridMinHeight}px;">
		{#if view === 'box'}
		<div class="of-lure-grid">
			{#each pageItems as lure (lure.id)}
				<a href="/lures/{lure.id}" class="of-lure-card">
					<!-- Compartment: the photo sits in a recessed well, like a tray in a tackle box -->
					<div class="of-lure-well">
						<div class="of-lure-photo">
							{#if lure.photoPath}
								<img src={photoUrl(lure.photoPath, 320)} srcset={gridSrcset(lure.photoPath)} sizes={GRID_SIZES} alt={lure.name} loading="lazy" decoding="async" />
							{:else}
								<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
									<svg width="44" height="44" viewBox="0 0 64 64" fill="none" style="color:var(--of-border);" aria-hidden="true">
										<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.8"/>
										<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none"/>
										<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
										<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
									</svg>
								</div>
							{/if}

							<!-- Number plate (+ amount) as a small badge on the photo: the label strip leads with the name -->
							{#if lure.lureNumber != null || lure.amount > 1}
								<span class="of-lure-badges">
									{#if lure.lureNumber != null}
										<span class="of-lure-scrim of-lure-num">{padNum(lure.lureNumber)}</span>
									{/if}
									{#if lure.amount > 1}
										<span class="of-lure-scrim of-lure-num" style="color:#fcd34d;">×{lure.amount}</span>
									{/if}
								</span>
							{/if}

							{#if lure.qrCoded}
								<span class="of-lure-scrim" style="top:6px; right:6px; padding:4px; border-radius:50%;" title={t.qrCodesTitle}>
									<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5L4.2 7.5L8 3" stroke="#86efac" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</span>
							{/if}

							{#if lure.lost}
								<span style="position:absolute; bottom:6px; left:6px; background:rgba(245,158,11,0.9); border-radius:6px; padding:2px 7px; font-size:0.75rem; font-weight:700; letter-spacing:0.04em; color:#1a1204; text-transform:uppercase;">{t.lostStatus}</span>
							{/if}

							<button type="button" onclick={(e) => toggleFavourite(lure.id, e)}
								aria-label={favourites[lure.id] ? t.favouriteRemove : t.favouriteAdd}
								aria-pressed={!!favourites[lure.id]}
								class="of-hit of-lure-scrim" style="bottom:6px; right:6px; padding:5px; border-radius:50%; border:none; cursor:pointer; display:flex;">
								<svg width="13" height="13" viewBox="0 0 24 24"
									fill={favourites[lure.id] ? 'var(--of-danger)' : 'none'}
									stroke={favourites[lure.id] ? 'var(--of-danger)' : '#fff'}
									stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Label strip: name first, catch count beside it -->
					<div class="of-lure-body">
						<div style="display:flex; align-items:center; gap:8px;">
							<h2 class="of-lure-name">{lure.name}</h2>
							{#if catchCounts[lure.id]}
								<span class="of-lure-caught" title={t.lureCaughtN.replace('{n}', String(catchCounts[lure.id]))}>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12c3-4 7-6 11-6 3 0 5 2 7 6-2 4-4 6-7 6-4 0-8-2-11-6z"/><path d="M3 12l-1.5-3M3 12l-1.5 3"/></svg>
									<span class="sr-only">{t.lureCaughtN.replace('{n}', String(catchCounts[lure.id]))}</span>
									<span aria-hidden="true">{catchCounts[lure.id]}</span>
								</span>
							{/if}
						</div>
						<p class="of-lure-brand">{lure.brand ?? ''}</p>
						<div style="flex:1;"></div>
						{#if lure.tags.length > 0}
							<div class="of-lure-tags">
								{#each lure.tags.slice(0, 2) as tag (tag.id)}
									<span style="font-size:0.75rem; padding:2px 7px; border-radius:20px; background:var(--of-success-bg); color:var(--of-success); border:1px solid var(--of-success-border); white-space:nowrap;">{tag.name}</span>
								{/each}
								{#if lure.tags.length > 2}
									<span style="font-size:0.75rem; padding:2px 7px; border-radius:20px; background:var(--of-border); color:var(--of-text-3); white-space:nowrap;">+{lure.tags.length - 2}</span>
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
		{:else}
		<div class="of-lure-list">
			{#each pageItems as lure (lure.id)}
				<a href="/lures/{lure.id}" class="of-lure-row">
					<div class="of-lure-thumb">
						{#if lure.photoPath}
							<img src={photoUrl(lure.photoPath, THUMB_SMALL)} alt="" loading="lazy" decoding="async" />
						{/if}
					</div>
					<div style="min-width:0; flex:1;">
						<div style="display:flex; align-items:baseline; gap:8px; min-width:0;">
							{#if lure.lureNumber != null}<span class="of-lure-plate" style="font-size:0.8125rem;">{padNum(lure.lureNumber)}</span>{/if}
							<h2 class="of-lure-name" style="margin:0;">{lure.name}</h2>
						</div>
						<p class="of-lure-brand" style="margin:2px 0 0;">
							{[lure.brand, lure.type].filter(Boolean).join(' · ')}
							{#if lure.lost}<span style="color:var(--of-warning); font-weight:600;"> · {t.lostStatus}</span>{/if}
						</p>
					</div>
					{#if catchCounts[lure.id]}
						<span class="of-lure-caught">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12c3-4 7-6 11-6 3 0 5 2 7 6-2 4-4 6-7 6-4 0-8-2-11-6z"/><path d="M3 12l-1.5-3M3 12l-1.5 3"/></svg>
							<span class="sr-only">{t.lureCaughtN.replace('{n}', String(catchCounts[lure.id]))}</span>
							<span aria-hidden="true">{catchCounts[lure.id]}</span>
						</span>
					{/if}
					<button type="button" onclick={(e) => toggleFavourite(lure.id, e)}
						aria-label={favourites[lure.id] ? t.favouriteRemove : t.favouriteAdd}
						aria-pressed={!!favourites[lure.id]}
						class="of-tap" style="background:none; border:none; cursor:pointer; padding:6px; display:flex; flex-shrink:0;">
						<svg width="15" height="15" viewBox="0 0 24 24"
							fill={favourites[lure.id] ? 'var(--of-danger)' : 'none'}
							stroke={favourites[lure.id] ? 'var(--of-danger)' : 'var(--of-text-4)'}
							stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
					</button>
				</a>
			{/each}
		</div>
		{/if}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1 || filtered.length > PAGE_SIZES[0]}
			<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding-top:8px;">
				<div style="display:flex; align-items:center; gap:8px;">
					<button aria-label={t.previousPage}
						onclick={() => page = Math.max(1, pageClamped - 1)}
						disabled={pageClamped <= 1}
						style="padding:6px 14px; font-size:0.8125rem; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-surface); color:var(--of-text-2); cursor:pointer; transition:var(--of-transition); font-family:'DM Sans',sans-serif; {pageClamped <= 1 ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style="transform:rotate(180deg);"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
					<span style="font-size:0.85rem; color:var(--of-text-3); font-variant-numeric:tabular-nums;">
						{pageClamped} / {totalPages}
					</span>
					<button aria-label={t.nextPage}
						onclick={() => page = Math.min(totalPages, pageClamped + 1)}
						disabled={pageClamped >= totalPages}
						style="padding:6px 14px; font-size:0.8125rem; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-surface); color:var(--of-text-2); cursor:pointer; transition:var(--of-transition); font-family:'DM Sans',sans-serif; {pageClamped >= totalPages ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
				</div>

				<div style="display:flex; align-items:center; gap:8px; font-size:0.8125rem; color:var(--of-text-4);">
					<span>{t.perPage}</span>
					<select
						bind:value={pageSize}
						style="padding:5px 10px; border:1px solid var(--of-border); border-radius:8px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif;"
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
	/* ── Tackle box: compartments with a recessed photo well and a label strip ── */
	.of-lure-grid {
		display: grid; gap: 10px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	@media (min-width: 768px)  { .of-lure-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; } }
	@media (min-width: 1280px) {
		.of-lure-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
		.of-lure-wrap { min-height: var(--grid-min); }
	}
	.of-lure-card {
		display: flex; flex-direction: column; text-decoration: none;
		background: var(--of-bg-surface); border: 1px solid var(--of-border-subtle); border-radius: 14px;
		overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
	}
	.of-lure-card:hover { border-color: var(--of-accent-border); box-shadow: 0 8px 32px var(--of-accent-glow); }
	.of-lure-card:focus-visible { outline: 2px solid var(--of-accent); outline-offset: 2px; }
	.of-lure-well { padding: 6px 6px 0; }
	.of-lure-photo {
		position: relative; aspect-ratio: 4 / 3; border-radius: 9px; overflow: hidden;
		background: var(--of-bg-base); box-shadow: inset 0 0 0 1px var(--of-border-subtle);
	}
	.of-lure-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
	/* Badges on a photo sit on a fixed dark scrim in every theme and mode, so their
	   ink is fixed light too (theme status tokens go dark in light mode). */
	.of-lure-scrim {
		position: absolute; display: inline-flex; align-items: center;
		/* 0.7, not 0.6: over a near-white photo well 0.6 left the gold amount at ~4.3:1 */
		background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px);
		border-radius: 6px; padding: 2px 7px; font-size: 0.75rem; font-weight: 600; line-height: 1.4;
	}
	.of-lure-body { flex: 1; display: flex; flex-direction: column; padding: 8px 12px 12px; }
	.of-lure-badges { position: absolute; top: 6px; left: 6px; display: flex; gap: 4px; }
	/* Static inside the flex row (the scrim class is absolute for the corner badges).
	   --of-badge-num-text: accent in dark mode, white in light, readable on the dark scrim. */
	.of-lure-num {
		position: static; color: var(--of-badge-num-text);
		font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em;
	}
	.of-lure-plate {
		font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 600;
		letter-spacing: 0.02em; color: var(--of-accent); line-height: 1.2; white-space: nowrap;
	}
	.of-lure-caught {
		display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
		font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 600;
		color: var(--of-text-2); background: var(--of-bg-elevated); border: 1px solid var(--of-border);
		border-radius: 20px; padding: 1px 8px 1px 6px;
	}
	.of-lure-name {
		font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.95rem; color: var(--of-text-bright);
		margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		flex: 1; min-width: 0;
	}
	.of-lure-brand {
		font-size: 0.8125rem; color: var(--of-text-3); margin: 0; min-height: 1.2em;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.of-lure-tags { display: flex; flex-wrap: nowrap; gap: 4px; margin-top: 8px; overflow: hidden; }
	/* Phones: two compartments across. Keep only the essentials. */
	@media (max-width: 480px) {
		.of-lure-body { padding: 6px 10px 10px; }
		.of-lure-name { font-size: 0.875rem; }
		.of-lure-tags { display: none; }
	}

	/* ── Dense list ── */
	.of-lure-list { display: flex; flex-direction: column; gap: 6px; }
	.of-lure-row {
		display: flex; align-items: center; gap: 12px; text-decoration: none;
		background: var(--of-bg-surface); border: 1px solid var(--of-border-subtle); border-radius: 12px;
		padding: 6px 8px 6px 6px; transition: border-color 0.15s;
	}
	.of-lure-row:hover { border-color: var(--of-accent-border); }
	.of-lure-row:focus-visible { outline: 2px solid var(--of-accent); outline-offset: 2px; }
	.of-lure-thumb {
		width: 56px; height: 42px; flex-shrink: 0; border-radius: var(--of-radius-control-sm); overflow: hidden;
		background: var(--of-bg-base); box-shadow: inset 0 0 0 1px var(--of-border-subtle);
	}
	.of-lure-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

	/* ── Segmented layout switch ── */
	.of-seg { display: inline-flex; border: 1px solid var(--of-border); border-radius: 10px; padding: 2px; background: var(--of-bg-elevated); }
	.of-seg button {
		display: flex; align-items: center; justify-content: center; width: 34px; height: 30px;
		background: none; border: none; border-radius: 8px; color: var(--of-text-4); cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}
	.of-seg button:hover { color: var(--of-text-2); }
	.of-seg button[aria-pressed='true'] { background: var(--of-accent-bg-hover); color: var(--of-accent); }
	.of-seg button:focus-visible { outline: 2px solid var(--of-accent); outline-offset: 1px; }

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
