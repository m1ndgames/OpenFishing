<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import TagInput from '$lib/components/TagInput.svelte';
	import CropModal from '$lib/components/CropModal.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { lure, suggestions, t } = data;

	let photoInput: HTMLInputElement;
	let uploadInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let clearPhoto = $state(false);
	let showCrop = $state(false);
	let cropSrc = $state<string | null>(null);

	const existingPhoto = lure.photoPath ? `/uploads/${lure.photoPath}` : null;
	const displayPhoto = $derived(clearPhoto ? null : (previewUrl ?? existingPhoto));

	function handleFile(file: File | null | undefined) {
		if (!file) return;
		if (cropSrc) URL.revokeObjectURL(cropSrc);
		cropSrc = URL.createObjectURL(file);
		showCrop = true;
	}

	function onCropConfirm(blob: Blob) {
		showCrop = false;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
		const dt = new DataTransfer();
		dt.items.add(file);
		photoInput.files = dt.files;
		previewUrl = URL.createObjectURL(file);
		clearPhoto = false;
	}

	function onCropCancel() {
		showCrop = false;
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
	}

	function removePhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		photoInput.value = '';
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
		clearPhoto = true;
	}

	const inputStyle = "width:100%; padding:9px 12px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s, box-shadow 0.15s;";
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

<div style="max-width:560px;">
	<div style="margin-bottom:24px; display:flex; align-items:center; gap:12px;">
		<a href="/lures/{lure.id}" style="color:#3d6a84; font-size:0.875rem; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{t.back}
		</a>
		<h1 style="font-family:'Carter One',sans-serif; font-weight:800; font-size:1.5rem; color:#e0eaf8; margin:0;">{t.editLureTitle}</h1>
	</div>

	{#if form?.error}
		<div style="margin-bottom:16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<!-- Datalists -->
	<datalist id="suggest-names">
		{#each suggestions.names as name}<option value={name}></option>{/each}
	</datalist>
	<datalist id="suggest-brands">
		{#each suggestions.brands as brand}<option value={brand}></option>{/each}
	</datalist>
	<datalist id="suggest-types">
		{#each [...new Set([...t.lureTypes, ...suggestions.types])] as type}
			<option value={type}></option>
		{/each}
	</datalist>
	<datalist id="suggest-colors">
		{#each suggestions.colors as color}<option value={color}></option>{/each}
	</datalist>
	<datalist id="suggest-light-conditions">
		{#each suggestions.lightConditions as w}<option value={w}></option>{/each}
	</datalist>

	<!-- Trigger-only inputs -->
	<input bind:this={uploadInput} type="file" accept="image/*" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />
	<input bind:this={cameraInput} type="file" accept="image/*" capture="environment" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />

	<form method="POST" action="?/update" enctype="multipart/form-data"
		style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">
		<input bind:this={photoInput} type="file" name="photo" accept="image/*" class="hidden" />
		<input type="hidden" name="clear_photo" value={clearPhoto ? '1' : '0'} />

		<!-- Photo -->
		<div>
			<p style={labelStyle}>{t.photo}</p>

			{#if displayPhoto}
				<div style="position:relative; border-radius:12px; overflow:hidden; background:#0d1f35; aspect-ratio:4/3; margin-bottom:10px;">
					<img src={displayPhoto} alt={lure.name} style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
					<button type="button" onclick={removePhoto}
						style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); border:none; color:#EDF5FA; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; z-index:10;"
						aria-label="Remove photo">✕</button>
					<svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 400 300" preserveAspectRatio="none">
						<path d="M16,36 L16,16 L36,16" fill="none" stroke="rgba(34,211,238,0.5)" stroke-width="2" stroke-linecap="round"/>
						<path d="M364,16 L384,16 L384,36" fill="none" stroke="rgba(34,211,238,0.5)" stroke-width="2" stroke-linecap="round"/>
						<path d="M16,264 L16,284 L36,284" fill="none" stroke="rgba(34,211,238,0.5)" stroke-width="2" stroke-linecap="round"/>
						<path d="M384,264 L384,284 L364,284" fill="none" stroke="rgba(34,211,238,0.5)" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</div>
			{/if}

			<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
				<button type="button" onclick={() => uploadInput.click()}
					style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#8ab8cc; font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
				>
					<svg width="14" height="14" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;">
						<path d="M7.5 1.5v9M4 7l3.5 3.5L11 7M2 12.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t.uploadPhoto}
				</button>
				<button type="button" onclick={() => cameraInput.click()}
					style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#8ab8cc; font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
				>
					<svg width="14" height="14" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;">
						<path d="M1.5 4.5A1 1 0 012.5 3.5h1.382a1 1 0 00.894-.553l.448-.894A1 1 0 016.118 1.5h2.764a1 1 0 01.894.553l.448.894a1 1 0 00.894.553H12.5a1 1 0 011 1v7a1 1 0 01-1 1h-10a1 1 0 01-1-1v-7z" stroke="currentColor" stroke-width="1.2"/>
						<circle cx="7.5" cy="8" r="2.2" stroke="currentColor" stroke-width="1.2"/>
					</svg>
					{t.takePhoto}
				</button>
			</div>
		</div>

		<div style="height:1px; background:#172f4a; margin:-4px 0;"></div>

		<!-- Name -->
		<div>
			<label style={labelStyle} for="name">{t.name} <span style="color:#f87171;">*</span></label>
			<input id="name" name="name" type="text" required list="suggest-names" value={lure.name}
				style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>

		<!-- Brand + Type -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="brand">{t.brand}</label>
				<input id="brand" name="brand" type="text" list="suggest-brands" value={lure.brand ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="type">{t.type}</label>
				<input id="type" name="type" type="text" list="suggest-types" value={lure.type ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Color + Weight -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="color">{t.color}</label>
				<input id="color" name="color" type="text" list="suggest-colors" value={lure.color ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="weight">{t.weightG}</label>
				<input id="weight" name="weight" type="number" min="0" step="0.1" value={lure.weight ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Size + Running Depth -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="size">{t.size}</label>
				<input id="size" name="size" type="text" value={lure.size ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="running_depth">{t.runningDepth}</label>
				<select id="running_depth" name="running_depth" style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="" selected={!lure.runningDepth}>—</option>
					<option value="shallow" selected={lure.runningDepth === 'shallow'}>{t.runningDepth_shallow}</option>
					<option value="medium" selected={lure.runningDepth === 'medium'}>{t.runningDepth_medium}</option>
					<option value="deep" selected={lure.runningDepth === 'deep'}>{t.runningDepth_deep}</option>
				</select>
			</div>
		</div>

		<!-- Water Type + Weather -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="water_type">{t.waterType}</label>
				<select id="water_type" name="water_type" style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="" selected={!lure.waterType}>—</option>
					<option value="freshwater" selected={lure.waterType === 'freshwater'}>{t.waterType_freshwater}</option>
					<option value="saltwater" selected={lure.waterType === 'saltwater'}>{t.waterType_saltwater}</option>
				</select>
			</div>
			<div>
				<label style={labelStyle} for="light_conditions">{t.lightConditions}</label>
				<input id="light_conditions" name="light_conditions" type="text" list="suggest-light-conditions" value={lure.lightConditions ?? ''}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Tags + Species -->
		<div>
			<label style={labelStyle}>{t.tags}</label>
			<TagInput name="tags" value={lure.tags.map((tag) => tag.name).join(' ')} />
		</div>
		<div>
			<label style={labelStyle}>{t.fishSpecies}</label>
			<TagInput name="species" value={lure.species ?? ''} />
		</div>

		<!-- Notes -->
		<div>
			<label style={labelStyle} for="notes">{t.notes}</label>
			<textarea id="notes" name="notes" rows="3"
				style="{inputStyle} resize:none; min-height:90px;"
				onfocus={focusInput} onblur={blurInput}>{lure.notes ?? ''}</textarea>
		</div>

		<!-- QR labeled checkbox -->
		<label style="display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none;">
			<input type="hidden" name="qr_coded" value="0" />
			<input type="checkbox" name="qr_coded" value="1" checked={lure.qrCoded}
				style="width:16px; height:16px; cursor:pointer; accent-color:#06b6d4;" />
			<span style="font-size:0.875rem; font-weight:500; color:#8ab8cc;">{t.labeled}</span>
			<span style="font-size:0.78rem; color:#3d6a84;">{t.labeledHint}</span>
		</label>

		<!-- Save / Cancel -->
		<div style="display:flex; justify-content:space-between; gap:10px; padding-top:16px; border-top:1px solid #172f4a; margin-top:8px;">
			<button type="submit"
				style="background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>
				{t.saveChanges}
			</button>
			<a href="/lures/{lure.id}"
				style="display:inline-flex; align-items:center; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#132841'; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#0f2238'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
			>
				{t.cancel}
			</a>
		</div>
	</form>

	<!-- Delete -->
	<form method="POST" action="?/delete" style="margin-top:12px;"
		onsubmit={(e) => { if (!confirm(t.deleteConfirm)) e.preventDefault(); }}>
		<button type="submit"
			style="width:100%; background:rgba(239,68,68,0.06); color:#f87171; font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid rgba(239,68,68,0.2); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(239,68,68,0.35)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.06)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(239,68,68,0.2)';}}
		>
			{t.deleteLure}
		</button>
	</form>
</div>

{#if showCrop && cropSrc}
	<CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={onCropCancel} />
{/if}
