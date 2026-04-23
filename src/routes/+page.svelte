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

	const hasAnyOptions = $derived(
		types.length > 0 || depths.length > 0 || lights.length > 0 || species.length > 0
	);
	const anyActive = $derived(
		!!search ||
		filterFavourites ||
		Object.keys(filterType).length > 0 ||
		Object.keys(filterDepth).length > 0 || Object.keys(filterLight).length > 0 ||
		Object.keys(filterSpecies).length > 0
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
		if (!passesFilter(l.type,             filterType))   return false;
		if (!passesFilter(l.runningDepth,     filterDepth))  return false;
		if (!passesFilter(l.lightConditions != null ? String(l.lightConditions) : null, filterLight)) return false;
		if (!passesSpeciesFilter(l.species, filterSpecies)) return false;
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

	const totalPages  = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const pageClamped = $derived(Math.min(page, totalPages));
	const pageItems   = $derived(filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize));

	$effect(() => {
		search; filterFavourites; filterType; filterDepth; filterLight; filterSpecies; pageSize;
		page = 1;
	});

	function clearAll() {
		search = '';
		filterFavourites = false;
		filterType = {}; filterDepth = {}; filterLight = {}; filterSpecies = {};
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
		if (mode === 'include') return base + "background:rgba(6,182,212,0.12); border-color:rgba(6,182,212,0.45); color:#22d3ee;";
		if (mode === 'exclude') return base + "background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.35); color:#f87171; text-decoration:line-through;";
		return base + "background:transparent; border-color:#1e3a56; color:#3d6a84;";
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
	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:10px;">

		<!-- Search -->
		<div style="position:relative;">
			<svg style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#3d6a84; pointer-events:none;" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
				<path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
			<input
				type="search"
				bind:value={search}
				placeholder={t.searchPlaceholder}
				style="width:100%; padding:9px 12px 9px 36px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif;"
				onfocus={function(e) { (e.target as HTMLElement).style.borderColor = '#06b6d4'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
				onblur={function(e) { (e.target as HTMLElement).style.borderColor = '#243f5e'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
			/>
		</div>

		<!-- Include / Exclude chip filters -->
		{#if hasAnyOptions}
			<div style="display:flex; flex-direction:column; gap:6px;">

				{#if types.length > 0}
					<div style="display:flex; align-items:flex-start; gap:10px;">
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:#3d6a84; font-weight:500; padding-top:4px; flex-shrink:0;">{t.type}</span>
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
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:#3d6a84; font-weight:500; padding-top:4px; flex-shrink:0;">{t.runningDepth}</span>
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
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:#3d6a84; font-weight:500; padding-top:4px; flex-shrink:0;">{t.lightConditions}</span>
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
						<span style="min-width:88px; text-align:right; font-size:0.7rem; color:#3d6a84; font-weight:500; padding-top:4px; flex-shrink:0;">{t.fishSpecies}</span>
						<div style="display:flex; flex-wrap:wrap; gap:5px;">
							{#each species as opt}
								<button style={chipStyle(filterSpecies[opt])} title={chipTitle(filterSpecies[opt])}
									onclick={() => filterSpecies = toggleChip(filterSpecies, opt)}>{opt}</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Favourites row -->
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="min-width:88px; text-align:right; font-size:0.7rem; color:#3d6a84; font-weight:500; flex-shrink:0;">{t.filterFavourites}</span>
					<button
						onclick={() => filterFavourites = !filterFavourites}
						style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; padding:3px 10px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.12s, border-color 0.12s, color 0.12s; border-style:solid; border-width:1px; line-height:1.5; {filterFavourites ? 'background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.4); color:#f87171;' : 'background:transparent; border-color:#1e3a56; color:#3d6a84;'}"
					>
						<svg width="11" height="11" viewBox="0 0 24 24" fill={filterFavourites ? '#f87171' : 'none'} stroke={filterFavourites ? '#f87171' : '#3d6a84'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
					</button>
				</div>

			</div>
		{/if}

		<!-- Active filter summary -->
		{#if anyActive}
			<div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8rem; padding-top:2px; border-top:1px solid #172f4a;">
				<span style="color:#3d6a84;">
					{filtered.length}
					{filtered.length === 1 ? t.lure_singular : t.lure_plural}
					{t.matching} {t.filterActive}
				</span>
				<button onclick={clearAll} style="color:#22d3ee; font-weight:600; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.8rem; padding:0;">
					{t.clear}
				</button>
			</div>
		{/if}
	</div>

	<!-- Empty state -->
	{#if filtered.length === 0}
		<div style="text-align:center; padding:80px 24px;">
			<div style="display:inline-flex; align-items:center; justify-content:center; width:88px; height:88px; border-radius:50%; background:#0b1a2c; border:1px solid #172f4a; margin-bottom:20px;">
				<svg width="44" height="44" viewBox="0 0 64 64" fill="none" style="color:#243f5e;">
					<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.5"/>
					<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none" opacity="0.8" style="color:#3d6a84;"/>
					<ellipse cx="31" cy="29" rx="5" ry="2.5" fill="currentColor" opacity="0.4" style="color:#5d8fa8;"/>
					<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none" style="color:#3d6a84;"/>
					<circle cx="48" cy="32" r="1.1" fill="currentColor" style="color:#3d6a84;"/>
					<line x1="18" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:#2d5270;"/>
					<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" style="color:#2d5270;"/>
					<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:#243f5e;"/>
				</svg>
			</div>
			{#if anyActive}
				<p style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1.1rem; color:#8ab8cc; margin:0 0 6px;">{t.noLuresMatch} {t.filterActive}</p>
				<p style="color:#3d6a84; font-size:0.875rem; margin:0;">
					<button onclick={clearAll} style="color:#22d3ee; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.875rem; text-decoration:underline; padding:0;">{t.clear}</button>
				</p>
			{:else}
				<p style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1.1rem; color:#8ab8cc; margin:0 0 6px;">{t.noLuresYet}</p>
				<p style="color:#3d6a84; font-size:0.875rem; margin:0 0 20px;">
					<a href="/lures/new" style="color:#22d3ee;">{t.addFirstLure}</a>
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
					style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; overflow:hidden; text-decoration:none; display:block; transition:border-color 0.2s, box-shadow 0.2s;"
					onmouseenter={function(e) {
						(e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.5)';
						(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(6,182,212,0.1)';
					}}
					onmouseleave={function(e) {
						(e.currentTarget as HTMLElement).style.borderColor = '#172f4a';
						(e.currentTarget as HTMLElement).style.boxShadow = 'none';
					}}
				>
					<!-- Photo area -->
					<div style="position:relative; height:176px; background:#0d1f35; overflow:hidden;">
						{#if lure.photoPath}
							<img src="/uploads/{lure.photoPath}" alt={lure.name}
								style="width:100%; height:100%; object-fit:cover; display:block;" />
						{:else}
							<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
								<svg width="52" height="52" viewBox="0 0 64 64" fill="none" style="color:#172f4a;">
									<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.8"/>
									<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none" style="color:#1d3855; opacity:0.8;"/>
									<ellipse cx="31" cy="29" rx="5" ry="2.5" fill="currentColor" style="color:#1d3855; opacity:0.6;"/>
									<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none" style="color:#1d3855;"/>
									<circle cx="48" cy="32" r="1.1" fill="currentColor" style="color:#1d3855;"/>
									<line x1="18" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:#172f4a;"/>
									<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" style="color:#172f4a;"/>
									<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:#172f4a;"/>
								</svg>
							</div>
						{/if}

						<!-- Lure number badge -->
						{#if lure.lureNumber != null}
							<div style="position:absolute; top:8px; left:8px; background:rgba(3,10,18,0.45); border:1px solid rgba(6,182,212,0.25); border-radius:6px; padding:2px 7px; backdrop-filter:blur(6px);">
								<span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; font-weight:600; color:#7dd3fc; letter-spacing:0.05em;">{padNum(lure.lureNumber)}</span>
							</div>
						{/if}

						<!-- QR labeled indicator -->
						{#if lure.qrCoded}
							<div style="position:absolute; top:8px; right:8px; background:rgba(3,10,18,0.75); border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(34,197,94,0.3);">
								<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
									<path d="M2 5L4.2 7.5L8 3" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
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
								fill={favourites[lure.id] ? '#f87171' : 'none'}
								stroke={favourites[lure.id] ? '#f87171' : '#8ab8cc'}
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								style="transition:fill 0.15s, stroke 0.15s; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.7));"
							>
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
							</svg>
						</button>
					</div>

					<!-- Card body -->
					<div style="padding:14px 14px 12px;">
						<h2 style="font-family:'Carter One',sans-serif; font-weight:700; font-size:0.95rem; color:#e0eaf8; margin:0 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
							{lure.name}
						</h2>

						{#if lure.brand}
							<p style="font-size:0.8rem; color:#5d8fa8; margin:0 0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{lure.brand}</p>
						{:else}
							<div style="height:20px; margin-bottom:8px;"></div>
						{/if}

						{#if lure.tags.length > 0}
							<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:7px;">
								{#each lure.tags as tag (tag.id)}
									<span style="font-size:0.68rem; padding:2px 7px; border-radius:20px; background:rgba(74,222,128,0.08); color:#4ade80; border:1px solid rgba(74,222,128,0.15);">{tag.name}</span>
								{/each}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1 || filtered.length > PAGE_SIZES[0]}
			<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding-top:8px;">
				<div style="display:flex; align-items:center; gap:8px;">
					<button
						onclick={() => page = Math.max(1, pageClamped - 1)}
						disabled={pageClamped <= 1}
						style="padding:6px 14px; font-size:0.8rem; border:1px solid #243f5e; border-radius:8px; background:#0b1a2c; color:#8ab8cc; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {pageClamped <= 1 ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					>←</button>
					<span style="font-size:0.85rem; color:#5d8fa8; font-variant-numeric:tabular-nums;">
						{pageClamped} / {totalPages}
					</span>
					<button
						onclick={() => page = Math.min(totalPages, pageClamped + 1)}
						disabled={pageClamped >= totalPages}
						style="padding:6px 14px; font-size:0.8rem; border:1px solid #243f5e; border-radius:8px; background:#0b1a2c; color:#8ab8cc; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {pageClamped >= totalPages ? 'opacity:0.35; cursor:not-allowed;' : ''}"
					>→</button>
				</div>

				<div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#3d6a84;">
					<span>{t.perPage}</span>
					<select
						bind:value={pageSize}
						style="padding:5px 10px; border:1px solid #243f5e; border-radius:8px; background:#0f2238; color:#8ab8cc; font-size:0.82rem; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif;"
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
