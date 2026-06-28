<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, spots, catches } = data;

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let L: any = null;
	let spotLayerGroup: any = null;
	let catchLayerGroup: any = null;
	let mapReady = $state(false);

	let showSpots = $state(true);
	let showCatches = $state(false);
	let showHeatmap = $state(false);

	const hasData = spots.length > 0 || catches.length > 0;

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

		mapInstance = L.map(mapEl, { zoomControl: true, scrollWheelZoom: true });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);

		// Build spot layer group
		spotLayerGroup = L.layerGroup().addTo(mapInstance);
		const spotMarkers: any[] = [];
		for (const s of spots) {
			const marker = L.marker([s.lat, s.lng], { icon: pinIcon })
				.bindTooltip(s.name, { permanent: false, direction: 'top', offset: [0, -36] })
				.on('click', () => { window.location.href = `/spots/${s.id}`; });
			marker.addTo(spotLayerGroup);
			spotMarkers.push(marker);
		}

		// Fit bounds to all spots (or single spot)
		if (spotMarkers.length === 1) {
			mapInstance.setView([spots[0].lat, spots[0].lng], 14);
		} else if (spotMarkers.length > 1) {
			const group = L.featureGroup(spotMarkers);
			mapInstance.fitBounds(group.getBounds().pad(0.2));
		} else if (catches.length > 0) {
			const validCatches = catches.filter(c => c.lat && c.lng);
			if (validCatches.length === 1) {
				mapInstance.setView([validCatches[0].lat!, validCatches[0].lng!], 13);
			} else if (validCatches.length > 1) {
				const latlngs = validCatches.map(c => [c.lat!, c.lng!]);
				mapInstance.fitBounds(L.latLngBounds(latlngs as any).pad(0.2));
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
					fillColor: '#f97316',
					fillOpacity: 0.18,
					stroke: false
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
				.on('click', () => { window.location.href = `/catches/${c.id}`; })
				.addTo(catchLayerGroup);
			}
		}
	});

	const pillBtn = (active: boolean) =>
		`font-size:0.8rem; padding:6px 14px; border-radius:8px; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; font-weight:500; border:1px solid; transition:all 0.15s; ${active ? 'background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);' : 'background:var(--of-bg-elevated); border-color:var(--of-border); color:var(--of-text-2);'}`;
</script>

<div>
	{#if !hasData}
		<!-- Empty state -->
		<div style="text-align:center; padding:80px 24px;">
			<div style="display:inline-flex; align-items:center; justify-content:center; width:80px; height:80px; border-radius:50%; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); margin-bottom:20px;">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" style="color:var(--of-border-strong);">
					<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.5" style="fill:var(--of-accent-bg)"/>
					<circle cx="12" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>
				</svg>
			</div>
			<p style="font-family:'Carter One',sans-serif; font-size:1.1rem; color:var(--of-text-2); margin:0 0 8px;">{t.spotNoSpots}</p>
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0 0 24px;">{t.spotNoSpotsHint}</p>
			<a href="/spots/new"
				style="display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:10px 22px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif;"
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
					style={pillBtn(showSpots)}
				>
					<svg width="12" height="12" viewBox="0 0 28 38" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="currentColor"/></svg>
					{t.navSpots}
				</button>
				<button
					type="button"
					onclick={() => { showCatches = !showCatches; if (showCatches) showHeatmap = false; }}
					style={pillBtn(showCatches)}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
					{t.navCatches}
				</button>
				<button
					type="button"
					onclick={() => { showHeatmap = !showHeatmap; if (showHeatmap) showCatches = false; }}
					style={pillBtn(showHeatmap)}
				>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="display:inline; margin-right:5px; vertical-align:-1px;"><circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5"/><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.4" opacity="0.4"/><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1" opacity="0.2"/></svg>
					{t.spotHeatmap}
				</button>
			</div>

			<!-- Map -->
			<div bind:this={mapEl} style="height:440px;"></div>
		</div>

		<!-- Spots table -->
		{#if spots.length > 0}
			<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px;">
				<div style="overflow-x:auto;">
					<table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
						<thead>
							<tr style="border-bottom:1px solid var(--of-border-subtle);">
								<th style="text-align:left; font-size:0.68rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;"></th>
								<th style="text-align:left; font-size:0.68rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.spotNameLabel}</th>
								<th style="text-align:left; font-size:0.68rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; padding:0 0 8px 0;">{t.spotTagsLabel}</th>
							</tr>
						</thead>
						<tbody>
							{#each spots as s}
								<tr style="border-bottom:1px solid var(--of-bg-elevated); cursor:pointer;"
									onclick={() => window.location.href = `/spots/${s.id}`}
									onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}}
									onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
								>
									<!-- Thumbnail -->
									<td style="padding:8px 10px 8px 0; width:40px;">
										{#if s.photos.length > 0}
											<div style="width:36px; height:28px; border-radius:5px; overflow:hidden;">
												<img src="/uploads/{s.photos[0].filename}" alt="" style="width:100%; height:100%; object-fit:cover;" />
											</div>
										{:else}
											<div style="width:36px; height:28px; border-radius:5px; background:var(--of-bg-overlay); display:flex; align-items:center; justify-content:center;">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:var(--of-border-subtle);"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
											</div>
										{/if}
									</td>
									<td style="padding:8px 12px 8px 0; font-weight:600; color:var(--of-text); white-space:nowrap;">{s.name}</td>
									<td style="padding:8px 0 8px 0;">
										{#if s.tags.length > 0}
											<div style="display:flex; flex-wrap:wrap; gap:4px;">
												{#each s.tags as tag}
													<span style="font-size:0.68rem; font-weight:600; color:var(--of-text-3); background:rgba(93,143,168,0.1); border:1px solid rgba(93,143,168,0.2); padding:2px 7px; border-radius:20px;">{tag.name}</span>
												{/each}
											</div>
										{:else}
											<span style="color:var(--of-text-4);">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
