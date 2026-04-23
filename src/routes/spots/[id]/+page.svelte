<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, spot, nearbyCatches, weather, authEnabled } = data;

	let shareUrl = $state(data.shareUrl);
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

	const moonPhaseLabels = [t.moonNew, t.moonWaxCrescent, t.moonFirstQ, t.moonWaxGibbous, t.moonFull, t.moonWanGibbous, t.moonLastQ, t.moonWanCrescent];
	const moonEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

	let showBiteInfo = $state(false);

	function biteColor(score: number) {
		if (score >= 8.5) return '#22d3ee';
		if (score >= 6.5) return '#22c55e';
		if (score >= 4)   return '#f59e0b';
		return '#ef4444';
	}
	function biteRating(score: number) {
		if (score >= 8.5) return t.biteRatingExcellent;
		if (score >= 6.5) return t.biteRatingGood;
		if (score >= 4)   return t.biteRatingFair;
		return t.biteRatingPoor;
	}

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let currentPhoto = $state(0);

	const photos = spot.photos;
	const hasPhotos = photos.length > 0;

	function prevPhoto() { currentPhoto = (currentPhoto - 1 + photos.length) % photos.length; }
	function nextPhoto() { currentPhoto = (currentPhoto + 1) % photos.length; }

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

	function formatCoord(n: number) { return n.toFixed(6); }

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function lureName(l: { lureNumber: number | null; name: string }) {
		return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
	}
</script>

<div style="max-width:680px;">
	<!-- Map -->
	<div style="border-radius:14px; overflow:hidden; border:1px solid #172f4a; margin-bottom:16px;">
		<div bind:this={mapEl} style="height:300px;"></div>
	</div>

	<!-- Photo slider -->
	{#if hasPhotos}
		<div style="position:relative; border-radius:14px; overflow:hidden; background:#0d1f35; aspect-ratio:16/9; margin-bottom:16px;">
			{#each photos as photo, i}
				<img
					src="/uploads/{photo.filename}"
					alt="{spot.name} photo {i + 1}"
					style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};"
				/>
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

				<!-- Dots -->
				<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px;">
					{#each photos as _, i}
						<button onclick={() => currentPhoto = i}
							style="width:{i === currentPhoto ? '18px' : '6px'}; height:6px; border-radius:3px; background:{i === currentPhoto ? '#22d3ee' : 'rgba(255,255,255,0.4)'}; border:none; cursor:pointer; transition:all 0.2s; padding:0;"
							aria-label="Photo {i + 1}"
						></button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Info card -->
	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">

		<!-- Name + coordinates + directions -->
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0 0 4px;">{spot.name}</h1>
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:#3d6a84; margin:0;">{formatCoord(spot.lat)}, {formatCoord(spot.lng)}</p>
			</div>
			<a href="https://www.google.com/maps/dir/?api=1&destination={spot.lat},{spot.lng}" target="_blank" rel="noopener noreferrer"
				style="display:inline-flex; align-items:center; gap:6px; background:#0f2238; color:#8ab8cc; font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid #243f5e; text-decoration:none; white-space:nowrap; transition:all 0.15s; font-family:'DM Sans',sans-serif; flex-shrink:0;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
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
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.spotTagsLabel}</p>
				<div style="display:flex; flex-wrap:wrap; gap:6px;">
					{#each spot.tags as tag}
						<span style="font-size:0.78rem; font-weight:600; color:#5d8fa8; background:rgba(93,143,168,0.1); border:1px solid rgba(93,143,168,0.2); padding:3px 10px; border-radius:20px;">{tag.name}</span>
					{/each}
				</div>
			</div>
		{/if}

		{#if spot.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.spotNotesLabel}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{spot.notes}</p>
			</div>
		{/if}

		<!-- Edit -->
		<div style="display:flex; gap:8px; padding-top:16px; border-top:1px solid #172f4a; margin-top:16px;">
			<a href="/spots/{spot.id}/edit"
				style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>
				{t.edit}
			</a>
		</div>
	</div>

	<!-- Weather card -->
	{#if weather}
		<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:16px 20px; margin-top:16px;">
			<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 12px;">{t.weatherTitle}</p>

			<!-- Bite index banner -->
			<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:14px 18px; margin-bottom:12px; display:flex; align-items:center; gap:16px;">
				<div style="flex:1; min-width:0;">
					<button
						onclick={() => showBiteInfo = true}
						style="display:inline-flex; align-items:center; gap:5px; background:none; border:none; padding:0; cursor:pointer; margin:0 0 8px;"
					>
						<span style="font-size:0.7rem; font-weight:600; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em;">{t.biteIndex}</span>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="color:#2d5270; flex-shrink:0;">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
							<path d="M12 11v5M12 8v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						</svg>
					</button>
					<div style="background:#172f4a; border-radius:4px; height:5px; margin-bottom:6px;">
						<div style="background:{biteColor(weather.biteIndex)}; border-radius:4px; height:5px; width:{weather.biteIndex * 10}%; transition:width 0.4s;"></div>
					</div>
					<span style="font-size:0.78rem; font-weight:600; color:{biteColor(weather.biteIndex)};">{biteRating(weather.biteIndex)}</span>
				</div>
				<div style="text-align:right; flex-shrink:0;">
					<span style="font-family:'JetBrains Mono',monospace; font-size:2rem; font-weight:700; color:{biteColor(weather.biteIndex)}; line-height:1;">{weather.biteIndex}</span>
					<span style="font-size:0.8rem; color:#3d6a84;">/10</span>
				</div>
			</div>

			<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">

				<!-- Temperature -->
				<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:12px 10px; display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
						<path d="M12 3a2 2 0 0 0-2 2v8.27A4 4 0 1 0 14 17V5a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<circle cx="12" cy="17" r="2" fill="currentColor" opacity="0.4"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:700; color:#e0eaf8; line-height:1;">{weather.temperature != null ? `${weather.temperature}°` : '—'}</span>
					<span style="font-size:0.65rem; color:#3d6a84; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">{t.weatherTemp}</span>
				</div>

				<!-- Humidity -->
				<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:12px 10px; display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
						<path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:700; color:#e0eaf8; line-height:1;">{weather.humidity != null ? `${weather.humidity}%` : '—'}</span>
					<span style="font-size:0.65rem; color:#3d6a84; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">{t.weatherHumidity}</span>
				</div>

				<!-- Pressure -->
				<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:12px 10px; display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
						<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
						<path d="M12 12L8.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						<circle cx="12" cy="12" r="1.5" fill="currentColor"/>
					</svg>
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.85rem; font-weight:700; color:#e0eaf8; line-height:1;">{weather.pressure != null ? `${weather.pressure}` : '—'}<span style="font-size:0.6rem; color:#5d8fa8;"> hPa</span></span>
				<span style="font-size:0.65rem; color:{weather.pressureDelta < -1.5 ? '#22d3ee' : weather.pressureDelta > 1.5 ? '#f59e0b' : '#3d6a84'};">
					{weather.pressureDelta < -1.5 ? '↓' : weather.pressureDelta > 1.5 ? '↑' : '→'} {weather.pressureDelta > 0 ? '+' : ''}{weather.pressureDelta} hPa
				</span>
					<span style="font-size:0.65rem; color:#3d6a84; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">{t.weatherPressure}</span>
				</div>

				<!-- Moon phase -->
				<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:12px 10px; display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;">
					<span style="font-size:1.25rem; line-height:1;">{moonEmojis[weather.moonPhaseIndex]}</span>
					<span style="font-size:0.75rem; font-weight:600; color:#c2dce8; line-height:1.2;">{moonPhaseLabels[weather.moonPhaseIndex]}</span>
					<span style="font-size:0.65rem; color:#3d6a84; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">{t.weatherMoon}</span>
				</div>

			</div>
		</div>
	{/if}

	<!-- Bite index info modal -->
	{#if showBiteInfo && weather}
		{@const ps = weather.biteScores.pressure}
		{@const ls = weather.biteScores.light}
		{@const ts = weather.biteScores.temp}
		<div
			role="dialog"
			aria-modal="true"
			onclick={() => showBiteInfo = false}
			style="position:fixed; inset:0; background:rgba(3,10,18,0.75); backdrop-filter:blur(4px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;"
		>
			<div
				onclick={(e) => e.stopPropagation()}
				style="background:#0b1a2c; border:1px solid #243f5e; border-radius:16px; padding:24px; max-width:420px; width:100%;"
			>
				<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
					<h2 style="font-family:'Carter One',sans-serif; font-size:1rem; color:#e0eaf8; margin:0;">{t.biteInfoTitle}</h2>
					<button onclick={() => showBiteInfo = false} style="background:none; border:none; cursor:pointer; color:#3d6a84; padding:4px;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
					</button>
				</div>

				<!-- Pressure -->
				<div style="margin-bottom:14px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.82rem; font-weight:600; color:#c2dce8;">{t.biteInfoPressure}</span>
							<span style="font-size:0.65rem; color:#3d6a84; background:#0d1f35; border:1px solid #172f4a; padding:1px 6px; border-radius:10px;">50% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem; font-weight:700; color:{biteColor(ps)};">{ps}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:#172f4a; border-radius:3px; height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ps)}; border-radius:3px; height:4px; width:{ps*10}%;"></div>
					</div>
					<p style="font-size:0.72rem; color:#3d6a84; margin:0;">
						{weather.pressureDelta > 0 ? '+' : ''}{weather.pressureDelta} hPa / 3h — {t.biteInfoPressureDesc}
					</p>
				</div>

				<!-- Light -->
				<div style="margin-bottom:14px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.82rem; font-weight:600; color:#c2dce8;">{t.biteInfoLight}</span>
							<span style="font-size:0.65rem; color:#3d6a84; background:#0d1f35; border:1px solid #172f4a; padding:1px 6px; border-radius:10px;">30% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem; font-weight:700; color:{biteColor(ls)};">{ls}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:#172f4a; border-radius:3px; height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ls)}; border-radius:3px; height:4px; width:{ls*10}%;"></div>
					</div>
					<p style="font-size:0.72rem; color:#3d6a84; margin:0;">{t.biteInfoLightDesc}</p>
				</div>

				<!-- Temperature -->
				<div style="margin-bottom:20px;">
					<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:4px;">
						<div style="display:flex; align-items:center; gap:8px;">
							<span style="font-size:0.82rem; font-weight:600; color:#c2dce8;">{t.biteInfoTemp}</span>
							<span style="font-size:0.65rem; color:#3d6a84; background:#0d1f35; border:1px solid #172f4a; padding:1px 6px; border-radius:10px;">20% {t.biteInfoWeight}</span>
						</div>
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem; font-weight:700; color:{biteColor(ts)};">{ts}/10 {t.biteInfoScore}</span>
					</div>
					<div style="background:#172f4a; border-radius:3px; height:4px; margin-bottom:5px;">
						<div style="background:{biteColor(ts)}; border-radius:3px; height:4px; width:{ts*10}%;"></div>
					</div>
					<p style="font-size:0.72rem; color:#3d6a84; margin:0;">
						Δ {weather.tempDelta} °C / 3h — {t.biteInfoTempDesc}
					</p>
				</div>

				<!-- Formula result -->
				<div style="background:#0d1f35; border:1px solid #172f4a; border-radius:10px; padding:12px 16px; font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:#5d8fa8;">
					{t.biteInfoFormula} = ({ps}×0.5) + ({ls}×0.3) + ({ts}×0.2) =
					<span style="color:{biteColor(weather.biteIndex)}; font-weight:700;"> {weather.biteIndex}/10</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Share link management -->
	{#if authEnabled}
		<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; margin-top:16px;">
			<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 10px; display:flex; align-items:center; gap:6px;">
				<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				{t.shareLink}
			</p>
			{#if shareUrl}
				<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
					<input type="text" value={shareUrl} readonly
						style="flex:1; min-width:0; background:#060d17; border:1px solid #172f4a; border-radius:8px; color:#8ab8cc; font-family:'JetBrains Mono',monospace; font-size:0.72rem; padding:7px 10px; outline:none;" />
					<button onclick={copyShare}
						style="background:{copied ? 'rgba(74,222,128,0.12)' : '#0f2238'}; color:{copied ? '#4ade80' : '#8ab8cc'}; border:1px solid {copied ? 'rgba(74,222,128,0.3)' : '#243f5e'}; font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; transition:all 0.15s; font-family:'DM Sans',sans-serif;">
						{copied ? t.shareCopied : t.shareCopy}
					</button>
					<button onclick={revokeShare}
						style="background:#0f2238; color:#f87171; border:1px solid rgba(248,113,113,0.2); font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(248,113,113,0.5)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(248,113,113,0.2)';}}>
						{t.shareRevoke}
					</button>
				</div>
				<p style="font-size:0.72rem; color:#3d6a84; margin:0;">{t.sharePublicNote}</p>
			{:else}
				<button onclick={createShare}
					style="display:inline-flex; align-items:center; gap:6px; background:#0f2238; color:#8ab8cc; font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid #243f5e; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					{t.shareGenerate}
				</button>
			{/if}
		</div>
	{/if}

	<!-- Nearby catches -->
	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; margin-top:16px;">
		<p style="font-family:'Carter One',sans-serif; font-size:1rem; color:#e0eaf8; margin:0 0 14px;">{t.navCatches}</p>

		{#if nearbyCatches.length === 0}
			<p style="font-size:0.875rem; color:#3d6a84; margin:0;">{t.catchNoItems}</p>
		{:else}
			<div style="overflow-x:auto;">
				<table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
					<thead>
						<tr style="border-bottom:1px solid #172f4a;">
							<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;"></th>
							<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchSpeciesLabel}</th>
							<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchDateLabel}</th>
							<th style="text-align:right; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchLengthLabel}</th>
							<th style="text-align:right; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 0 8px 0;">{t.catchWeightLabel}</th>
							<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 0 8px 12px;">{t.catchLureLabel}</th>
						</tr>
					</thead>
					<tbody>
						{#each nearbyCatches as c}
							<tr style="border-bottom:1px solid #0f2238; cursor:pointer;"
								onclick={() => window.location.href = `/catches/${c.id}`}
								onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(6,182,212,0.04)';}}
								onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
							>
								<!-- Thumbnail -->
								<td style="padding:8px 10px 8px 0; width:40px;">
									{#if c.photos.length > 0}
										<div style="width:36px; height:28px; border-radius:5px; overflow:hidden; flex-shrink:0;">
											<img src="/uploads/{c.photos[0].filename}" alt="" style="width:100%; height:100%; object-fit:cover;" />
										</div>
									{:else}
										<div style="width:36px; height:28px; border-radius:5px; background:#0d1f35; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:#1d3d5c;">
												<path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
											</svg>
										</div>
									{/if}
								</td>
								<td style="padding:8px 12px 8px 0; font-weight:600; color:#c2dce8; white-space:nowrap;">{c.species ?? '—'}</td>
								<td style="padding:8px 12px 8px 0; color:#5d8fa8; white-space:nowrap;">{formatDate(c.caughtAt)}</td>
								<td style="padding:8px 12px 8px 0; color:#22d3ee; font-family:'JetBrains Mono',monospace; text-align:right; white-space:nowrap;">{c.lengthCm != null ? `${c.lengthCm}` : '—'}</td>
								<td style="padding:8px 0 8px 0; color:#22d3ee; font-family:'JetBrains Mono',monospace; text-align:right; white-space:nowrap;">{c.weightG != null ? `${c.weightG}` : '—'}</td>
								<td style="padding:8px 0 8px 12px; color:#5d8fa8; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis;">
									{#if c.lure}{lureName(c.lure)}{:else}—{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
