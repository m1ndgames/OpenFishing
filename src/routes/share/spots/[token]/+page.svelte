<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import favicon from '$lib/assets/favicon.svg';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, spot } = data;

	const photos = spot.photos;
	const hasPhotos = photos.length > 0;
	let currentPhoto = $state(0);

	function prevPhoto() { currentPhoto = (currentPhoto - 1 + photos.length) % photos.length; }
	function nextPhoto() { currentPhoto = (currentPhoto + 1) % photos.length; }

	let mapEl: HTMLElement;
	let mapInstance: any = null;

	onMount(async () => {
		const L = (await import('leaflet')).default;
		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#06b6d4"/><circle cx="14" cy="14" r="5" fill="#030a12"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});
		mapInstance = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);
		mapInstance.setView([spot.lat, spot.lng], 15);
		L.marker([spot.lat, spot.lng], { icon: pinIcon }).addTo(mapInstance);
		requestAnimationFrame(() => mapInstance.invalidateSize());
	});

	onDestroy(() => { mapInstance?.remove(); });
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Carter+One&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<link rel="icon" href={favicon} />
	<title>{spot.name} · OpenFishing</title>
</svelte:head>

<div style="min-height:100vh; background-color:#060d17; background-image:radial-gradient(ellipse at 15% 60%, rgba(6,182,212,0.04) 0%, transparent 55%); color:#e0eaf8; font-family:'DM Sans',sans-serif;">
	<div style="height:1px; background:linear-gradient(90deg, transparent, #22d3ee 30%, #06b6d4 50%, #22d3ee 70%, transparent);"></div>

	<!-- Minimal header -->
	<header style="background:#0b1a2c; border-bottom:1px solid #172f4a; padding:0 16px;">
		<div style="max-width:720px; margin:0 auto; height:52px; display:flex; align-items:center; justify-content:space-between;">
			<span style="font-family:'Carter One',sans-serif; font-size:1.1rem; color:#e0eaf8; display:flex; align-items:center; gap:8px;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				OpenFishing
			</span>
			<span style="font-size:0.72rem; font-weight:500; color:#3d6a84; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.15); padding:3px 10px; border-radius:20px; letter-spacing:0.04em;">{t.shareViewOnly}</span>
		</div>
	</header>

	<div style="max-width:720px; margin:0 auto; padding:24px 16px;">

		<!-- Map -->
		<div style="border-radius:14px; overflow:hidden; border:1px solid #172f4a; margin-bottom:16px;">
			<div bind:this={mapEl} style="height:300px;"></div>
		</div>

		<!-- Photo slider -->
		{#if hasPhotos}
			<div style="position:relative; border-radius:14px; overflow:hidden; background:#0d1f35; aspect-ratio:16/9; margin-bottom:16px;">
				{#each photos as photo, i}
					<img src="/uploads/{photo.filename}" alt="{spot.name} photo {i + 1}"
						style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};" />
				{/each}
				{#if photos.length > 1}
					<button onclick={prevPhoto} aria-label="Previous"
						style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:#EDF5FA; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</button>
					<button onclick={nextPhoto} aria-label="Next"
						style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:#EDF5FA; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</button>
					<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px;">
						{#each photos as _, i}
							<button onclick={() => currentPhoto = i}
								style="width:{i === currentPhoto ? '18px' : '6px'}; height:6px; border-radius:3px; background:{i === currentPhoto ? '#22d3ee' : 'rgba(255,255,255,0.4)'}; border:none; cursor:pointer; transition:all 0.2s; padding:0;"
								aria-label="Photo {i + 1}"></button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Info card -->
		<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
			<div>
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0 0 8px;">{spot.name}</h1>
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:#3d6a84; margin:0;">{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}</p>
			</div>

			<a href="https://www.google.com/maps/dir/?api=1&destination={spot.lat},{spot.lng}" target="_blank" rel="noopener noreferrer"
				style="display:inline-flex; align-items:center; gap:6px; background:#0f2238; color:#8ab8cc; font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid #243f5e; text-decoration:none; width:fit-content;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
			>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
					<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/>
					<circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
				</svg>
				{t.spotGetDirections}
			</a>

			{#if spot.tags.length > 0}
				<div>
					<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 8px;">{t.spotTagsLabel}</p>
					<div style="display:flex; flex-wrap:wrap; gap:6px;">
						{#each spot.tags as tag (tag.id)}
							<span style="font-size:0.78rem; padding:3px 10px; border-radius:20px; background:rgba(74,222,128,0.08); color:#4ade80; border:1px solid rgba(74,222,128,0.15); font-weight:500;">{tag.name}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if spot.notes}
				<div>
					<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 6px;">{t.spotNotesLabel}</p>
					<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{spot.notes}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
