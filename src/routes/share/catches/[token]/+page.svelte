<script lang="ts">
	import { setupMapGestures } from '#lib/mapGestures.js';
	import { addBaseTiles, addMapControls, STATIC_PIN } from '#lib/mapTiles.js';
	import { detailSrcset, DETAIL_SIZES, photoAlt } from '#lib/photo.js';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import favicon from '#lib/assets/favicon.svg';
	import mark from '#lib/assets/openfishing-mark.svg?raw';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, catch: c } = $derived(data);

	const photos = $derived(c.photos);
	const hasPhotos = $derived(photos.length > 0);
	// Back to the first photo whenever the photo set changes (e.g. navigating to another entry)
	let currentPhoto = $derived.by(() => { photos; return 0; });
	const hasLocation = $derived(c.lat !== null && c.lng !== null);

	function prevPhoto() { currentPhoto = (currentPhoto - 1 + photos.length) % photos.length; }
	function nextPhoto() { currentPhoto = (currentPhoto + 1) % photos.length; }

	function formatDatetime(d: Date) {
		const date = new Date(d);
		return date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
			+ ' · '
			+ date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	function lureName(l: { lureNumber: number | null; name: string }) {
		return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
	}

	let mapEl = $state<HTMLElement>(); // rendered inside an {#if}, so bound after mount
	let mapInstance: any = null;

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

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<title>{c.species ?? 'Catch'} · OpenFishing</title>
</svelte:head>

<div style="min-height:100vh; background-color:var(--of-bg-base); color:var(--of-text-bright); font-family:'DM Sans',sans-serif;">

	<!-- Minimal header -->
	<header style="background:var(--of-bg-surface); border-bottom:1px solid var(--of-border-subtle); padding:0 16px;">
		<div style="max-width:640px; margin:0 auto; height:52px; display:flex; align-items:center; justify-content:space-between;">
			<span style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-section); color:var(--of-text-bright); display:flex; align-items:center; gap:8px;">
				<span style="color:var(--of-accent); flex-shrink:0; display:flex;">
					{@html mark.replace('<svg ', '<svg width="20" height="20" ')}
				</span>
				OpenFishing
			</span>
			<span style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); padding:3px 10px; border-radius:20px;">{t.shareViewOnly}</span>
		</div>
	</header>

	<div style="max-width:640px; margin:0 auto; padding:24px 16px;">

		{#if hasLocation}
			<div style="border-radius:14px; overflow:hidden; border:1px solid var(--of-border-subtle); margin-bottom:16px;">
				<div bind:this={mapEl} style="height:260px;"></div>
			</div>
		{/if}

		{#if hasPhotos}
			<div style="position:relative; border-radius:14px; overflow:hidden; background:var(--of-bg-overlay); aspect-ratio:4/3; margin-bottom:16px;">
				{#each photos as photo, i}
					<img src="/uploads/{photo.filename}" srcset={detailSrcset(photo.filename)} sizes={DETAIL_SIZES} alt={photoAlt(t, c.species, i, photos.length)}
						style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};" />
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
					<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px;">
						{#each photos as _, i}
							<button onclick={() => currentPhoto = i}
								style="width:{i === currentPhoto ? '18px' : '6px'}; height:6px; border-radius:var(--of-radius-full); background:{i === currentPhoto ? 'var(--of-accent)' : 'rgba(255,255,255,0.4)'}; border:none; cursor:pointer; transition:var(--of-transition); padding:0;"
								aria-label={t.photoN.replace("{n}", String(i + 1))}></button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">

			<div>
				<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
					<h1 style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0;">{c.species ?? '—'}</h1>
					{#if c.catchAndRelease}
						<span style="font-size:0.75rem; font-weight:600; color:var(--of-accent); background:var(--of-accent-bg-hover); border:1px solid var(--of-accent-border); padding:3px 9px; border-radius:20px;">{t.catchAndReleaseShort}</span>
					{/if}
				</div>
				<p style="font-size:0.8125rem; color:var(--of-text-4); margin:4px 0 0;">{formatDatetime(c.caughtAt)}</p>
			</div>

			{#if c.lengthCm || c.weightG}
				<div style="display:flex; flex-wrap:wrap; gap:8px;">
					{#if c.lengthCm}
						<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
							<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-section); font-weight:600; color:var(--of-accent);">{c.lengthCm}</span>
							<span style="font-size:0.75rem; color:var(--of-text-3); margin-top:2px;">{t.catchLengthLabel}</span>
						</div>
					{/if}
					{#if c.weightG}
						<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
							<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-section); font-weight:600; color:var(--of-accent);">{c.weightG}</span>
							<span style="font-size:0.75rem; color:var(--of-text-3); margin-top:2px;">{t.catchWeightLabel}</span>
						</div>
					{/if}
				</div>
			{/if}

			{#if hasLocation}
				<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
					<p style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-4); margin:0;">{c.lat!.toFixed(6)}, {c.lng!.toFixed(6)}</p>
					<a href="https://www.google.com/maps/dir/?api=1&destination={c.lat},{c.lng}" target="_blank" rel="noopener noreferrer"
						style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; white-space:nowrap; flex-shrink:0;"
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

			{#if c.lure}
				<div>
					<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.catchLureLabel}</p>
					<span style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border);">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
						{lureName(c.lure)}
					</span>
				</div>
			{/if}

			{#if c.presentation}
				<div>
					<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.presentation}</p>
					<span style="display:inline-block; padding:5px 14px; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:20px; font-size:0.875rem; color:var(--of-accent); font-weight:500;">{c.presentation}</span>
				</div>
			{/if}

			{#if c.notes}
				<div>
					<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.notes}</p>
					<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{c.notes}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
