<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t, rods, reels, lines, combos, reelCurrentLines } = $derived(data);

	type Tab = 'rods' | 'reels' | 'lines' | 'combos';
	const TABS: Tab[] = ['rods', 'reels', 'lines', 'combos'];

	// The tab lives in the URL (?tab=reels) so Back from a reel returns to Reels,
	// and the detail pages can link straight to their own tab.
	const activeTab = $derived.by((): Tab => {
		const q = page.url.searchParams.get('tab');
		return TABS.includes(q as Tab) ? (q as Tab) : 'rods';
	});

	const tabLabel = $derived({ rods: t.tackleRods, reels: t.tackleReels, lines: t.tackleLines, combos: t.tackleCombos });
	const addLabel = $derived({ rods: t.rodAddTitle, reels: t.reelAddTitle, lines: t.lineAddTitle, combos: t.comboAddTitle });
	const emptyLabel = $derived({ rods: t.tackleNoRods, reels: t.tackleNoReels, lines: t.tackleNoLines, combos: t.tackleNoCombos });
	const count = $derived({ rods: rods.length, reels: reels.length, lines: lines.length, combos: combos.length });

	// Same sub-nav as Settings: compact, neutral active state.
	const tabStyle = (active: boolean) =>
		`font-size:0.8125rem; font-weight:500; padding:8px 16px; border-radius:8px; text-decoration:none; transition:var(--of-transition); ${active ? 'color:var(--of-text-bright); background:var(--of-bg-elevated); box-shadow:inset 0 0 0 1px var(--of-border);' : 'color:var(--of-text-3); background:transparent;'}`;

	const gearName = (g: { brand: string | null; model: string }) => (g.brand ? `${g.brand} ${g.model}` : g.model);

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<div>
	<h1 class="sr-only">{t.tackleTitle}</h1>

	<div class="of-tackle-head">
		<nav aria-label={t.tackleTitle} style="display:flex; gap:4px; padding:4px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; width:fit-content; flex-wrap:wrap;">
			{#each TABS as tab}
				<a href="?tab={tab}" data-sveltekit-reset="false" data-sveltekit-replacestate
					aria-current={activeTab === tab ? 'page' : undefined}
					style={tabStyle(activeTab === tab)}>{tabLabel[tab]}</a>
			{/each}
		</nav>
		{#if count[activeTab] > 0}
			<a href="/tackle/{activeTab}/new" class="of-touch of-tackle-add">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{addLabel[activeTab]}
			</a>
		{/if}
	</div>

	{#if count[activeTab] === 0}
		<div style="text-align:center; padding:80px 24px;">
			<p style="font-size:var(--of-fs-section); color:var(--of-text-2); margin:0 0 24px;">{emptyLabel[activeTab]}</p>
			<a href="/tackle/{activeTab}/new"
				style="display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:10px 22px; border-radius:9px; text-decoration:none;"
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{addLabel[activeTab]}
			</a>
		</div>
	{:else}
		<ul class="of-tackle-rows">
			{#if activeTab === 'rods'}
				{#each rods as r (r.id)}
					<li>
						<a href="/tackle/rods/{r.id}">
							<span class="name">{gearName(r)}</span>
							<span class="meta">
								{#if r.lengthM}<span>{r.lengthM} m</span>{/if}
								{#if r.castingWeight}<span>{r.castingWeight} g</span>{/if}
							</span>
							{#if r.type}<span class="tag">{r.type}</span>{/if}
						</a>
					</li>
				{/each}
			{:else if activeTab === 'reels'}
				{#each reels as r (r.id)}
					{@const line = reelCurrentLines[r.id]}
					<li>
						<a href="/tackle/reels/{r.id}">
							<span class="name">{gearName(r)}</span>
							<span class="meta">
								{#if line}<span>{line.lineName ?? '—'} · {formatDate(line.spooledAt)}</span>{/if}
							</span>
							{#if r.size}<span class="tag">{r.size}</span>{/if}
						</a>
					</li>
				{/each}
			{:else if activeTab === 'lines'}
				{#each lines as l (l.id)}
					<li>
						<a href="/tackle/lines/{l.id}">
							<span class="name">{gearName(l)}</span>
							<span class="meta">
								{#if l.diameterMm}<span>{l.diameterMm} mm</span>{/if}
								{#if l.strengthKg}<span>{l.strengthKg} kg</span>{/if}
							</span>
							{#if l.type}<span class="tag">{l.type}</span>{/if}
						</a>
					</li>
				{/each}
			{:else}
				{#each combos as c (c.id)}
					<li>
						<a href="/tackle/combos/{c.id}">
							<span class="name">{c.name}</span>
							<span class="meta">
								{#if c.rod}<span>{gearName(c.rod)}</span>{/if}
								{#if c.reel}<span>{gearName(c.reel)}</span>{/if}
							</span>
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>

<style>
	.of-tackle-head {
		display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
		margin-bottom: 20px;
	}
	/* Secondary, like the detail pages' Edit: the solid accent button stays reserved for empty states and forms. */
	.of-tackle-add {
		display: inline-flex; align-items: center; gap: 6px;
		background: var(--of-bg-elevated); color: var(--of-text-2); border: 1px solid var(--of-border);
		font-size: 0.875rem; font-weight: 500; padding: 8px 16px; border-radius: 9px;
		text-decoration: none; transition: var(--of-transition);
	}
	.of-tackle-add:hover { border-color: var(--of-accent-border); color: var(--of-accent); }

	/* Link rows in one panel, as on /spots. */
	.of-tackle-rows {
		list-style: none; margin: 0; padding: 8px 14px;
		background: var(--of-bg-surface); border: 1px solid var(--of-border-subtle); border-radius: 14px;
	}
	.of-tackle-rows li + li { border-top: 1px solid var(--of-border-subtle); }
	.of-tackle-rows a {
		display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 6px; margin: 0 -6px;
		border-radius: 8px; text-decoration: none; font-size: 0.875rem;
	}
	.of-tackle-rows a:hover { background: var(--of-accent-bg); }
	.of-tackle-rows a:focus-visible { outline: 2px solid var(--of-accent); outline-offset: -2px; }
	.of-tackle-rows .name {
		font-weight: 600; color: var(--of-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
		flex-shrink: 1; min-width: 0;
	}
	.of-tackle-rows .meta {
		flex: 1; min-width: 0; display: flex; gap: 12px; overflow: hidden;
		font-size: 0.75rem; color: var(--of-text-4); white-space: nowrap;
	}
	.of-tackle-rows .meta span { overflow: hidden; text-overflow: ellipsis; }
	.of-tackle-rows .tag {
		flex-shrink: 0; font-size: 0.75rem; font-weight: 600; color: var(--of-text-3); background: var(--of-border-subtle);
		border: 1px solid var(--of-border); padding: 2px 7px; border-radius: 20px; white-space: nowrap;
	}
	@media (max-width: 480px) {
		/* Name on its own line, specs beneath it. */
		.of-tackle-rows a { flex-wrap: wrap; row-gap: 2px; padding-block: 8px; }
		.of-tackle-rows .name { flex: 1 1 calc(100% - 96px); }
		.of-tackle-rows .meta { order: 3; flex-basis: 100%; }
	}
</style>
