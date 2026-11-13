<script lang="ts">
	import { setupMapGestures } from '#lib/mapGestures.js';
	import { addBaseTiles, addMapControls, STATIC_PIN } from '#lib/mapTiles.js';
	import { onMount, onDestroy } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import { readPhotoMeta, toDatetimeLocal } from '#lib/photoMeta.js';
	import { sortByUsage } from '#lib/catchForm.js';
	import LurePicker from '#lib/components/LurePicker.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t, lures, combos, quickLureIds, presentationCounts, lastLocation, spots } = $derived(data);
	// Retrieve styles the angler uses most come first.
	const presentationOptions = $derived(sortByUsage(t.lurePresentations, presentationCounts));
	let lureId = $state('');
	let comboId = $state('');
	let presentation = $state('');
	let catchAndRelease = $state(false);
	// What's set inside the folded "More details", so it's visible while collapsed.
	const moreSummary = $derived(
		[combos.find((c) => c.id === comboId)?.name, presentation, catchAndRelease ? t.catchAndRelease : '']
			.filter(Boolean)
			.join(' · ')
	);

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let marker: any = null;
	let L: any = null;
	let pinIcon: any = null;
	let lat = $state<number | null>(null);
	let lng = $state<number | null>(null);
	let locating = $state(false);
	let locationError = $state(false);

	let photoInput: HTMLInputElement;
	let photoPreviews = $state<string[]>([]);
	let photoFiles = $state<File[]>([]);
	let caughtAt = $state('');
	let dateTouched = $state(false);
	// Location + capture time read from an added photo's EXIF. Each is auto-applied only while
	// the user hasn't set that field themselves; otherwise a "Use photo …" button offers it (#37).
	let photoCoords = $state<{ lat: number; lng: number; file: File } | null>(null);
	let photoTakenAt = $state<{ value: string; file: File } | null>(null);
	let locationFromPhoto = $state(false);
	let timeFromPhoto = $state(false);
	let speciesValue = $state('');
	let identifyLoading = $state(false);
	let identifyResult = $state<{ species: string | null; confidence: number | null; note: string } | null>(null);

	onMount(async () => {
		caughtAt = toDatetimeLocal(new Date());

		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl, { zoomControl: false });

		setupMapGestures(mapInstance, mapEl, t.mapTwoFingerHint);
		addBaseTiles(L, mapInstance, data.mapTiles);
		addMapControls(L, mapInstance, t);

		// Default view up front so the map never stays grey while geolocation is pending,
		// denied, or the permission prompt is ignored (#104). Start where the angler last
		// fished (latest catch, else a saved spot) rather than a continent-wide view.
		if (lastLocation) mapInstance.setView([lastLocation.lat, lastLocation.lng], 13);
		else mapInstance.setView([51, 10], 5);
		requestAnimationFrame(() => mapInstance.invalidateSize());

		mapInstance.on('click', (e: any) => placeMarker(e.latlng.lat, e.latlng.lng));

		// Auto-locate on mount (non-explicit: just pan, don't place marker — and never pan
		// away from a marker that's already placed, e.g. from photo GPS)
		if (navigator.geolocation) {
			locating = true;
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					locating = false;
					if (lat === null) mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 14);
				},
				() => { locating = false; },
				{ timeout: 8000 }
			);
		}
	});

	function handleLocateClick() {
		if (!navigator.geolocation || !mapInstance) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				locating = false;
				placeMarker(pos.coords.latitude, pos.coords.longitude);
				mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15);
			},
			() => { locating = false; },
			{ timeout: 8000 }
		);
	}

	function placeMarker(la: number, ln: number) {
		lat = la; lng = ln;
		locationError = false;
		locationFromPhoto = false;
		if (marker) marker.remove();
		marker = L.marker([la, ln], { icon: pinIcon, ...STATIC_PIN }).addTo(mapInstance);
	}

	function usePhotoLocation() {
		if (!photoCoords || !mapInstance) return;
		placeMarker(photoCoords.lat, photoCoords.lng);
		mapInstance.setView([photoCoords.lat, photoCoords.lng], 15);
		locationFromPhoto = true;
	}

	function useSavedSpot(e: Event) {
		const sel = e.currentTarget as HTMLSelectElement;
		const s = spots.find((sp) => sp.id === sel.value);
		sel.value = '';
		if (!s || !mapInstance) return;
		placeMarker(s.lat, s.lng);
		mapInstance.setView([s.lat, s.lng], 15);
	}

	function usePhotoTime() {
		if (!photoTakenAt) return;
		caughtAt = photoTakenAt.value;
		timeFromPhoto = true;
	}

	function handleDateInput() {
		dateTouched = true;
		timeFromPhoto = false;
	}

	async function readMetaFromPhotos(files: File[]) {
		for (const file of files) {
			if (photoCoords && photoTakenAt) return;
			const meta = await readPhotoMeta(file);
			if (!photoCoords && meta.lat !== null && meta.lng !== null) {
				photoCoords = { lat: meta.lat, lng: meta.lng, file };
				if (lat === null) usePhotoLocation();
			}
			if (!photoTakenAt && meta.takenAt) {
				photoTakenAt = { value: toDatetimeLocal(meta.takenAt), file };
				if (!dateTouched) usePhotoTime();
			}
		}
	}

	function handlePhotoChange(e: Event) {
		const files = Array.from((e.target as HTMLInputElement).files ?? []);
		const added: File[] = [];
		for (const file of files) {
			if (!photoFiles.find(f => f.name === file.name && f.size === file.size)) {
				photoFiles = [...photoFiles, file];
				photoPreviews = [...photoPreviews, URL.createObjectURL(file)];
				added.push(file);
			}
		}
		photoInput.value = '';
		readMetaFromPhotos(added);
	}

	function removePhoto(i: number) {
		if (photoCoords?.file === photoFiles[i]) photoCoords = null;
		if (photoTakenAt?.file === photoFiles[i]) photoTakenAt = null;
		URL.revokeObjectURL(photoPreviews[i]);
		photoPreviews = photoPreviews.filter((_, idx) => idx !== i);
		photoFiles = photoFiles.filter((_, idx) => idx !== i);
		identifyResult = null;
	}

	async function identifyFish() {
		if (photoFiles.length === 0 || identifyLoading) return;
		identifyLoading = true;
		identifyResult = null;
		try {
			const imageData = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(photoFiles[0]);
			});
			const res = await fetch('/api/identify-fish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageData })
			});
			if (!res.ok) throw new Error(`Error ${res.status}`);
			identifyResult = await res.json();
		} catch {
			identifyResult = { species: null, confidence: null, note: t.identifyError };
		} finally {
			identifyLoading = false;
		}
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

	onDestroy(() => { mapInstance?.remove(); });

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.8125rem; font-weight:500; color:var(--of-text-2); margin-bottom:6px; ";
	const selectStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; cursor:pointer;";

	function focusInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = 'var(--of-accent-solid)';
		el.style.boxShadow = '0 0 0 3px var(--of-accent-glow)';
	}
	function blurInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = 'var(--of-border)';
		el.style.boxShadow = 'none';
	}
</script>

<div style="max-width:560px; margin:0 auto;">
	<h1 style="font-family:'DM Sans',sans-serif; font-weight:500; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0 0 20px;">{t.catchNewTitle}</h1>
	{#if form?.error}
		<div role="alert" style="margin-bottom:16px; background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}
		class="of-panel" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">

		<input bind:this={photoInput} type="file" name="photos" accept="image/*" multiple class="hidden" onchange={handlePhotoChange} />
		<input type="hidden" name="lat" value={lat ?? ''} />
		<input type="hidden" name="lng" value={lng ?? ''} />

		<!-- Photos -->
		<div>
			<p style={labelStyle}>{t.spotPhotosLabel}</p>

			{#if photoPreviews.length > 0}
				<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
					{#each photoPreviews as src, i}
						<div style="position:relative; width:88px; height:66px; border-radius:8px; overflow:hidden; border:1px solid var(--of-border);">
							<img {src} alt="" style="width:100%; height:100%; object-fit:cover;" />
							<button aria-label={t.removePhoto} type="button" onclick={() => removePhoto(i)}
								class="of-hit" style="position:absolute; top:3px; right:3px; background:rgba(0,0,0,0.6); border:none; color:var(--of-text-bright); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; line-height:1;"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
						</div>
					{/each}
				</div>
			{/if}

			<button type="button" onclick={() => photoInput.click()}
				class="of-touch"
				style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--of-bg-elevated); border:1px dashed var(--of-border); border-radius:9px; color:var(--of-text-3); font-size:0.8125rem; font-weight:500; cursor:pointer; transition:var(--of-transition); font-family:'DM Sans',sans-serif; width:100%; justify-content:center;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
			>
				<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
					<path d="M7.5 1.5v9M4 7l3.5 3.5L11 7M2 12.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				{t.catchAddPhotos}
			</button>
		</div>

		<div style="height:1px; background:var(--of-border-subtle); margin:-4px 0;"></div>

		<!-- Species -->
		<div>
			<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
				<label style="font-size:0.8125rem; font-weight:500; color:var(--of-text-2); margin:0;" for="species">
					{t.catchSpeciesLabel} <span style="color:var(--of-danger);">*</span>
				</label>
				{#if photoFiles.length > 0}
					<button type="button" onclick={identifyFish} disabled={identifyLoading}
						class="of-linkbtn"
						style="display:flex; align-items:center; gap:5px; font-size:0.75rem; font-weight:500; color:{identifyLoading ? 'var(--of-text-4)' : 'var(--of-accent)'}; background:none; border:none; cursor:{identifyLoading ? 'default' : 'pointer'}; padding:0; font-family:'DM Sans',sans-serif; transition:color 0.15s;"
					>
						{#if identifyLoading}
							<svg class="of-busy" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="animation:spin 1s linear infinite;flex-shrink:0;">
								<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/>
							</svg>
						{:else}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
								<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
								<path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
								<path d="M8 11h6M11 8v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
							</svg>
						{/if}
						{identifyLoading ? t.identifying : t.identifyFish}
					</button>
				{/if}
			</div>
			<input id="species" name="species" type="text" placeholder={t.speciesPlaceholder}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} required
				bind:value={speciesValue} />
			{#if identifyResult}
				<div style="margin-top:8px; padding:10px 12px; background:var(--of-bg-overlay); border:1px solid {identifyResult.species ? 'var(--of-accent-bg-hover)' : 'var(--of-bg-hover)'}; border-radius:9px;">
					{#if identifyResult.species}
						<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
							<span style="font-size:0.8125rem; font-weight:600; color:var(--of-accent); font-family:'DM Sans',sans-serif;">
								{identifyResult.species}{identifyResult.confidence !== null ? ` · ${identifyResult.confidence}%` : ''}
							</span>
							<button type="button" onclick={() => { speciesValue = identifyResult!.species!; }}
								class="of-tap"
								style="font-size:0.75rem; font-weight:600; padding:3px 10px; border-radius:6px; background:var(--of-accent-bg-hover); border:1px solid var(--of-accent-border); color:var(--of-accent); cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
							>{t.identifyUseSpecies}</button>
						</div>
					{:else}
						<p style="font-size:0.8125rem; font-weight:500; color:var(--of-text-3); margin:0 0 4px; font-family:'DM Sans',sans-serif;">{t.identifyNoResult}</p>
					{/if}
					{#if identifyResult.note}
						<p style="font-size:0.75rem; color:var(--of-text-4); margin:0; font-family:'DM Sans',sans-serif; line-height:1.4;">{identifyResult.note}</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Length + Weight -->
		<div class="of-grid-pair">
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

		<!-- Lure: recent + favourite tiles, full list as fallback -->
		<LurePicker {lures} {quickLureIds} bind:value={lureId} {t} />

		<!-- Catch location map -->
		<div>
			<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
				<p style="{labelStyle}flex-shrink:0;{locationError ? 'color:var(--of-danger);' : ''}">{t.spotLocationLabel} <span style="color:var(--of-danger);">*</span></p>
				<div style="display:flex; align-items:center; gap:6px 14px; flex-wrap:wrap; justify-content:flex-end;">
					{#if photoCoords && !locationFromPhoto}
						<button type="button" onclick={usePhotoLocation}
							class="of-linkbtn"
							style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:600; color:var(--of-accent); background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif;"
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
								<rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
								<circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="1.8"/>
								<path d="M8 6l1.5-2h5L16 6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
							</svg>
							{t.usePhotoLocation}
						</button>
					{/if}
					<button type="button" onclick={handleLocateClick}
						class="of-linkbtn"
						style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:600; color:{locating ? 'var(--of-text-3)' : 'var(--of-accent)'}; background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif;"
						disabled={locating}
					>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
							<path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						</svg>
						{locating ? t.spotLocating : t.spotUseMyLocation}
					</button>
				</div>
			</div>

			{#if locationError}
				<p style="font-size:0.8125rem; color:var(--of-danger); margin:0 0 8px;">{t.spotLocationRequired}</p>
			{/if}

			<div style="border-radius:10px; overflow:hidden; border:2px solid {locationError ? 'var(--of-danger-border)' : lat !== null ? 'var(--of-accent-border)' : 'var(--of-border)'};">
				<div bind:this={mapEl} style="height:260px;"></div>
			</div>

			{#if lat !== null}
				<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin:6px 0 0;">
					<span style="font-size:0.75rem; color:var(--of-accent);">{locationFromPhoto ? t.photoLocationApplied : ''}</span>
					<p style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-text-3); margin:0; text-align:right;">
						{lat.toFixed(6)}, {lng?.toFixed(6)}
					</p>
				</div>
			{:else}
				<p class="of-when-mouse" style="font-size:0.8125rem; color:var(--of-text-4); margin:6px 0 0; text-align:center;">{t.spotClickToPlace}</p>
				<p class="of-when-touch" style="font-size:0.8125rem; color:var(--of-text-4); margin:6px 0 0; text-align:center;">{t.spotTapToPlace}</p>
			{/if}

			{#if spots.length > 0}
				<select aria-label={t.catchSavedSpotPlaceholder} onchange={useSavedSpot}
					style="{selectStyle} margin-top:10px;" onfocus={focusInput} onblur={blurInput}>
					<option value="">{t.catchSavedSpotPlaceholder}…</option>
					{#each spots as s (s.id)}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Caught at (prefilled with now, or the photo's capture time) -->
		<div>
			<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
				<label style="font-size:0.8125rem; font-weight:500; color:var(--of-text-2); margin:0;" for="caught_at">{t.catchDateLabel}</label>
				{#if photoTakenAt && !timeFromPhoto}
					<button type="button" onclick={usePhotoTime}
						class="of-linkbtn"
						style="display:flex; align-items:center; gap:5px; font-size:0.75rem; font-weight:600; color:var(--of-accent); background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif;"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
							<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
							<path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						</svg>
						{t.usePhotoTime}
					</button>
				{:else if timeFromPhoto}
					<span style="font-size:0.75rem; color:var(--of-accent);">{t.photoTimeApplied}</span>
				{/if}
			</div>
			<input id="caught_at" name="caught_at" type="datetime-local" bind:value={caughtAt} oninput={handleDateInput}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>

		<!-- Secondary fields: folded so the essentials fit the first screens -->
		<details class="of-more">
			<summary>
				<span>{t.catchMoreDetails}</span>
				{#if moreSummary}<span class="of-more__summary">{moreSummary}</span>{/if}
				<svg class="of-more__chevron" width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4.5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</summary>
			<div class="of-more__body">

		<!-- Combo -->
		<div>
			<label style={labelStyle} for="combo_id">{t.catchComboLabel}</label>
			<select id="combo_id" name="combo_id" aria-describedby="combo-hint" bind:value={comboId} style={selectStyle} onfocus={focusInput} onblur={blurInput}>
				<option value="">— {t.catchNoCombo} —</option>
				{#each combos as c}
					<option value={c.id}>{c.name}{c.rod ? ` · ${c.rod.model}` : ''}{c.reel ? ` · ${c.reel.model}` : ''}</option>
				{/each}
			</select>
			<p id="combo-hint" style="font-size:0.75rem; color:var(--of-text-4); margin:6px 0 0; line-height:1.45;">{t.comboHint}</p>
		</div>

		<!-- Retrieve style (Köderführung) -->
		<div>
			<p id="presentation-label" style={labelStyle}>{t.presentation}</p>
			<p id="presentation-hint" style="font-size:0.75rem; color:var(--of-text-4); margin:-2px 0 8px; line-height:1.45;">{t.presentationHint}</p>
			<input type="hidden" name="presentation" value={presentation} />
			<div role="group" aria-labelledby="presentation-label" aria-describedby="presentation-hint" style="display:flex; flex-wrap:wrap; gap:6px;">
				{#each presentationOptions as style}
					<button type="button" onclick={() => presentation = presentation === style ? '' : style}
						aria-pressed={presentation === style}
						class="of-touch"
						style="padding:6px 13px; border-radius:20px; font-size:0.8125rem; font-weight:500; border:1px solid; cursor:pointer; transition:var(--of-transition); font-family:'DM Sans',sans-serif;
							{presentation === style
								? 'background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);'
								: 'background:var(--of-bg-elevated); border-color:var(--of-border); color:var(--of-text-3);'}"
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
				aria-pressed={catchAndRelease}
				class="of-touch"
				style="display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:9px; border:1px solid; cursor:pointer; font-size:0.875rem; font-weight:600; font-family:'DM Sans',sans-serif; transition:var(--of-transition);
					{catchAndRelease
						? 'background:var(--of-accent-bg-hover); border-color:var(--of-accent-border); color:var(--of-accent);'
						: 'background:var(--of-bg-elevated); border-color:var(--of-border); color:var(--of-text-3);'}"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
					<path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 12c1-2 3-3 4-1s3 3 4 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<path d="M15 8l1-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				{t.catchAndRelease}
			</button>
		</div>

			</div>
		</details>

		<!-- Actions -->
		<div class="of-actions" style="display:flex; gap:10px; padding-top:16px; border-top:1px solid var(--of-border-subtle);">
			<button type="submit" class="of-primary"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.catchSave}</button>
			<a href="/catches"
				style="display:inline-flex; align-items:center; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)'; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
			>{t.cancel}</a>
		</div>
	</form>
</div>

<style>
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
