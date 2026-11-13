<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { t, totals, speciesStats, lureStats, spotStats, months, hourly, weekdays, presentationStats } = $derived(data);

	// Locale-aware weekday labels (Mon–Sun)
	const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(2024, 0, 1 + i); // Jan 1 2024 = Monday
		return d.toLocaleDateString(undefined, { weekday: 'short' });
	});

	function monthLabel(year: number, month: number) {
		return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
	}

	// Bars are tonal; only a chart's single leader carries the accent, so the eye
	// lands on the answer ("most catches in May"). Ties have no leader.
	function leaderOf(values: number[]) {
		const max = Math.max(0, ...values);
		return max > 0 && values.filter(v => v === max).length === 1 ? max : Infinity;
	}
	function barColor(value: number, leader: number) {
		return value === leader ? 'var(--of-accent-solid)' : 'var(--of-border-strong)';
	}
	function bar(value: number, max: number, leader: number) {
		const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
		return `background:${barColor(value, leader)}; border-radius:var(--of-radius-full); height:100%; width:${pct}%; transition:width 0.3s;`;
	}

	// Below this, month/weekday/hour charts are mostly empty bars: say so instead.
	const PATTERN_MIN = 5;
	const sparse = $derived(totals.totalCatches < PATTERN_MIN);

	const maxMonth   = $derived(Math.max(...months.map(m => m.count), 1));
	const maxHour    = $derived(Math.max(...hourly.map(h => h.count), 1));
	const maxWeekday = $derived(Math.max(...weekdays.map(d => d.count), 1));
	const maxLure         = $derived(lureStats[0]?.count ?? 1);
	const maxSpot         = $derived(spotStats[0]?.count ?? 1);
	const maxPresentation = $derived(presentationStats[0]?.count ?? 1);
	const leadMonth   = $derived(leaderOf(months.map(m => m.count)));
	const leadHour    = $derived(leaderOf(hourly.map(h => h.count)));
	const leadWeekday = $derived(leaderOf(weekdays.map(d => d.count)));
	const leadLure    = $derived(leaderOf(lureStats.map(l => l.count)));
	const leadSpot    = $derived(leaderOf(spotStats.map(x => x.count)));
	const leadPres    = $derived(leaderOf(presentationStats.map(p => p.count)));

	const card = 'background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px;';
	const label = 'font-size:0.75rem; font-weight:500; color:var(--of-text-4); ';
</script>

<div>
	<h1 class="sr-only">{t.statsTitle}</h1>
{#if totals.totalCatches === 0}
		<div style="text-align:center; padding:60px 24px; {card}">
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.statsNoData}</p>
		</div>
	{:else}

	<!-- ── Trophy bar ─────────────────────────────────────────────────────── -->
	<div class="of-grid-4" style="gap:10px; margin-bottom:16px;">
		{#each [
			{ value: totals.totalCatches, label: t.statsTotalCatches },
			{ value: totals.distinctSpecies, label: t.statsSpeciesCount },
			{ value: totals.totalSpots, label: t.statsSpotsCount },
			{ value: `${totals.cnrRate}%`, label: t.statsCnRRate },
		] as tile}
			<div style="{card} text-align:center; padding:16px 10px;">
				<p style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-figure-sm); font-weight:600; color:var(--of-text-bright); margin:0 0 4px; line-height:1;">{tile.value}</p>
				<p style="{label} margin:0;">{tile.label}</p>
			</div>
		{/each}
	</div>

	<!-- ── Personal Bests ────────────────────────────────────────────────── -->
	{#if speciesStats.length > 0}
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 14px;">{t.statsPersonalBests}</p>
		<div style="overflow-x:auto;">
			<table style="width:100%; border-collapse:collapse; font-size:0.8125rem;">
				<thead>
					<tr style="border-bottom:1px solid var(--of-border-subtle);">
						<th style="text-align:left; {label} padding:0 12px 8px 0;">{t.catchSpeciesLabel}</th>
						<th style="text-align:right; {label} padding:0 12px 8px 0;">#</th>
						<th style="text-align:right; {label} padding:0 12px 8px 0;">{t.catchLengthLabel}</th>
						<th style="text-align:right; {label} padding:0 12px 8px 0;">{t.catchWeightLabel}</th>
						<th style="text-align:right; {label} padding:0 0 8px 0;">{t.catchAndReleaseShort}</th>
					</tr>
				</thead>
				<tbody>
					{#each speciesStats as s}
						<tr style="border-bottom:1px solid var(--of-bg-elevated);">
							<td style="padding:8px 12px 8px 0; font-weight:600; color:var(--of-text); white-space:nowrap;">{s.species}</td>
							<td style="padding:8px 12px 8px 0; text-align:right; font-family:'JetBrains Mono',monospace; color:var(--of-text-3);">{s.count}</td>
							<td style="padding:8px 12px 8px 0; text-align:right; white-space:nowrap; color:var(--of-text-4);">
								{#if s.maxLength != null && s.maxLengthId}
									<a href="/catches/{s.maxLengthId}" class="of-stat-link of-stat-hit">{s.maxLength}<small>&nbsp;cm</small></a>
								{:else}—{/if}
							</td>
							<td style="padding:8px 12px 8px 0; text-align:right; white-space:nowrap; color:var(--of-text-4);">
								{#if s.maxWeight != null && s.maxWeightId}
									<a href="/catches/{s.maxWeightId}" class="of-stat-link of-stat-hit">{s.maxWeight}<small>&nbsp;g</small></a>
								{:else}—{/if}
							</td>
							<td style="padding:8px 0 8px 0; text-align:right; color:var(--of-text-4); font-size:0.75rem;">
								{s.cnr > 0 ? s.cnr : '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	{/if}

	<!-- ── Top Lures ──────────────────────────────────────────────────────── -->
	{#if lureStats.length > 0}
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsTopLures}</p>
		<div style="display:flex; flex-direction:column; gap:10px;">
			{#each lureStats as l}
				{@const lureName = l.lureNumber ? `#${String(l.lureNumber).padStart(4,'0')} ${l.name}` : l.name}
				<div>
					<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:5px; gap:8px;">
						<span style="font-size:0.8125rem; font-weight:600; color:var(--of-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{lureName}</span>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-3); flex-shrink:0;">{l.count} {l.cnr > 0 ? `· ${l.cnr} C&R` : ''}</span>
					</div>
					<div style="background:var(--of-bg-overlay); border-radius:var(--of-radius-full); height:7px;">
						<div style={bar(l.count, maxLure, leadLure)}></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
	{/if}

	<!-- ── Top Retrieve Styles ──────────────────────────────────────────────── -->
	{#if presentationStats.length > 0}
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsTopPresentations}</p>
		<div style="display:flex; flex-direction:column; gap:8px;">
			{#each presentationStats as p}
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="font-size:0.8125rem; color:var(--of-text); width:130px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{p.style}</span>
					<div style="flex:1; background:var(--of-bg-overlay); border-radius:var(--of-radius-full); height:14px;">
						<div style={bar(p.count, maxPresentation, leadPres)}></div>
					</div>
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-3); width:20px; text-align:right; flex-shrink:0;">{p.count}</span>
				</div>
			{/each}
		</div>
	</div>
	{/if}

	{#if sparse}
	<div style="{card} margin-bottom:16px; display:flex; gap:12px; align-items:flex-start;">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color:var(--of-text-4); flex-shrink:0; margin-top:1px;" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
		<p style="font-size:0.875rem; color:var(--of-text-3); margin:0; line-height:1.5;">{t.statsSparse.replace('{n}', String(PATTERN_MIN))}</p>
	</div>
	{:else}
	<!-- ── Monthly Activity ───────────────────────────────────────────────── -->
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsMonthly}</p>
		<div style="display:flex; flex-direction:column; gap:6px;">
			{#each months as m}
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-4); width:56px; flex-shrink:0; text-align:right; white-space:nowrap;">{monthLabel(m.year, m.month)}</span>
					<div style="flex:1; background:var(--of-bg-overlay); border-radius:var(--of-radius-full); height:16px;">
						<div style={bar(m.count, maxMonth, leadMonth)}></div>
					</div>
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:{m.count > 0 ? 'var(--of-text-3)' : 'var(--of-border-subtle)'}; width:20px; text-align:right; flex-shrink:0;">{m.count > 0 ? m.count : ''}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- ── Time of Day ───────────────────────────────────────────────────── -->
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsTimeOfDay}</p>
		<div style="display:flex; align-items:flex-end; gap:3px; height:60px;">
			{#each hourly as h}
				<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; height:100%;">
					<div style="flex:1; width:100%; background:var(--of-bg-overlay); border-radius:4px 4px 0 0; position:relative; overflow:hidden;">
						<div style="position:absolute; bottom:0; left:0; right:0; background:{barColor(h.count, leadHour)}; transition:height 0.3s; border-radius:4px 4px 0 0; height:{maxHour > 0 ? Math.max((h.count/maxHour)*100, h.count>0?8:0) : 0}%;"></div>
					</div>
				</div>
			{/each}
		</div>
		<!-- Hour labels: every 3 hours -->
		<div style="display:flex; margin-top:4px;">
			{#each hourly as h}
				<div style="flex:1; text-align:center;">
					{#if h.hour % 3 === 0}
						<span style="font-size:0.75rem; color:var(--of-text-4); font-family:'JetBrains Mono',monospace;">{h.hour}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- ── Day of Week ───────────────────────────────────────────────────── -->
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsWeekday}</p>
		<div style="display:flex; flex-direction:column; gap:6px;">
			{#each weekdays as d, i}
				<div style="display:flex; align-items:center; gap:10px;">
					<span style="font-size:0.75rem; color:var(--of-text-4); width:30px; flex-shrink:0;">{weekdayLabels[i]}</span>
					<div style="flex:1; background:var(--of-bg-overlay); border-radius:var(--of-radius-full); height:16px;">
						<div style={bar(d.count, maxWeekday, leadWeekday)}></div>
					</div>
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:{d.count > 0 ? 'var(--of-text-3)' : 'var(--of-border-subtle)'}; width:20px; text-align:right; flex-shrink:0;">{d.count > 0 ? d.count : ''}</span>
				</div>
			{/each}
		</div>
	</div>

	{/if}

	<!-- ── Top Spots ──────────────────────────────────────────────────────── -->
	{#if spotStats.length > 0}
	<div style="{card} margin-bottom:16px;">
		<p style="{label} margin:0 0 16px;">{t.statsTopSpots}</p>
		<div style="display:flex; flex-direction:column; gap:10px;">
			{#each spotStats as s, i}
				<div>
					<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:5px; gap:8px;">
						<div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
							<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-4); flex-shrink:0;">{i + 1}</span>
							<a href="/spots/{s.id}" class="of-stat-hit" style="font-size:0.8125rem; font-weight:600; color:var(--of-text); text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
								onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
								onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
							>{s.name}</a>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-3); flex-shrink:0;">{s.count} {t.statsCatches}</span>
					</div>
					<div style="background:var(--of-bg-overlay); border-radius:var(--of-radius-full); height:7px;">
						<div style={bar(s.count, maxSpot, leadSpot)}></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
	{/if}

	{/if}
</div>

<style>
	.of-stat-link {
		font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--of-text-bright);
		text-decoration: underline; text-decoration-color: var(--of-border-strong); text-underline-offset: 3px;
	}
	.of-stat-link:hover { color: var(--of-accent); text-decoration-color: currentColor; }
	.of-stat-link small { font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 400; color: var(--of-text-4); }
	/* Taller tap area for the record links without moving the layout (WCAG 2.5.8). */
	.of-stat-hit { display: inline-block; padding-block: 8px; margin-block: -8px; }
</style>
