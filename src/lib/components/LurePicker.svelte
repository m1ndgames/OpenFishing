<script lang="ts">
	import { lureLabel, lurePlate, type PickerLure } from '#lib/catchForm.js';
	import { photoUrl, THUMB_SMALL } from '#lib/photo.js';
	import type { Translations } from '#lib/i18n/index.js';

	// One-tap tiles for the angler's recent and favourite lures, plus the full list as a
	// select. Both drive the same value, which is submitted as `lure_id`.
	let {
		lures,
		quickLureIds,
		value = $bindable(''),
		t
	}: { lures: PickerLure[]; quickLureIds: string[]; value?: string; t: Translations } = $props();

	const quick = $derived(
		quickLureIds.map((id) => lures.find((l) => l.id === id)).filter((l): l is PickerLure => !!l)
	);

	const selectStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; cursor:pointer;";
</script>

<div>
	<label for="lure_id" style="display:block; font-size:0.8125rem; font-weight:500; color:var(--of-text-2); margin-bottom:6px;">{t.catchLureLabel}</label>

	{#if quick.length > 0}
		<div role="group" aria-label={t.lurePickerQuick} class="of-lure-tiles">
			{#each quick as l (l.id)}
				{@const on = value === l.id}
				<button type="button" class="of-lure-tile" class:of-lure-tile--on={on} aria-pressed={on}
					onclick={() => (value = on ? '' : l.id)}>
					<span class="of-lure-tile__thumb" aria-hidden="true">
						{#if l.photoPath}
							<img src={photoUrl(l.photoPath, THUMB_SMALL)} alt="" loading="lazy" decoding="async" />
						{:else}
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12c3-5 9-7 14-4l2-2v6l-2-1c-2 4-7 6-11 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
						{/if}
					</span>
					<span class="of-lure-tile__text">
						{#if l.lureNumber}<span class="of-lure-tile__plate">{lurePlate(l.lureNumber)}</span>{/if}
						<span class="of-lure-tile__name">{l.name}</span>
					</span>
				</button>
			{/each}
		</div>
	{/if}

	<select id="lure_id" name="lure_id" bind:value style={selectStyle}>
		<option value="">— {quick.length > 0 ? t.lurePickerAll : t.catchNoLure} —</option>
		{#each lures as l (l.id)}
			<option value={l.id}>{lureLabel(l)}{l.lost ? ` (${t.lostStatus})` : ''}</option>
		{/each}
	</select>
</div>

<style>
	.of-lure-tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
		margin-bottom: 8px;
	}
	.of-lure-tile {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 52px;
		padding: 6px 10px 6px 6px;
		background: var(--of-bg-elevated);
		border: 1px solid var(--of-border);
		border-radius: 9px;
		color: var(--of-text-2);
		text-align: left;
		cursor: pointer;
		font-family: 'DM Sans', sans-serif;
		transition: background var(--of-dur-fast, 150ms) var(--of-ease, ease), border-color var(--of-dur-fast, 150ms) var(--of-ease, ease);
		min-width: 0;
	}
	.of-lure-tile:hover { background: var(--of-bg-hover); }
	.of-lure-tile--on {
		background: var(--of-accent-bg-hover);
		border-color: var(--of-accent-border);
		color: var(--of-text-bright);
	}
	.of-lure-tile__thumb {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--of-bg-overlay);
		color: var(--of-text-4);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.of-lure-tile__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.of-lure-tile__text { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
	.of-lure-tile__plate {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--of-accent);
	}
	.of-lure-tile__name {
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
