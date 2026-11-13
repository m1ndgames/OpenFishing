<script lang="ts">
	import { setupMapGestures } from '#lib/mapGestures.js';
	import { addBaseTiles, addMapControls, STATIC_PIN } from '#lib/mapTiles.js';
	import { photoUrl, THUMB_SMALL, detailSrcset, DETAIL_SIZES, photoAlt } from '#lib/photo.js';
	import { modal } from '#lib/modal.js';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';
	import { moonLitPath } from '#lib/moonPhase.js';

	let { data }: { data: PageData } = $props();
	const { t, spot, nearbyCatches, weather, authEnabled } = $derived(data);

	let shareUrl = $derived(data.shareUrl);
	let copied = $state(false);

	async function createShare() {
		const res = await fetch(`/api/spots/${spot.id}/share`, { method: 'POST' });
		const json = await res.json();
		shareUrl = json.shareUrl;
	}

	async function revokeShare() {
		await fetch(`/api/spots/${spot.id}/share`, { method: 'DELETE' });
		shareUrl = null;
	}

	function copyShare() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const moonPhaseLabels = $derived([t.moonNew, t.moonWaxCrescent, t.moonFirstQ, t.moonWaxGibbous, t.moonFull, t.moonWanGibbous, t.moonLastQ, t.moonWanCrescent]);

	let showBiteInfo = $state(false);

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

	let mapEl: HTMLElement;
	let mapInstance: any = null;

	const photos = $derived(spot.photos);
	const hasPhotos = $derived(photos.length > 0);
	// Back to the first photo whenever the photo set changes (e.g. navigating to another entry)
	let currentPhoto = $derived.by(() => { photos; return 0; });

	function prevPhoto() { currentPhoto = (currentPhoto - 1 + photos.length) % photos.length; }
	function nextPhoto() { currentPhoto = (currentPhoto + 1) % photos.length; }

	onMount(async () => {
		const L = (await import('leaflet')).default;

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl, { zoomControl: false, scrollWheelZoom: false });

		setupMapGestures(mapInstance, mapEl, t.mapTwoFingerHint);

		addBaseTiles(L, mapInstance, data.mapTiles);
		addMapControls(L, mapInstance, t);

		mapInstance.setView([spot.lat, spot.lng], 15);
		L.marker([spot.lat, spot.lng], { icon: pinIcon, ...STATIC_PIN }).addTo(mapInstance);
		requestAnimationFrame(() => mapInstance.invalidateSize());
	});

	onDestroy(() => { mapInstance?.remove(); });

	function formatCoord(n: number) { return n.toFixed(6); }

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function lureName(l: { lureNumber: number | null; name: string }) {
		return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
	}
</script>

<div class="of-spot">
	<!-- Header: back + secondary Edit -->
	<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;">
		<a href="/spots" class="of-tap" style="color:var(--of-text-3); font-size:0.875rem; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{t.navSpots}
		</a>
		<a href="/spots/{spot.id}/edit" class="of-touch"
			style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:8px 16px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
		>
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
			{t.edit}
		</a>
	</div>

	<div class="of-spot-grid">
	<div class="of-spot-col">
	<!-- Map -->
	<div class="of-spot-map" style="border-radius:14px; overflow:hidden; border:1px solid var(--of-border-subtle);">
		<div bind:this={mapEl} style="height:300px;"></div>
	</div>

	<!-- Photo slider -->
	{#if hasPhotos}
		<div style="position:relative; border-radius:14px; overflow:hidden; background:var(--of-bg-overlay); aspect-ratio:16/9;" class="of-spot-photos">
			{#each photos as photo, i}
				<img
					src="/uploads/{photo.filename}"
					srcset={detailSrcset(photo.filename)}
					sizes={DETAIL_SIZES}
					alt={photoAlt(t, spot.name, i, photos.length)}
					style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};"
				/>
			{/each}

			{#if photos.length > 1}
				<button onclick={prevPhoto} aria-label={t.previousItem}
					style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:var(--of-text-bright); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<button onclick={nextPhoto} aria-label={t.nextItem}
					style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:var(--of-text-bright); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>

				<!-- Dots -->
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

	</div>
	<div class="of-spot-col">
	<!-- Info card -->
	<div class="of-spot-info of-panel">

		<!-- Name + coordinates + directions -->
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'DM Sans',sans-serif; font-weight:600; font-size:var(--of-fs-headline); line-height:1.2; color:var(--of-text-bright); margin:0 0 4px;">{spot.name}</h1>
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-4); margin:0;">{formatCoord(spot.lat)}, {formatCoord(spot.lng)}</p>
			</div>
			<a href="https://www.google.com/maps/dir/?api=1&destination={spot.lat},{spot.lng}" target="_blank" rel="noopener noreferrer"
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

		{#if spot.tags.length > 0}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.spotTagsLabel}</p>
				<div style="display:flex; flex-wrap:wrap; gap:6px;">
					{#each spot.tags as tag}
						<span style="font-size:0.8125rem; font-weight:600; color:var(--of-text-3); background:var(--of-border-subtle); border:1px solid var(--of-border); padding:3px 10px; border-radius:20px;">{tag.name}</span>
					{/each}
				</div>
			</div>
		{/if}

		{#if spot.notes}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.spotNotesLabel}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{spot.notes}</p>
			</div>
		{/if}

	</div>

	<!-- Weather card -->
	{#if weather}
		<section class="of-spot-cond of-panel" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:16px 20px;">
			<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-3); margin:0 0 12px;">{t.weatherTitle}</p>

			<!-- Bite index banner -->
			<div style="padding:0 0 16px; margin-bottom:16px; border-bottom:1px solid var(--of-border-subtle); display:flex; align-items:center; gap:16px;">
				<div style="flex:1; min-width:0;">
					<button
						onclick={() => showBiteInfo = true}
						class="of-tap"
						style="display:inline-flex; align-items:center; gap:5px; background:none; border:none; padding:0; cursor:pointer; margin:0 0 8px;"
					>
						<span style="font-size:0.75rem; font-weight:600; color:var(--of-text-3); ">{t.biteIndex}</span>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="color:var(--of-border-strong); flex-shrink:0;">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
							<path d="M12 11v5M12 8v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						</svg>
					</button>
					<div style="background:var(--of-border-subtle); border-radius:4px; height:5px; margin-bottom:6px;">
						<div style="background:{biteColor(weather.biteIndex)}; border-radius:4px; height:5px; width:{weather.biteIndex * 10}%; transition:width 0.4s;"></div>
					</div>
					<span style="font-size:0.8125rem; font-weight:600; white-space:nowrap; color:{biteColor(weather.biteIndex)};">{biteRating(weather.biteIndex)}</span>
				</div>
				<div style="text-align:right; flex-shrink:0;">
					<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-figure); font-weight:600; color:{biteColor(weather.biteIndex)}; line-height:1;">{weather.biteIndex}</span>
					<span style="font-size:0.8125rem; color:var(--of-text-4);">/10</span>
				</div>
			</div>

			<div class="of-grid-4 of-cond">

				<!-- Temperature -->
				<div class="of-cond-cell">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:var(--of-accent); flex-shrink:0;">
						<path d="M12 3a2 2 0 0 0-2 2v8.27A4 4 0 1 0 14 17V5a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<circle cx="12" cy="17" r="2" fill="currentColor" opacity="0.4"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:600; color:var(--of-text-bright); line-height:1;">{weather.temperature != null ? `${weather.temperature}°` : '—'}</span>
					<span style="font-size:0.75rem; color:var(--of-text-3); font-weight:500; ">{t.weatherTemp}</span>
				</div>

				<!-- Humidity -->
				<div class="of-cond-cell">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:var(--of-accent); flex-shrink:0;">
						<path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:600; color:var(--of-text-bright); line-height:1;">{weather.humidity != null ? `${weather.humidity}%` : '—'}</span>
					<span style="font-size:0.75rem; color:var(--of-text-3); font-weight:500; ">{t.weatherHumidity}</span>
				</div>

				<!-- Pressure -->
				<div class="of-cond-cell">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:var(--of-accent); flex-shrink:0;">
						<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
						<path d="M12 12L8.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						<circle cx="12" cy="12" r="1.5" fill="currentColor"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.85rem; font-weight:600; color:var(--of-text-bright); line-height:1;">{weather.pressure != null ? `${weather.pressure}` : '—'}<span style="font-size:0.75rem; color:var(--of-text-3); margin-left:3px;">hPa</span></span>
				<span style="font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; color:{weather.pressureDelta < -1.5 ? 'var(--of-accent)' : weather.pressureDelta > 1.5 ? 'var(--of-warning)' : 'var(--of-text-4)'};">
					<svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true" style="transform:rotate({weather.pressureDelta < -1.5 ? 90 : weather.pressureDelta > 1.5 ? -90 : 0}deg);"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					{weather.pressureDelta > 0 ? '+' : ''}{weather.pressureDelta} hPa
				</span>
					<span style="font-size:0.75rem; color:var(--of-text-3); font-weight:500; ">{t.weatherPressure}</span>
				</div>

				<!-- Moon phase -->
				<div class="of-cond-cell">
					<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style="flex-shrink:0;">
							<circle cx="10" cy="10" r="8" fill="var(--of-bg-base)" stroke="var(--of-border-strong)" stroke-width="1"/>
							<path d={moonLitPath(weather.moonPhaseIndex)} fill="var(--of-accent)"/>
						</svg>
					<span style="font-size:0.75rem; font-weight:600; color:var(--of-text); line-height:1.2;">{moonPhaseLabels[weather.moonPhaseIndex]}</span>
					<span style="font-size:0.75rem; color:var(--of-text-3); font-weight:500; ">{t.weatherMoon}</span>
				</div>

			</div>
		</section>
	{/if}

	</div>
	</div>

	<!-- Catches within 100 m of this spot -->
	<section class="of-panel" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; margin-top:16px;">
		<h2 style="font-family:'DM Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--of-text-bright); margin:0 0 12px;">{t.navCatches}</h2>

		{#if nearbyCatches.length === 0}
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.catchNoItems}</p>
		{:else}
			<ul class="of-catch-rows">
				{#each nearbyCatches as c (c.id)}
					<li>
						<a href="/catches/{c.id}">
							<span class="thumb">
								{#if c.photos.length > 0}
									<img src={photoUrl(c.photos[0].filename, THUMB_SMALL)} alt="" loading="lazy" decoding="async" />
								{/if}
							</span>
							<span style="flex:1; min-width:0;">
								<span style="display:block; font-weight:600; color:var(--of-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{c.species ?? '—'}</span>
								<span style="display:block; font-size:0.75rem; color:var(--of-text-4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
									{formatDate(c.caughtAt)}{#if c.lure}{` · ${lureName(c.lure)}`}{/if}
								</span>
							</span>
							<span class="meas">
								{#if c.lengthCm != null}<span>{c.lengthCm}<small>&nbsp;cm</small></span>{/if}
								{#if c.weightG != null}<span>{c.weightG}<small>&nbsp;g</small></span>{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Share link management -->
	{#if authEnabled}
		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; margin-top:16px;" class="of-panel">
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

	<!-- Bite index info modal -->
	{#if showBiteInfo && weather}
		{@const ps = weather.biteScores.pressure}
		{@const ls = weather.biteScores.light}
		{@const ts = weather.biteScores.temp}
		<div style="position:fixed; inset:0; z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;">
			<div aria-hidden="true" onclick={() => showBiteInfo = false}
				style="position:absolute; inset:0; background:var(--of-scrim); backdrop-filter:blur(4px);"></div>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="bite-info-title"
				use:modal={{ onClose: () => (showBiteInfo = false), trap: true }}
				style="position:relative; background:var(--of-bg-surface); border:1px solid var(--of-border); border-radius:16px; padding:24px; max-width:420px; width:100%;"
			>
				<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
					<h2 id="bite-info-title" style="font-family:'DM Sans',sans-serif; font-size:1rem; color:var(--of-text-bright); margin:0;">{t.biteInfoTitle}</h2>
					<button onclick={() => showBiteInfo = false} aria-label={t.close} class="of-tap" style="background:none; border:none; cursor:pointer; color:var(--of-text-4); padding:4px;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
					</button>
				</div>

				<!-- Pressure -->
				<div style="margin-bottom:14px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.8125rem; font-weight:600; color:var(--of-text);">{t.biteInfoPressure}</span>
							<span style="font-size:0.75rem; color:var(--of-text-4); background:var(--of-bg-overlay); border:1px solid var(--of-border-subtle); padding:1px 6px; border-radius:10px; white-space:nowrap;">50% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.8125rem; font-weight:600; white-space:nowrap; color:{biteColor(ps)};">{ps}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:var(--of-border-subtle); border-radius:var(--of-radius-full); height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ps)}; border-radius:var(--of-radius-full); height:4px; width:{ps*10}%;"></div>
					</div>
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0;">
						{weather.pressureDelta > 0 ? '+' : ''}{weather.pressureDelta} hPa / 3h — {t.biteInfoPressureDesc}
					</p>
				</div>

				<!-- Light -->
				<div style="margin-bottom:14px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.8125rem; font-weight:600; color:var(--of-text);">{t.biteInfoLight}</span>
							<span style="font-size:0.75rem; color:var(--of-text-4); background:var(--of-bg-overlay); border:1px solid var(--of-border-subtle); padding:1px 6px; border-radius:10px; white-space:nowrap;">30% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.8125rem; font-weight:600; white-space:nowrap; color:{biteColor(ls)};">{ls}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:var(--of-border-subtle); border-radius:var(--of-radius-full); height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ls)}; border-radius:var(--of-radius-full); height:4px; width:{ls*10}%;"></div>
					</div>
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0;">{t.biteInfoLightDesc}</p>
				</div>

				<!-- Temperature -->
				<div style="margin-bottom:20px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.8125rem; font-weight:600; color:var(--of-text);">{t.biteInfoTemp}</span>
							<span style="font-size:0.75rem; color:var(--of-text-4); background:var(--of-bg-overlay); border:1px solid var(--of-border-subtle); padding:1px 6px; border-radius:10px; white-space:nowrap;">20% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.8125rem; font-weight:600; white-space:nowrap; color:{biteColor(ts)};">{ts}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:var(--of-border-subtle); border-radius:var(--of-radius-full); height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ts)}; border-radius:var(--of-radius-full); height:4px; width:{ts*10}%;"></div>
					</div>
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0;">
						Δ {weather.tempDelta} °C / 3h — {t.biteInfoTempDesc}
					</p>
				</div>

				<!-- Formula result -->
				<div style="background:var(--of-bg-overlay); border:1px solid var(--of-border-subtle); border-radius:10px; padding:12px 16px; font-family:'JetBrains Mono',monospace; font-size:0.8125rem; color:var(--of-text-3);">
					{t.biteInfoFormula} = ({ps}×0.5) + ({ls}×0.3) + ({ts}×0.2) =
					<span style="color:{biteColor(weather.biteIndex)}; font-weight:600;"> {weather.biteIndex}/10</span>
				</div>
			</div>
		</div>
	{/if}

</div>

<style>
	.of-spot { max-width: 680px; }
	/* Phones: facts and conditions first, then the map and photos. */
	.of-spot-grid { display: flex; flex-direction: column; gap: 16px; }
	.of-spot-col { display: contents; }
	.of-spot-info { background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px; }
	.of-spot-grid :global(.of-spot-info)   { order: 1; }
	.of-spot-grid :global(.of-spot-cond)   { order: 2; }
	.of-spot-grid :global(.of-spot-map)    { order: 3; }
	.of-spot-grid :global(.of-spot-photos) { order: 4; }
	/* Desktop: map + photos | facts + conditions */
	@media (min-width: 960px) {
		.of-spot { max-width: 1040px; }
		.of-spot-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); align-items: start; }
		.of-spot-col { display: flex; flex-direction: column; gap: 16px; }
		/* Beside the map the name, coordinates and tags are a heading block, not a card; the
		   conditions below keep their frame because they are a data block of their own.
		   0,2,0 + !important beats the phone .of-panel padding on touch screens >= 960px. */
		.of-spot-info.of-panel { background: none; border: none; border-radius: 0; padding: 4px 0 4px 8px !important; }
	}
	.of-catch-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
	.of-catch-rows li + li { border-top: 1px solid var(--of-border-subtle); }
	.of-catch-rows a {
		display: flex; align-items: center; gap: 12px; padding: 8px 6px; margin: 0 -6px;
		border-radius: 8px; text-decoration: none; font-size: 0.875rem; min-height: 44px;
	}
	.of-catch-rows a:hover { background: var(--of-accent-glow); }
	.of-catch-rows a:focus-visible { outline: 2px solid var(--of-accent); outline-offset: -2px; }
	.of-catch-rows .thumb { width: 44px; height: 33px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: var(--of-bg-overlay); }
	.of-catch-rows .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.of-catch-rows .meas { display: flex; gap: 12px; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; color: var(--of-text-bright); font-weight: 600; }
	.of-catch-rows .meas small { font-family: 'DM Sans', sans-serif; font-weight: 400; color: var(--of-text-4); font-size: 0.75rem; }
	/* Readings sit in the conditions card as one divided strip, not cards inside a card:
	   the 1px gaps show the grid's hairline colour between cells. */
	.of-cond { gap: 1px; background: var(--of-border-subtle); }
	.of-cond-cell {
		background: var(--of-bg-surface);
		padding: 12px 10px;
		display: flex; flex-direction: column; align-items: center; gap: 6px;
		text-align: center;
	}
</style>
