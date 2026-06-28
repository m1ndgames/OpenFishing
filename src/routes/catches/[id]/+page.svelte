<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import 'leaflet/dist/leaflet.css';

	let { data }: { data: PageData } = $props();
	const { t, catch: c, nearbySpot, authEnabled } = data;

	let shareUrl = $state(data.shareUrl);
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

	let currentPhoto = $state(0);
	const photos = c.photos;
	const hasPhotos = photos.length > 0;
	const hasLocation = c.lat !== null && c.lng !== null;

	let mapEl: HTMLElement;
	let mapInstance: any = null;

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

	function biteColor(score: number) {
		if (score >= 8.5) return 'var(--of-accent)';
		if (score >= 6.5) return 'var(--of-success)';
		if (score >= 4)   return 'var(--of-warning-solid)';
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

		mapInstance = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);

		mapInstance.setView([c.lat!, c.lng!], 15);
		L.marker([c.lat!, c.lng!], { icon: pinIcon }).addTo(mapInstance);
		requestAnimationFrame(() => mapInstance.invalidateSize());
	});

	onDestroy(() => { mapInstance?.remove(); });
</script>

<div style="max-width:580px;">

	<!-- Map -->
	{#if hasLocation}
		<div style="border-radius:14px; overflow:hidden; border:1px solid var(--of-border-subtle); margin-bottom:16px;">
			<div bind:this={mapEl} style="height:300px;"></div>
		</div>
	{/if}

	<!-- Photo slider -->
	{#if hasPhotos}
		<div style="position:relative; border-radius:14px; overflow:hidden; background:var(--of-bg-overlay); aspect-ratio:4/3; margin-bottom:16px;">
			{#each photos as photo, i}
				<img
					src="/uploads/{photo.filename}"
					alt="{c.species ?? 'catch'} photo {i + 1}"
					style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s; opacity:{i === currentPhoto ? '1' : '0'}; pointer-events:{i === currentPhoto ? 'auto' : 'none'};"
				/>
			{/each}

			{#if photos.length > 1}
				<button onclick={prevPhoto} aria-label="Previous"
					style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:var(--of-text-bright); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<button onclick={nextPhoto} aria-label="Next"
					style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.5); border:none; color:var(--of-text-bright); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px);">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
				<div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); display:flex; gap:5px;">
					{#each photos as _, i}
						<button onclick={() => currentPhoto = i}
							style="width:{i === currentPhoto ? '18px' : '6px'}; height:6px; border-radius:3px; background:{i === currentPhoto ? 'var(--of-accent)' : 'rgba(255,255,255,0.4)'}; border:none; cursor:pointer; transition:all 0.2s; padding:0;"
							aria-label="Photo {i + 1}"
						></button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Info card -->
	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">

		<!-- Species + date -->
		<div>
			<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:var(--of-text-bright); margin:0;">{c.species ?? '—'}</h1>
				{#if c.catchAndRelease}
					<span style="font-size:0.7rem; font-weight:700; color:var(--of-accent); background:var(--of-accent-bg-hover); border:1px solid var(--of-accent-border); padding:3px 9px; border-radius:20px; letter-spacing:0.04em;">{t.catchAndReleaseShort}</span>
				{/if}
			</div>
			<p style="font-size:0.8rem; color:var(--of-text-4); margin:4px 0 0;">{formatDatetime(c.caughtAt)}</p>
		</div>

		<!-- Length + Weight badges -->
		{#if c.lengthCm || c.weightG}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if c.lengthCm}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-border); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-accent);">{c.lengthCm}</span>
						<span style="font-size:0.68rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.catchLengthLabel}</span>
					</div>
				{/if}
				{#if c.weightG}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-border); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-accent);">{c.weightG}</span>
						<span style="font-size:0.68rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.catchWeightLabel}</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Coordinates + directions -->
		{#if hasLocation}
			<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--of-text-4); margin:0;">{c.lat!.toFixed(6)}, {c.lng!.toFixed(6)}</p>
				<a href="https://www.google.com/maps/dir/?api=1&destination={c.lat},{c.lng}" target="_blank" rel="noopener noreferrer"
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; white-space:nowrap; transition:all 0.15s; font-family:'DM Sans',sans-serif; flex-shrink:0;"
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
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.catchComboLabel}</p>
				<a href="/tackle/combos/{c.combo.id}"
					style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
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
						<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.catchLureLabel}</p>
						<a href="/lures/{c.lure.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{lureName(c.lure)}
						</a>
					</div>
				{/if}
				{#if nearbySpot}
					<div>
						<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.catchSpotLabel}</p>
						<a href="/spots/{nearbySpot.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:7px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
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
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.biteIndex}</p>
				<div style="display:flex; align-items:center; gap:14px;">
					<div style="flex:1;">
						<div style="background:var(--of-border-subtle); border-radius:4px; height:5px; margin-bottom:6px;">
							<div style="background:{biteColor(c.biteIndex)}; border-radius:4px; height:5px; width:{c.biteIndex * 10}%;"></div>
						</div>
						<span style="font-size:0.78rem; font-weight:600; color:{biteColor(c.biteIndex)};">{biteRating(c.biteIndex)}</span>
					</div>
					<span style="font-family:'JetBrains Mono',monospace; font-size:1.6rem; font-weight:700; color:{biteColor(c.biteIndex)}; line-height:1; flex-shrink:0;">{c.biteIndex}</span>
				</div>
			</div>
		{/if}

		<!-- Retrieve style -->
		{#if c.presentation}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.presentation}</p>
				<span style="display:inline-block; padding:5px 14px; background:var(--of-accent-bg); border:1px solid var(--of-accent-border); border-radius:20px; font-size:0.875rem; color:var(--of-accent); font-weight:500;">{c.presentation}</span>
			</div>
		{/if}

		<!-- Notes -->
		{#if c.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.notes}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{c.notes}</p>
			</div>
		{/if}

		<!-- Edit -->
		<div style="display:flex; gap:8px; padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:16px;">
			<a href="/catches/{c.id}/edit"
				style="display:inline-block; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				{t.edit}
			</a>
		</div>

		<!-- Share link management -->
		{#if authEnabled}
			<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:16px;">
				<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--of-text-4); margin:0 0 10px; display:flex; align-items:center; gap:6px;">
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					{t.shareLink}
				</p>
				{#if shareUrl}
					<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
						<input type="text" value={shareUrl} readonly
							style="flex:1; min-width:0; background:var(--of-bg-base); border:1px solid var(--of-border-subtle); border-radius:8px; color:var(--of-text-2); font-family:'JetBrains Mono',monospace; font-size:0.72rem; padding:7px 10px; outline:none;" />
						<button onclick={copyShare}
							style="background:{copied ? 'var(--of-success-bg)' : 'var(--of-bg-elevated)'}; color:{copied ? 'var(--of-success)' : 'var(--of-text-2)'}; border:1px solid {copied ? 'var(--of-success-border)' : 'var(--of-border)'}; font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; transition:all 0.15s; font-family:'DM Sans',sans-serif;">
							{copied ? t.shareCopied : t.shareCopy}
						</button>
						<button onclick={revokeShare}
							style="background:var(--of-bg-elevated); color:var(--of-danger); border:1px solid var(--of-danger-bg); font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-bg)';}}>
							{t.shareRevoke}
						</button>
					</div>
					<p style="font-size:0.72rem; color:var(--of-text-4); margin:0;">{t.sharePublicNote}</p>
				{:else}
					<button onclick={createShare}
						style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
						{t.shareGenerate}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
