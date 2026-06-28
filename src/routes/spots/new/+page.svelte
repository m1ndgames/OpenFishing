<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import TagInput from '$lib/components/TagInput.svelte';
	import 'leaflet/dist/leaflet.css';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	let mapEl: HTMLElement;
	let mapInstance: any = null;
	let marker: any = null;
	let lat = $state<number | null>(null);
	let lng = $state<number | null>(null);

	$effect(() => {
		lat; lng; // re-run when coords change
		if (mapInstance) requestAnimationFrame(() => mapInstance.invalidateSize());
	});
	let locating = $state(false);
	let locationError = $state(false);
	let photoPreviews = $state<string[]>([]);
	let photoFiles = $state<File[]>([]);
	let photoInput: HTMLInputElement;

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;";

	function focusInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = 'var(--of-accent-solid)';
		el.style.boxShadow = '0 0 0 3px var(--of-accent-bg)';
	}
	function blurInput(e: FocusEvent) {
		const el = e.target as HTMLElement;
		el.style.borderColor = 'var(--of-border)';
		el.style.boxShadow = 'none';
	}

	onMount(async () => {
		const L = (await import('leaflet')).default;

		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/>
				<circle cx="14" cy="14" r="5" fill="var(--of-ink)"/>
			</svg>`,
			className: '',
			iconSize: [28, 38],
			iconAnchor: [14, 38],
			popupAnchor: [0, -40]
		});

		mapInstance = L.map(mapEl, { zoomControl: true });

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(mapInstance);

		requestAnimationFrame(() => mapInstance.invalidateSize());

		mapInstance.on('click', (e: any) => {
			placeMarker(L, pinIcon, e.latlng.lat, e.latlng.lng);
		});

		// Try geolocation on mount
		locateUser(L, pinIcon, false);
	});

	function locateUser(L: any, pinIcon: any, explicit: boolean) {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				locating = false;
				const { latitude, longitude } = pos.coords;
				mapInstance.setView([latitude, longitude], 14);
				if (explicit) placeMarker(L, pinIcon, latitude, longitude);
			},
			() => { locating = false; },
			{ timeout: 8000 }
		);
	}

	async function handleLocateClick() {
		const L = (await import('leaflet')).default;
		const pinIcon = L.divIcon({
			html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="var(--of-accent-solid)"/><circle cx="14" cy="14" r="5" fill="var(--of-ink)"/></svg>`,
			className: '', iconSize: [28, 38], iconAnchor: [14, 38]
		});
		locateUser(L, pinIcon, true);
	}

	function placeMarker(L: any, icon: any, la: number, ln: number) {
		lat = la;
		lng = ln;
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
		// Inject photo files into the form
		const form = e.target as HTMLFormElement;
		const dt = new DataTransfer();
		for (const f of photoFiles) dt.items.add(f);
		photoInput.files = dt.files;
	}

	onDestroy(() => { mapInstance?.remove(); });
</script>

<div style="max-width:600px; margin:0 auto;">
	{#if form?.error}
		<div style="margin-bottom:16px; background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}
		style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">

		<input bind:this={photoInput} type="file" name="photos" accept="image/*" multiple class="hidden" onchange={handlePhotoChange} />
		<input type="hidden" name="lat" value={lat ?? ''} />
		<input type="hidden" name="lng" value={lng ?? ''} />

		<!-- Map -->
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
				<div bind:this={mapEl} style="height:320px;"></div>
			</div>

			{#if lat !== null}
				<p style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--of-text-3); margin:6px 0 0; text-align:right;">
					{lat.toFixed(6)}, {lng?.toFixed(6)}
				</p>
			{:else}
				<p style="font-size:0.78rem; color:var(--of-text-4); margin:6px 0 0; text-align:center;">{t.spotClickToPlace}</p>
			{/if}
		</div>

		<div style="height:1px; background:var(--of-border-subtle); margin:-4px 0;"></div>

		<!-- Name -->
		<div>
			<label style={labelStyle} for="name">{t.spotNameLabel}</label>
			<input id="name" name="name" type="text" placeholder="e.g. Old Oak Bend"
				style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>

		<!-- Tags -->
		<div>
			<label style={labelStyle}>{t.spotTagsLabel}</label>
			<TagInput name="tags" placeholder={t.spotTagsPlaceholder} />
		</div>

		<!-- Notes -->
		<div>
			<label style={labelStyle} for="notes">{t.spotNotesLabel}</label>
			<textarea id="notes" name="notes" rows="3" placeholder={t.spotNotesPlaceholder}
				style="{inputStyle} resize:none; min-height:90px;"
				onfocus={focusInput} onblur={blurInput}></textarea>
		</div>

		<!-- Photos -->
		<div>
			<label style={labelStyle}>{t.spotPhotosLabel}</label>

			{#if photoPreviews.length > 0}
				<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
					{#each photoPreviews as src, i}
						<div style="position:relative; width:88px; height:66px; border-radius:8px; overflow:hidden; border:1px solid var(--of-border);">
							<img {src} alt="" style="width:100%; height:100%; object-fit:cover;" />
							<button type="button" onclick={() => removePhoto(i)}
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
				{t.spotPhotosLabel}
			</button>
		</div>

		<!-- Actions -->
		<div style="display:flex; gap:10px; padding-top:4px; border-top:1px solid var(--of-border-subtle); margin-top:-4px;">
			<button type="submit"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.spotSave}</button>
			<a href="/spots"
				style="display:inline-flex; align-items:center; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)'; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
			>{t.cancel}</a>
		</div>
	</form>
</div>
