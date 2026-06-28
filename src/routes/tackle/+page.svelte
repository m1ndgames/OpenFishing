<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t, rods, reels, lines, combos, reelCurrentLines } = data;

	let activeTab = $state<'rods' | 'reels' | 'lines' | 'combos'>('rods');

	const cardStyle = "background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; text-decoration:none; transition:border-color 0.15s;";

	function lineTypeBadgeColor(type: string | null) {
		if (type === 'Braid') return 'var(--of-accent)';
		if (type === 'Fluoro') return '#a78bfa';
		return '#6ee7b7';
	}

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<div style="max-width:800px; margin:0 auto;">
	<!-- Tab bar -->
	<div style="display:flex; gap:4px; background:var(--of-bg-base); border:1px solid var(--of-border-subtle); border-radius:12px; padding:4px; margin-bottom:20px; overflow-x:auto;">
		{#each [['rods', t.tackleRods], ['reels', t.tackleReels], ['lines', t.tackleLines], ['combos', t.tackleCombos]] as [tab, label]}
			<button
				onclick={() => activeTab = tab as any}
				style="flex:1; min-width:70px; padding:7px 12px; border-radius:8px; border:none; cursor:pointer; font-size:0.8rem; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap;
					background:{activeTab === tab ? 'var(--of-bg-elevated)' : 'transparent'};
					color:{activeTab === tab ? 'var(--of-accent)' : 'var(--of-text-4)'};
					border:{activeTab === tab ? '1px solid var(--of-accent-bg-hover)' : '1px solid transparent'};"
			>{label}</button>
		{/each}
	</div>

	<!-- Rods -->
	{#if activeTab === 'rods'}
		<div style="display:flex; justify-content:flex-end; margin-bottom:14px;">
			<a href="/tackle/rods/new"
				style="display:inline-flex; align-items:center; gap:6px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:8px 16px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.rodAddTitle}
			</a>
		</div>
		{#if rods.length === 0}
			<p style="color:var(--of-text-4); font-size:0.875rem; text-align:center; padding:40px 0;">{t.tackleNoRods}</p>
		{:else}
			<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
				{#each rods as r}
					<a href="/tackle/rods/{r.id}"
						style={cardStyle}
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border-subtle)';}}
					>
						<div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
							<span style="font-size:0.875rem; font-weight:600; color:var(--of-text);">{r.brand ? `${r.brand} ${r.model}` : r.model}</span>
							{#if r.type}
								<span style="font-size:0.68rem; font-weight:600; color:var(--of-accent-solid); background:var(--of-accent-glow); border:1px solid var(--of-accent-bg-hover); padding:2px 8px; border-radius:20px; flex-shrink:0;">{r.type}</span>
							{/if}
						</div>
						<div style="display:flex; gap:12px; flex-wrap:wrap;">
							{#if r.lengthM}
								<span style="font-size:0.75rem; color:var(--of-text-3);">{r.lengthM}m</span>
							{/if}
							{#if r.castingWeight}
								<span style="font-size:0.75rem; color:var(--of-text-3);">{r.castingWeight}g</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Reels -->
	{#if activeTab === 'reels'}
		<div style="display:flex; justify-content:flex-end; margin-bottom:14px;">
			<a href="/tackle/reels/new"
				style="display:inline-flex; align-items:center; gap:6px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:8px 16px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.reelAddTitle}
			</a>
		</div>
		{#if reels.length === 0}
			<p style="color:var(--of-text-4); font-size:0.875rem; text-align:center; padding:40px 0;">{t.tackleNoReels}</p>
		{:else}
			<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
				{#each reels as r}
					<a href="/tackle/reels/{r.id}"
						style={cardStyle}
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border-subtle)';}}
					>
						<div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
							<span style="font-size:0.875rem; font-weight:600; color:var(--of-text);">{r.brand ? `${r.brand} ${r.model}` : r.model}</span>
							{#if r.size}
								<span style="font-size:0.68rem; color:var(--of-text-3); flex-shrink:0;">#{r.size}</span>
							{/if}
						</div>
						{#if reelCurrentLines[r.id]}
							<div style="display:flex; align-items:center; gap:6px;">
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="var(--of-accent)" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="var(--of-accent)" stroke-width="1.4"/></svg>
								<span style="font-size:0.72rem; color:var(--of-accent);">{reelCurrentLines[r.id].lineName ?? '—'}</span>
								<span style="font-size:0.68rem; color:var(--of-text-4);">· {formatDate(reelCurrentLines[r.id].spooledAt)}</span>
							</div>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Lines -->
	{#if activeTab === 'lines'}
		<div style="display:flex; justify-content:flex-end; margin-bottom:14px;">
			<a href="/tackle/lines/new"
				style="display:inline-flex; align-items:center; gap:6px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:8px 16px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.lineAddTitle}
			</a>
		</div>
		{#if lines.length === 0}
			<p style="color:var(--of-text-4); font-size:0.875rem; text-align:center; padding:40px 0;">{t.tackleNoLines}</p>
		{:else}
			<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">
				{#each lines as l}
					<a href="/tackle/lines/{l.id}"
						style={cardStyle}
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border-subtle)';}}
					>
						<div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
							<span style="font-size:0.875rem; font-weight:600; color:var(--of-text);">{l.brand ? `${l.brand} ${l.model}` : l.model}</span>
							{#if l.type}
								<span style="font-size:0.68rem; font-weight:600; color:{lineTypeBadgeColor(l.type)}; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); padding:2px 8px; border-radius:20px; flex-shrink:0;">{l.type}</span>
							{/if}
						</div>
						<div style="display:flex; gap:12px; flex-wrap:wrap;">
							{#if l.diameterMm}
								<span style="font-size:0.75rem; color:var(--of-text-3);">{l.diameterMm}mm</span>
							{/if}
							{#if l.strengthKg}
								<span style="font-size:0.75rem; color:var(--of-text-3);">{l.strengthKg}kg</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Combos -->
	{#if activeTab === 'combos'}
		<div style="display:flex; justify-content:flex-end; margin-bottom:14px;">
			<a href="/tackle/combos/new"
				style="display:inline-flex; align-items:center; gap:6px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:8px 16px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.comboAddTitle}
			</a>
		</div>
		{#if combos.length === 0}
			<p style="color:var(--of-text-4); font-size:0.875rem; text-align:center; padding:40px 0;">{t.tackleNoCombos}</p>
		{:else}
			<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px;">
				{#each combos as c}
					<a href="/tackle/combos/{c.id}"
						style={cardStyle}
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border-subtle)';}}
					>
						<span style="font-size:0.9rem; font-weight:600; color:var(--of-text-bright);">{c.name}</span>
						{#if c.rod}
							<div style="display:flex; align-items:center; gap:6px;">
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 21L20 5" stroke="var(--of-text-3)" stroke-width="1.6" stroke-linecap="round"/></svg>
								<span style="font-size:0.75rem; color:var(--of-text-3);">{c.rod.brand ? `${c.rod.brand} ${c.rod.model}` : c.rod.model}</span>
							</div>
						{/if}
						{#if c.reel}
							<div style="display:flex; align-items:center; gap:6px;">
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="var(--of-text-3)" stroke-width="1.4"/><circle cx="12" cy="12" r="2.5" stroke="var(--of-text-3)" stroke-width="1.2"/></svg>
								<span style="font-size:0.75rem; color:var(--of-text-3);">{c.reel.brand ? `${c.reel.brand} ${c.reel.model}` : c.reel.model}</span>
							</div>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
