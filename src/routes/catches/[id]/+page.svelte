<script lang="ts">
	import { setupMapGestures } from '#lib/mapGestures.js';
	import { addBaseTiles, addMapControls, STATIC_PIN } from '#lib/mapTiles.js';
	import { detailSrcset, DETAIL_SIZES, photoAlt } from '#lib/photo.js';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { lureLabel } from '#lib/catchForm.js';

	let { data }: { data: PageData } = $props();
	const { t, catch: c, nearbySpot, highlights, authEnabled } = $derived(data);

	// Set by the redirect after "Log Catch". Shown once: the query is dropped from
	// the URL on mount so a reload or a shared link doesn't repeat it.
	let saved = $state(page.url.searchParams.get('saved') === '1');
	onMount(() => {
		if (!saved) return;
		const url = new URL(page.url.href);
		url.searchParams.delete('saved');
		goto(url, { shallow: true, replace: true }).catch(() => {});
	});

	let shareUrl = $derived(data.shareUrl);
	let copied = $state(false);

	async function createShare() {
		const res = await fetch(`/api/catches/${c.id}/share`, { method: 'POST' });
		const json = await res.json();
		shareUrl = json.shareUrl;
	}

	async function revokeShare() {
		await fetch(`/api/catches/${c.id}/share`, { method: 'DELETE' });
		shareUrl = null;
	}

	function copyShare() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const photos = $derived(c.photos);
	const hasPhotos = $derived(photos.length > 0);
	// Back to the first photo whenever the photo set changes (e.g. navigating to another entry)
	let currentPhoto = $derived.by(() => { photos; return 0; });
	const hasLocation = $derived(c.lat !== null && c.lng !== null);

	let mapEl = $state<HTMLElement>(); // rendered inside an {#if}, so bound after mount
	let mapInstance: any = null;

	function prevPhoto() { currentPhoto = (currentPhoto - 1 + photos.length) % photos.length; }
	function nextPhoto() { currentPhoto = (currentPhoto + 1) % photos.length; }

	function formatDatetime(d: Date) {
		const date = new Date(d);
		return date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
			+ ' · '
			+ date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	function biteColor(score: number) {
		if (score >= 8.5) return 'var(--of-accent)';
		if (score >= 6.5) return 'var(--of-success)';
		if (score >= 4)   return 'var(--of-warning)';
		return 'var(--of-danger)';
	}

	function biteRating(score: number) {
		if (score >= 8.5) return t.biteRatingExcellent;
		if (score >= 6.5) return t.biteRatingGood;
		if (score >= 4)   return t.biteRatingFair;
		return t.biteRatingPoor;
	}

	onMount(async () => {
		if (!hasLocation || !mapEl) return;
		const L = (await import('leaflet')).default;

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl!, { zoomControl: false, scrollWheelZoom: false });

		setupMapGestures(mapInstance, mapEl!, t.mapTwoFingerHint);
		addBaseTiles(L, mapInstance, data.mapTiles);
		addMapControls(L, mapInstance, t);

		mapInstance.setView([c.lat!, c.lng!], 15);
		L.marker([c.lat!, c.lng!], { icon: pinIcon, ...STATIC_PIN }).addTo(mapInstance);
		requestAnimationFrame(() => mapInstance.invalidateSize());
	});

	onDestroy(() => { mapInstance?.remove(); });
</script>

<div class="of-catch" class:of-catch--split={hasPhotos || hasLocation}>
	<!-- Header: back + secondary Edit -->
	<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;">
		<a href="/catches" class="of-tap" style="color:var(--of-text-3); font-size:0.875rem; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{t.navCatches}
		</a>
		<a href="/catches/{c.id}/edit" class="of-touch"
			style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:8px 16px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
		>
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
			{t.edit}
		</a>
	</div>

	<!-- Post-save confirmation -->
	{#if saved}
		<div role="status" class="of-saved">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
			<span style="font-weight:600;">{t.catchLogged}</span>
			<a href="/catches/new" class="of-linkbtn" style="margin-left:auto; color:var(--of-accent); font-weight:600; text-decoration:none; white-space:nowrap;">+ {t.catchLogAnother}</a>
			<button type="button" onclick={() => (saved = false)} aria-label={t.close} class="of-tap"
				style="background:none; border:none; color:var(--of-text-3); cursor:pointer; padding:4px; display:flex;">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
			</button>
		</div>
	{/if}

	<div class="of-catch-grid" class:has-media={hasPhotos} class:has-map={hasLocation}>

	<!-- Photo slider: the fish leads -->
	{#if hasPhotos}
		<div class="of-catch-media" style="position:relative; border-radius:14px; overflow:hidden; background:var(--of-bg-overlay); aspect-ratio:4/3;">
			{#each photos as photo, i}
				<img
					src="/uploads/{photo.filename}"
					srcset={detailSrcset(photo.filename)}
					sizes={DETAIL_SIZES}
					alt={photoAlt(t, c.species, i, photos.length)}
					style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};"
				/>
			{/each}

			{#if photos.length > 1}
				<button onclick={prevPhoto} aria-label={t.previousItem}
					style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<button onclick={nextPhoto} aria-label={t.nextItem}
					style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px;">
					{#each photos as _, i}
						<button onclick={() => currentPhoto = i}
							style="width:{i === currentPhoto ? '18px' : '6px'}; height:6px; border-radius:var(--of-radius-full); background:{i === currentPhoto ? 'var(--of-accent)' : 'rgba(255,255,255,0.4)'}; border:none; cursor:pointer; transition:var(--of-transition); padding:0;"
							aria-label={t.photoN.replace("{n}", String(i + 1))}
						></button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Info card -->
	<div class="of-catch-info of-panel">

		<!-- Species + date -->
		<div>
			<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
				<h1 style="font-family:'DM Sans',sans-serif; font-weight:600; font-size:var(--of-fs-headline); line-height:1.2; color:var(--of-text-bright); margin:0;">{c.species ?? '—'}</h1>
				{#if c.catchAndRelease}
					<span style="font-size:0.75rem; font-weight:600; color:var(--of-accent); background:var(--of-accent-bg-hover); border:1px solid var(--of-accent-border); padding:3px 9px; border-radius:20px;">{t.catchAndReleaseShort}</span>
				{/if}
			</div>
			<p style="font-size:0.8125rem; color:var(--of-text-4); margin:4px 0 0;">{formatDatetime(c.caughtAt)}</p>
		</div>

		<!-- Measurements: the numbers anglers care about, large -->
		{#if c.lengthCm || c.weightG}
			<div style="display:flex; flex-wrap:wrap; gap:28px;">
				{#if c.lengthCm}
					<div>
						<div style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-figure); font-weight:600; line-height:1; color:var(--of-text-bright);">{c.lengthCm}</div>
						<div style="font-size:0.75rem; color:var(--of-text-3); margin-top:6px;">{t.catchLengthLabel}</div>
					</div>
				{/if}
				{#if c.weightG}
					<div>
						<div style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-figure); font-weight:600; line-height:1; color:var(--of-text-bright);">{c.weightG}</div>
						<div style="font-size:0.75rem; color:var(--of-text-3); margin-top:6px;">{t.catchWeightLabel}</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Highlights -->
		{#if highlights.personalBest || highlights.lureCatchNumber}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if highlights.personalBest && c.species}
					<span data-testid="catch-pb" style="display:inline-flex; align-items:center; gap:6px; font-size:0.8125rem; font-weight:600; color:var(--of-warning); background:var(--of-warning-bg); border:1px solid var(--of-warning-border); padding:5px 12px; border-radius:20px;">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>
						{(highlights.personalBest === 'length' ? t.catchPbLength : t.catchPbWeight).replace('{species}', c.species)}
					</span>
				{/if}
				{#if highlights.lureCatchNumber && c.lure}
					<span data-testid="catch-lure-n" style="display:inline-flex; align-items:center; font-size:0.8125rem; font-weight:500; color:var(--of-text-2); background:var(--of-bg-elevated); border:1px solid var(--of-border); padding:5px 12px; border-radius:20px;">
						{highlights.lureCatchNumber === 1 ? t.catchFirstOnLure : t.catchNthOnLure.replace('{n}', String(highlights.lureCatchNumber))}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Coordinates + directions -->
		{#if hasLocation}
			<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-4); margin:0;">{c.lat!.toFixed(6)}, {c.lng!.toFixed(6)}</p>
				<a href="https://www.google.com/maps/dir/?api=1&destination={c.lat},{c.lng}" target="_blank" rel="noopener noreferrer"
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; white-space:nowrap; transition:var(--of-transition); font-family:'DM Sans',sans-serif; flex-shrink:0;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
						<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/>
						<circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
					</svg>
					{t.spotGetDirections}
				</a>
			</div>
		{/if}

		<!-- Combo -->
		{#if c.combo}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.catchComboLabel}</p>
				<a href="/tackle/combos/{c.combo.id}"
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 21L20 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="7.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="1.4"/></svg>
					{c.combo.name}
				</a>
			</div>
		{/if}

		<!-- Lure + Spot cross-references -->
		{#if c.lure || nearbySpot}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if c.lure}
					<div>
						<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.catchLureLabel}</p>
						<a href="/lures/{c.lure.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{lureLabel(c.lure)}
						</a>
					</div>
				{/if}
				{#if nearbySpot}
					<div>
						<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.catchSpotLabel}</p>
						<a href="/spots/{nearbySpot.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
							{nearbySpot.name}
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Bite index at time of catch -->
		{#if c.biteIndex != null}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.biteIndex}</p>
				<div style="display:flex; align-items:center; gap:14px;">
					<div style="flex:1;">
						<div style="background:var(--of-border-subtle); border-radius:4px; height:5px; margin-bottom:6px;">
							<div style="background:{biteColor(c.biteIndex)}; border-radius:4px; height:5px; width:{c.biteIndex * 10}%;"></div>
						</div>
						<span style="font-size:0.8125rem; font-weight:600; color:{biteColor(c.biteIndex)};">{biteRating(c.biteIndex)}</span>
					</div>
					<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-figure-sm); font-weight:600; color:{biteColor(c.biteIndex)}; line-height:1; flex-shrink:0;">{c.biteIndex}</span>
				</div>
			</div>
		{/if}

		<!-- Retrieve style -->
		{#if c.presentation}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.presentation}</p>
				<span style="display:inline-block; padding:5px 14px; background:var(--of-accent-bg); border:1px solid var(--of-accent-border); border-radius:20px; font-size:0.875rem; color:var(--of-accent); font-weight:500;">{c.presentation}</span>
			</div>
		{/if}

		<!-- Notes -->
		{#if c.notes}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.notes}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{c.notes}</p>
			</div>
		{/if}

		<!-- Share link management -->
		{#if authEnabled}
			<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:16px;">
				<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 10px; display:flex; align-items:center; gap:6px;">
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					{t.shareLink}
				</p>
				{#if shareUrl}
					<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
						<input type="text" value={shareUrl} readonly
							style="flex:1; min-width:0; background:var(--of-bg-base); border:1px solid var(--of-border-subtle); border-radius:8px; color:var(--of-text-2); font-family:'JetBrains Mono',monospace; font-size:0.75rem; padding:7px 10px; outline:none;" />
						<button onclick={copyShare}
							style="background:{copied ? 'var(--of-success-bg)' : 'var(--of-bg-elevated)'}; color:{copied ? 'var(--of-success)' : 'var(--of-text-2)'}; border:1px solid {copied ? 'var(--of-success-border)' : 'var(--of-border)'}; font-size:0.8125rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; transition:var(--of-transition); font-family:'DM Sans',sans-serif;">
							{copied ? t.shareCopied : t.shareCopy}
						</button>
						<button onclick={revokeShare}
							style="background:var(--of-bg-elevated); color:var(--of-danger); border:1px solid var(--of-danger-bg); font-size:0.8125rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-bg)';}}>
							{t.shareRevoke}
						</button>
					</div>
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0;">{t.sharePublicNote}</p>
				{:else}
					<button onclick={createShare}
						style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); cursor:pointer; font-family:'DM Sans',sans-serif; transition:var(--of-transition);"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
						{t.shareGenerate}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Map -->
	{#if hasLocation}
		<div class="of-catch-map" style="border-radius:14px; overflow:hidden; border:1px solid var(--of-border-subtle);">
			<div bind:this={mapEl} style="height:300px;"></div>
		</div>
	{/if}

	</div>
</div>

<style>
	.of-catch { max-width: 580px; }
	.of-catch-grid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
	.of-catch-info { background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px; }
	.of-saved {
		display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
		margin-bottom: 16px; padding: 10px 12px 10px 14px; border-radius: 12px;
		background: var(--of-success-bg); border: 1px solid var(--of-success-border);
		color: var(--of-success); font-size: 0.875rem;
	}
	/* Desktop: media (photo, then map) on the left, the facts on the right.
	   Areas follow what the catch actually has so no empty cell is left behind. */
	@media (min-width: 960px) {
		.of-catch--split { max-width: 1040px; }
		.of-catch--split .of-catch-grid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
		/* Beside the photo the facts are the caption, not a second card: one framed object
		   (the photo) next to plain text, so unequal column heights don't read as a misfit.
		   0,2,0 + !important beats the phone .of-panel padding on touch screens >= 960px. */
		.of-catch--split .of-catch-info.of-panel { background: none; border: none; border-radius: 0; padding: 4px 0 0 8px !important; }
		.of-catch-grid.has-media.has-map { grid-template-areas: "media info" "map info"; grid-template-rows: auto 1fr; }
		.of-catch-grid.has-media:not(.has-map) { grid-template-areas: "media info"; }
		.of-catch-grid.has-map:not(.has-media) { grid-template-areas: "map info"; }
		.of-catch-media { grid-area: media; }
		.of-catch-info { grid-area: info; }
		.of-catch-map { grid-area: map; }
	}
</style>
