<script lang="ts">
	import { setupMapGestures } from '#lib/mapGestures.js';
	import { addBaseTiles, addMapControls } from '#lib/mapTiles.js';
	import { goto } from '$app/navigation';
	import { photoUrl, THUMB_SMALL } from '#lib/photo.js';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, spots, catches } = $derived(data);

	let mapEl = $state<HTMLElement>(); // rendered inside an {#if}, so bound after mount
	let mapInstance: any = null;
	let L: any = null;
	let spotLayerGroup: any = null;
	let catchLayerGroup: any = null;
	let mapReady = $state(false);

	let showSpots = $state(true);
	let showCatches = $state(false);
	let showHeatmap = $state(false);

	const hasData = $derived(spots.length > 0 || catches.length > 0);

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	onMount(async () => {
		if (!hasData || !mapEl) return;

		L = (await import('leaflet')).default;

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl!, { zoomControl: false, scrollWheelZoom: true });

		setupMapGestures(mapInstance, mapEl!, t.mapTwoFingerHint);
		addBaseTiles(L, mapInstance, data.mapTiles);
		addMapControls(L, mapInstance, t);

		// Build spot layer group
		spotLayerGroup = L.layerGroup().addTo(mapInstance);
		const spotMarkers: any[] = [];
		for (const s of spots) {
			const marker = L.marker([s.lat, s.lng], { icon: pinIcon, alt: s.name, title: s.name })
				.bindTooltip(s.name, { permanent: false, direction: 'top', offset: [0, -36] })
				.on('click', () => goto(`/spots/${s.id}`));
			marker.addTo(spotLayerGroup);
			spotMarkers.push(marker);
		}

		// Fit bounds to all spots (or single spot)
		if (spotMarkers.length === 1) {
			mapInstance.setView([spots[0].lat, spots[0].lng], 14);
		} else if (spotMarkers.length > 1) {
			const group = L.featureGroup(spotMarkers);
			mapInstance.fitBounds(group.getBounds().pad(0.2));
		} else {
			const validCatches = catches.filter(c => c.lat && c.lng);
			if (validCatches.length === 1) {
				mapInstance.setView([validCatches[0].lat!, validCatches[0].lng!], 13);
			} else if (validCatches.length > 1) {
				const latlngs = validCatches.map(c => [c.lat!, c.lng!]);
				mapInstance.fitBounds(L.latLngBounds(latlngs as any).pad(0.2));
			} else {
				// Nothing to frame — fall back to a default view instead of a grey map
				mapInstance.setView([51, 10], 5);
			}
		}

		catchLayerGroup = L.layerGroup().addTo(mapInstance);

		requestAnimationFrame(() => {
			mapInstance.invalidateSize();
			mapReady = true;
		});
	});

	onDestroy(() => { mapInstance?.remove(); });

	$effect(() => {
		if (!mapReady || !L || !spotLayerGroup || !catchLayerGroup) return;

		if (showSpots) {
			mapInstance.addLayer(spotLayerGroup);
		} else {
			mapInstance.removeLayer(spotLayerGroup);
		}

		catchLayerGroup.clearLayers();
		if (!showCatches && !showHeatmap) return;

		for (const c of catches) {
			if (c.lat === null || c.lng === null) continue;
			if (showHeatmap) {
				L.circleMarker([c.lat, c.lng], {
					radius: 22,
					fillColor: getComputedStyle(document.documentElement).getPropertyValue('--of-accent-solid').trim() || '#f97316',
					fillOpacity: 0.18,
					stroke: false,
					interactive: false
				}).addTo(catchLayerGroup);
			} else {
				L.circleMarker([c.lat, c.lng], {
					radius: 6,
					fillColor: 'var(--of-accent)',
					fillOpacity: 0.85,
					color: '#fff',
					weight: 1.5
				})
				.bindTooltip(c.species ?? '—', { permanent: false, direction: 'top' })
				.on('click', () => goto(`/catches/${c.id}`))
				.addTo(catchLayerGroup);
			}
		}
	});

	const pillBtn = (active: boolean) =>
		`font-size:0.8125rem; padding:6px 14px; border-radius:8px; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; font-weight:500; border:1px solid; transition:var(--of-transition); ${active ? 'background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);' : 'background:var(--of-bg-elevated); border-color:var(--of-border); color:var(--of-text-2);'}`;
</script>

<div>
	<h1 class="sr-only">{t.navSpots}</h1>
	{#if !hasData}
		<!-- Empty state -->
		<div style="text-align:center; padding:80px 24px;">
			<div style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; border-radius:50%; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); margin-bottom:20px;">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" style="color:var(--of-border-strong);">
					<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.5" style="fill:var(--of-accent-bg)"/>
					<circle cx="12" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>
				</svg>
			</div>
			<p style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-section); color:var(--of-text-2); margin:0 0 8px;">{t.spotNoSpots}</p>
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0 0 24px;">{t.spotNoSpotsHint}</p>
			<a href="/spots/new"
				style="display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:10px 22px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif;"
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.addSpot}
			</a>
		</div>

	{:else}
		<!-- Map card -->
		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; overflow:hidden; margin-bottom:16px;">

			<!-- Controls -->
			<div style="padding:10px 14px; display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--of-border-subtle);">
				<button
					type="button"
					onclick={() => showSpots = !showSpots}
					aria-pressed={showSpots}
					style={pillBtn(showSpots)}
				>
					<svg width="12" height="12" viewBox="0 0 28 38" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="currentColor"/></svg>
					{t.navSpots}
				</button>
				<button
					type="button"
					onclick={() => { showCatches = !showCatches; if (showCatches) showHeatmap = false; }}
					aria-pressed={showCatches}
					style={pillBtn(showCatches)}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
					{t.navCatches}
				</button>
				<button
					type="button"
					onclick={() => { showHeatmap = !showHeatmap; if (showHeatmap) showCatches = false; }}
					aria-pressed={showHeatmap}
					style={pillBtn(showHeatmap)}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5"/><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.4" opacity="0.4"/><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1" opacity="0.2"/></svg>
					{t.spotHeatmap}
				</button>
			</div>

			<!-- Map -->
			<div bind:this={mapEl} style="height:440px;"></div>
		</div>

		<!-- Spot list: real links, so they work with keyboard, middle-click and screen readers -->
		{#if spots.length > 0}
			<ul class="of-panel of-spot-rows">
				{#each spots as s (s.id)}
					<li>
						<a href="/spots/{s.id}">
							<span class="thumb">
								{#if s.photos.length > 0}
									<img src={photoUrl(s.photos[0].filename, THUMB_SMALL)} alt="" loading="lazy" decoding="async" />
								{:else}
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:var(--of-border);" aria-hidden="true"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
								{/if}
							</span>
							<span style="flex:1; min-width:0; font-weight:600; color:var(--of-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{s.name}</span>
							{#if s.tags.length > 0}
								<span class="tags">
									{#each s.tags.slice(0, 3) as tag}
										<span>{tag.name}</span>
									{/each}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.of-spot-rows {
		list-style: none; margin: 0; padding: 8px 14px;
		background: var(--of-bg-surface); border: 1px solid var(--of-border-subtle); border-radius: 14px;
	}
	.of-spot-rows li + li { border-top: 1px solid var(--of-border-subtle); }
	.of-spot-rows a {
		display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 6px; margin: 0 -6px;
		border-radius: 8px; text-decoration: none; font-size: 0.875rem;
	}
	.of-spot-rows a:hover { background: var(--of-accent-bg); }
	.of-spot-rows a:focus-visible { outline: 2px solid var(--of-accent); outline-offset: -2px; }
	.of-spot-rows .thumb {
		width: 44px; height: 33px; flex-shrink: 0; border-radius: 6px; overflow: hidden;
		background: var(--of-bg-overlay); display: flex; align-items: center; justify-content: center;
	}
	.of-spot-rows .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.of-spot-rows .tags { display: flex; gap: 4px; flex-shrink: 0; max-width: 45%; overflow: hidden; }
	.of-spot-rows .tags span {
		font-size: 0.75rem; font-weight: 600; color: var(--of-text-3); background: var(--of-border-subtle);
		border: 1px solid var(--of-border); padding: 2px 7px; border-radius: 20px; white-space: nowrap;
	}
</style>
