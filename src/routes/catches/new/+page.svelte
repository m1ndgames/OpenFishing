<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t, lures } = data;

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let marker: any = null;
	let lat = $state<number | null>(null);
	let lng = $state<number | null>(null);
	let locating = $state(false);
	let locationError = $state(false);

	let photoInput: HTMLInputElement;
	let photoPreviews = $state<string[]>([]);
	let photoFiles = $state<File[]>([]);
	let defaultDatetime = $state('');
	let catchAndRelease = $state(false);
	let presentation = $state('');

	onMount(async () => {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		defaultDatetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

		const L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#06b6d4"/><circle cx="14" cy="14" r="5" fill="#030a12"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl, { zoomControl: true });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);

		requestAnimationFrame(() => mapInstance.invalidateSize());

		mapInstance.on('click', (e: any) => placeMarker(L, pinIcon, e.latlng.lat, e.latlng.lng));

		// Auto-locate on mount (non-explicit: just pan, don't place marker)
		if (navigator.geolocation) {
			locating = true;
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					locating = false;
					mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 14);
				},
				() => { locating = false; mapInstance.setView([51, 10], 5); },
				{ timeout: 8000 }
			);
		} else {
			mapInstance.setView([51, 10], 5);
		}
	});

	async function handleLocateClick() {
		if (!navigator.geolocation) return;
		const L = (await import('leaflet')).default;
		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#06b6d4"/><circle cx="14" cy="14" r="5" fill="#030a12"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				locating = false;
				placeMarker(L, pinIcon, pos.coords.latitude, pos.coords.longitude);
				mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15);
			},
			() => { locating = false; },
			{ timeout: 8000 }
		);
	}

	function placeMarker(L: any, icon: any, la: number, ln: number) {
		lat = la; lng = ln;
		locationError = false;
		if (marker) marker.remove();
		marker = L.marker([la, ln], { icon }).addTo(mapInstance);
	}

	function handlePhotoChange(e: Event) {
		const files = Array.from((e.target as HTMLInputElement).files ?? []);
		for (const file of files) {
			if (!photoFiles.find(f => f.name === file.name && f.size === file.size)) {
				photoFiles = [...photoFiles, file];
				photoPreviews = [...photoPreviews, URL.createObjectURL(file)];
			}
		}
		photoInput.value = '';
	}

	function removePhoto(i: number) {
		URL.revokeObjectURL(photoPreviews[i]);
		photoPreviews = photoPreviews.filter((_, idx) => idx !== i);
		photoFiles = photoFiles.filter((_, idx) => idx !== i);
	}

	function handleSubmit(e: SubmitEvent) {
		if (lat === null || lng === null) {
			e.preventDefault();
			locationError = true;
			mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}
		const dt = new DataTransfer();
		for (const f of photoFiles) dt.items.add(f);
		photoInput.files = dt.files;
	}

	function lureName(l: { lureNumber: number | null; name: string }) {
		return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
	}

	onDestroy(() => { mapInstance?.remove(); });

	const inputStyle = "width:100%; padding:9px 12px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.78rem; font-weight:500; color:#5d8fa8; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;";
	const selectStyle = "width:100%; padding:9px 12px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; cursor:pointer;";

	function focusInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = '#06b6d4';
		el.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)';
	}
	function blurInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = '#243f5e';
		el.style.boxShadow = 'none';
	}
</script>

<div style="max-width:560px; margin:0 auto;">
	{#if form?.error}
		<div style="margin-bottom:16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}
		style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">

		<input bind:this={photoInput} type="file" name="photos" accept="image/*" multiple class="hidden" onchange={handlePhotoChange} />
		<input type="hidden" name="lat" value={lat ?? ''} />
		<input type="hidden" name="lng" value={lng ?? ''} />

		<!-- Photos -->
		<div>
			<label style={labelStyle}>{t.spotPhotosLabel}</label>

			{#if photoPreviews.length > 0}
				<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
					{#each photoPreviews as src, i}
						<div style="position:relative; width:88px; height:66px; border-radius:8px; overflow:hidden; border:1px solid #243f5e;">
							<img {src} alt="" style="width:100%; height:100%; object-fit:cover;" />
							<button type="button" onclick={() => removePhoto(i)}
								style="position:absolute; top:3px; right:3px; background:rgba(0,0,0,0.6); border:none; color:#EDF5FA; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.65rem; line-height:1;">✕</button>
						</div>
					{/each}
				</div>
			{/if}

			<button type="button" onclick={() => photoInput.click()}
				style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:#0f2238; border:1px dashed #243f5e; border-radius:9px; color:#5d8fa8; font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; width:100%; justify-content:center;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#5d8fa8';}}
			>
				<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
					<path d="M7.5 1.5v9M4 7l3.5 3.5L11 7M2 12.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				{t.catchAddPhotos}
			</button>
		</div>

		<div style="height:1px; background:#172f4a; margin:-4px 0;"></div>

		<!-- Date & Species -->
		<div>
			<label style={labelStyle} for="caught_at">{t.catchDateLabel}</label>
			<input id="caught_at" name="caught_at" type="datetime-local" value={defaultDatetime}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>

		<div>
			<label style={labelStyle} for="species">{t.catchSpeciesLabel} <span style="color:#f87171;">*</span></label>
			<input id="species" name="species" type="text" placeholder="e.g. Pike, Perch, Trout"
				style={inputStyle} onfocus={focusInput} onblur={blurInput} required />
		</div>

		<!-- Length + Weight -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="length_cm">{t.catchLengthLabel}</label>
				<input id="length_cm" name="length_cm" type="number" min="0" step="0.1" placeholder="0"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="weight_g">{t.catchWeightLabel}</label>
				<input id="weight_g" name="weight_g" type="number" min="0" step="1" placeholder="0"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Catch location map -->
		<div>
			<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
				<p style="{labelStyle}{locationError ? 'color:#f87171;' : ''}">{t.spotLocationLabel} <span style="color:#f87171;">*</span></p>
				<button type="button" onclick={handleLocateClick}
					style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:600; color:{locating ? '#5d8fa8' : '#22d3ee'}; background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif;"
					disabled={locating}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
						<path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
					{locating ? t.spotLocating : t.spotUseMyLocation}
				</button>
			</div>

			{#if locationError}
				<p style="font-size:0.8rem; color:#f87171; margin:0 0 8px;">{t.spotLocationRequired}</p>
			{/if}

			<div style="border-radius:10px; overflow:hidden; border:2px solid {locationError ? 'rgba(239,68,68,0.5)' : lat !== null ? 'rgba(6,182,212,0.3)' : '#243f5e'};">
				<div bind:this={mapEl} style="height:260px;"></div>
			</div>

			{#if lat !== null}
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:#5d8fa8; margin:6px 0 0; text-align:right;">
					{lat.toFixed(6)}, {lng?.toFixed(6)}
				</p>
			{:else}
				<p style="font-size:0.78rem; color:#3d6a84; margin:6px 0 0; text-align:center;">{t.spotClickToPlace}</p>
			{/if}
		</div>

		<!-- Lure -->
		<div>
			<label style={labelStyle} for="lure_id">{t.catchLureLabel}</label>
			<select id="lure_id" name="lure_id" style={selectStyle} onfocus={focusInput} onblur={blurInput}>
				<option value="">— {t.catchNoLure} —</option>
				{#each lures as l}
					<option value={l.id}>{lureName(l)}</option>
				{/each}
			</select>
		</div>

		<!-- Retrieve style (Köderführung) -->
		<div>
			<label style={labelStyle}>{t.presentation}</label>
			<input type="hidden" name="presentation" value={presentation} />
			<div style="display:flex; flex-wrap:wrap; gap:6px;">
				{#each t.lurePresentations as style}
					<button type="button" onclick={() => presentation = presentation === style ? '' : style}
						style="padding:6px 13px; border-radius:20px; font-size:0.8rem; font-weight:500; border:1px solid; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;
							{presentation === style
								? 'background:rgba(6,182,212,0.14); border-color:rgba(6,182,212,0.5); color:#22d3ee;'
								: 'background:#0f2238; border-color:#243f5e; color:#5d8fa8;'}"
					>{style}</button>
				{/each}
			</div>
		</div>

		<!-- Notes -->
		<div>
			<label style={labelStyle} for="notes">{t.notes}</label>
			<textarea id="notes" name="notes" rows="3" placeholder={t.catchNotesPlaceholder}
				style="{inputStyle} resize:none; min-height:90px;"
				onfocus={focusInput} onblur={blurInput}></textarea>
		</div>

		<!-- Catch & Release toggle -->
		<div>
			<input type="hidden" name="catchAndRelease" value={catchAndRelease ? '1' : '0'} />
			<button
				type="button"
				onclick={() => catchAndRelease = !catchAndRelease}
				style="display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:9px; border:1px solid; cursor:pointer; font-size:0.875rem; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.15s;
					{catchAndRelease
						? 'background:rgba(6,182,212,0.12); border-color:rgba(6,182,212,0.5); color:#22d3ee;'
						: 'background:#0f2238; border-color:#243f5e; color:#5d8fa8;'}"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
					<path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 12c1-2 3-3 4-1s3 3 4 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<path d="M15 8l1-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				{t.catchAndRelease}
			</button>
		</div>

		<!-- Actions -->
		<div style="display:flex; gap:10px; padding-top:4px; border-top:1px solid #172f4a; margin-top:-4px;">
			<button type="submit"
				style="background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.catchSave}</button>
			<a href="/catches"
				style="display:inline-flex; align-items:center; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#132841'; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#0f2238'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
			>{t.cancel}</a>
		</div>
	</form>
</div>
