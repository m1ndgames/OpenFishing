<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t, catch: c, lures, combos } = data;

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let marker: any = null;
	let lat = $state<number | null>(c.lat ?? null);
	let lng = $state<number | null>(c.lng ?? null);
	let locating = $state(false);
	let locationError = $state(false);

	let photoInput: HTMLInputElement;
	let photoPreviews = $state<string[]>([]);
	let photoFiles = $state<File[]>([]);
	let removedPhotoIds = $state<string[]>([]);
	let catchAndRelease = $state(c.catchAndRelease ?? false);
	let presentation = $state(c.presentation ?? '');

	function toDatetimeLocal(d: Date) {
		const date = new Date(d);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	onMount(async () => {
		const L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});

		mapInstance = L.map(mapEl, { zoomControl: true });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);

		if (lat !== null && lng !== null) {
			mapInstance.setView([lat, lng], 15);
			marker = L.marker([lat, lng], { icon: pinIcon }).addTo(mapInstance);
		} else {
			mapInstance.setView([51, 10], 5);
			if (navigator.geolocation) {
				locating = true;
				navigator.geolocation.getCurrentPosition(
					(pos) => { locating = false; mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 14); },
					() => { locating = false; },
					{ timeout: 8000 }
				);
			}
		}

		requestAnimationFrame(() => mapInstance.invalidateSize());
		mapInstance.on('click', (e: any) => placeMarker(L, pinIcon, e.latlng.lat, e.latlng.lng));
	});

	async function handleLocateClick() {
		if (!navigator.geolocation) return;
		const L = (await import('leaflet')).default;
		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
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

	function removeNewPhoto(i: number) {
		URL.revokeObjectURL(photoPreviews[i]);
		photoPreviews = photoPreviews.filter((_, idx) => idx !== i);
		photoFiles = photoFiles.filter((_, idx) => idx !== i);
	}

	function toggleRemoveExisting(id: string) {
		if (removedPhotoIds.includes(id)) {
			removedPhotoIds = removedPhotoIds.filter(x => x !== id);
		} else {
			removedPhotoIds = [...removedPhotoIds, id];
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

	function lureName(l: { lureNumber: number | null; name: string }) {
		return l.lureNumber ? `#${String(l.lureNumber).padStart(4, '0')} ${l.name}` : l.name;
	}

	onDestroy(() => { mapInstance?.remove(); });

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;";
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
	<div style="margin-bottom:24px; display:flex; align-items:center; gap:12px;">
		<a href="/catches/{c.id}" style="color:var(--of-text-4); font-size:0.875rem; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-4)';}}
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{t.back}
		</a>
		<h1 style="font-family:'Carter One',sans-serif; font-weight:800; font-size:1.5rem; color:var(--of-text-bright); margin:0;">{t.catchEditTitle}</h1>
	</div>

	{#if form?.error}
		<div style="margin-bottom:16px; background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<form method="POST" action="?/update" enctype="multipart/form-data" onsubmit={handleSubmit}
		style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">

		<input bind:this={photoInput} type="file" name="new_photos" accept="image/*" multiple class="hidden" onchange={handlePhotoChange} />
		<input type="hidden" name="lat" value={lat ?? ''} />
		<input type="hidden" name="lng" value={lng ?? ''} />
		{#each removedPhotoIds as id}
			<input type="hidden" name="remove_photo" value={id} />
		{/each}

		<!-- Photos -->
		<div>
			<label style={labelStyle}>{t.spotPhotosLabel}</label>

			{#if c.photos.length > 0 || photoPreviews.length > 0}
				<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
					{#each c.photos as photo}
						{@const removing = removedPhotoIds.includes(photo.id)}
						<div style="position:relative; width:88px; height:66px; border-radius:8px; overflow:hidden; border:1px solid {removing ? 'var(--of-danger-border)' : 'var(--of-border)'}; opacity:{removing ? 0.4 : 1}; transition:opacity 0.15s;">
							<img src="/uploads/{photo.filename}" alt="" style="width:100%; height:100%; object-fit:cover;" />
							<button type="button" onclick={() => toggleRemoveExisting(photo.id)}
								style="position:absolute; top:3px; right:3px; background:{removing ? 'rgba(239,68,68,0.8)' : 'rgba(0,0,0,0.6)'}; border:none; color:var(--of-text-bright); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.65rem; line-height:1;">✕</button>
						</div>
					{/each}
					{#each photoPreviews as src, i}
						<div style="position:relative; width:88px; height:66px; border-radius:8px; overflow:hidden; border:1px solid var(--of-accent-border);">
							<img {src} alt="" style="width:100%; height:100%; object-fit:cover;" />
							<button type="button" onclick={() => removeNewPhoto(i)}
								style="position:absolute; top:3px; right:3px; background:rgba(0,0,0,0.6); border:none; color:var(--of-text-bright); border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.65rem; line-height:1;">✕</button>
						</div>
					{/each}
				</div>
			{/if}

			<button type="button" onclick={() => photoInput.click()}
				style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--of-bg-elevated); border:1px dashed var(--of-border); border-radius:9px; color:var(--of-text-3); font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; width:100%; justify-content:center;"
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

		<!-- Date & Species -->
		<div>
			<label style={labelStyle} for="caught_at">{t.catchDateLabel}</label>
			<input id="caught_at" name="caught_at" type="datetime-local" value={toDatetimeLocal(c.caughtAt)}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>

		<div>
			<label style={labelStyle} for="species">{t.catchSpeciesLabel} <span style="color:var(--of-danger);">*</span></label>
			<input id="species" name="species" type="text" value={c.species ?? ''}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} required />
		</div>

		<!-- Length + Weight -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="length_cm">{t.catchLengthLabel}</label>
				<input id="length_cm" name="length_cm" type="number" min="0" step="0.1" value={c.lengthCm ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="weight_g">{t.catchWeightLabel}</label>
				<input id="weight_g" name="weight_g" type="number" min="0" step="1" value={c.weightG ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Location map -->
		<div>
			<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
				<p style="{labelStyle}{locationError ? 'color:var(--of-danger);' : ''}">{t.spotLocationLabel} <span style="color:var(--of-danger);">*</span></p>
				<button type="button" onclick={handleLocateClick}
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

			{#if locationError}
				<p style="font-size:0.8rem; color:var(--of-danger); margin:0 0 8px;">{t.spotLocationRequired}</p>
			{/if}

			<div style="border-radius:10px; overflow:hidden; border:2px solid {locationError ? 'var(--of-danger-border)' : lat !== null ? 'var(--of-accent-border)' : 'var(--of-border)'};">
				<div bind:this={mapEl} style="height:260px;"></div>
			</div>

			{#if lat !== null}
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--of-text-3); margin:6px 0 0; text-align:right;">
					{lat.toFixed(6)}, {lng?.toFixed(6)}
				</p>
			{:else}
				<p style="font-size:0.78rem; color:var(--of-text-4); margin:6px 0 0; text-align:center;">{t.spotClickToPlace}</p>
			{/if}
		</div>

		<!-- Lure -->
		<div>
			<label style={labelStyle} for="lure_id">{t.catchLureLabel}</label>
			<select id="lure_id" name="lure_id" style={selectStyle} onfocus={focusInput} onblur={blurInput}>
				<option value="" selected={!c.lureId}>— {t.catchNoLure} —</option>
				{#each lures as l}
					<option value={l.id} selected={c.lureId === l.id}>{lureName(l)}</option>
				{/each}
			</select>
		</div>

		<!-- Combo -->
		<div>
			<label style={labelStyle} for="combo_id">{t.catchComboLabel}</label>
			<select id="combo_id" name="combo_id" style={selectStyle} onfocus={focusInput} onblur={blurInput}>
				<option value="" selected={!c.comboId}>— {t.catchNoCombo} —</option>
				{#each combos as combo}
					<option value={combo.id} selected={c.comboId === combo.id}>{combo.name}{combo.rod ? ` · ${combo.rod.model}` : ''}{combo.reel ? ` · ${combo.reel.model}` : ''}</option>
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
								? 'background:rgba(6,182,212,0.14); border-color:var(--of-accent-border); color:var(--of-accent);'
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
				onfocus={focusInput} onblur={blurInput}>{c.notes ?? ''}</textarea>
		</div>

		<!-- Catch & Release toggle -->
		<div>
			<input type="hidden" name="catchAndRelease" value={catchAndRelease ? '1' : '0'} />
			<button
				type="button"
				onclick={() => catchAndRelease = !catchAndRelease}
				style="display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border-radius:9px; border:1px solid; cursor:pointer; font-size:0.875rem; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.15s;
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

		<!-- Save / Cancel -->
		<div style="display:flex; justify-content:space-between; gap:10px; padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:8px;">
			<button type="submit"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.catchSaveChanges}</button>
			<a href="/catches/{c.id}"
				style="display:inline-flex; align-items:center; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)'; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
			>{t.cancel}</a>
		</div>
	</form>

	<!-- Delete -->
	<form method="POST" action="?/delete" style="margin-top:12px;"
		onsubmit={(e) => { if (!confirm(t.catchDeleteConfirm)) e.preventDefault(); }}>
		<button type="submit"
			style="width:100%; background:var(--of-danger-bg); color:var(--of-danger); font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid var(--of-danger-bg); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-danger-bg)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-bg)';}}
		>
			{t.catchDelete}
		</button>
	</form>
</div>
