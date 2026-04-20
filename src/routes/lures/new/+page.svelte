<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import TagInput from '$lib/components/TagInput.svelte';
	import CropModal from '$lib/components/CropModal.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	let photoInput: HTMLInputElement;
	let uploadInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let photoError = $state(false);
	let showCrop = $state(false);
	let cropSrc = $state<string | null>(null);

	function handleFile(file: File | null | undefined) {
		photoError = false;
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
	}

	function onCropCancel() {
		showCrop = false;
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
	}

	function clearPhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		photoInput.value = '';
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
	}

	function handleSubmit(e: SubmitEvent) {
		if (!previewUrl) {
			e.preventDefault();
			photoError = true;
		}
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
{#if form?.error}
		<div style="margin-bottom:16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; font-size:0.875rem; padding:12px 16px; border-radius:10px;">
			{t[form.error as keyof typeof t] ?? form.error}
		</div>
	{/if}

	<!-- Datalists -->
	<datalist id="suggest-names">
		{#each data.suggestions.names as name}<option value={name}></option>{/each}
	</datalist>
	<datalist id="suggest-brands">
		{#each data.suggestions.brands as brand}<option value={brand}></option>{/each}
	</datalist>
	<datalist id="suggest-types">
		{#each [...new Set([...t.lureTypes, ...data.suggestions.types])] as type}
			<option value={type}></option>
		{/each}
	</datalist>
	<datalist id="suggest-colors">
		{#each data.suggestions.colors as color}<option value={color}></option>{/each}
	</datalist>
	<datalist id="suggest-light-conditions">
		{#each data.suggestions.lightConditions as w}<option value={w}></option>{/each}
	</datalist>

	<!-- Trigger-only inputs -->
	<input bind:this={uploadInput} type="file" accept="image/*" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />
	<input bind:this={cameraInput} type="file" accept="image/*" capture="environment" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />

	<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}
		style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">
		<input bind:this={photoInput} type="file" name="photo" accept="image/*" class="hidden" />

		<!-- Photo -->
		<div>
			<p style="{labelStyle}{photoError ? 'color:#f87171;' : ''}">{t.photo} <span style="color:#f87171;">*</span></p>

			{#if photoError}
				<p style="font-size:0.8rem; color:#f87171; margin:0 0 8px;">{t.photoRequired}</p>
			{/if}

			{#if previewUrl}
				<div style="position:relative; border-radius:12px; overflow:hidden; background:#0d1f35; aspect-ratio:4/3; margin-bottom:10px;">
					<img src={previewUrl} alt="Preview" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
					<button type="button" onclick={clearPhoto}
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

		<!-- Divider -->
		<div style="height:1px; background:#172f4a; margin:-4px 0;"></div>

		<!-- Brand + Name -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="brand">{t.brand}</label>
				<input id="brand" name="brand" type="text" list="suggest-brands" placeholder="e.g. Rapala"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="name">{t.name}</label>
				<input id="name" name="name" type="text" list="suggest-names" placeholder="e.g. CD-7"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Type + Color -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="type">{t.type}</label>
				<input id="type" name="type" type="text" list="suggest-types" placeholder="e.g. Crankbait"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="color">{t.color}</label>
				<input id="color" name="color" type="text" list="suggest-colors" placeholder="e.g. Fire Tiger"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Size + Weight -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="size">{t.size}</label>
				<input id="size" name="size" type="text" placeholder="e.g. 7cm"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="weight">{t.weightG}</label>
				<input id="weight" name="weight" type="number" min="0" step="0.1" placeholder="e.g. 7"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Fish Species + Running Depth -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle}>{t.fishSpecies}</label>
				<TagInput name="species" />
			</div>
			<div>
				<label style={labelStyle} for="running_depth">{t.runningDepth}</label>
				<select id="running_depth" name="running_depth" style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="">—</option>
					<option value="shallow">{t.runningDepth_shallow}</option>
					<option value="medium">{t.runningDepth_medium}</option>
					<option value="deep">{t.runningDepth_deep}</option>
				</select>
			</div>
		</div>

		<!-- Water Type + Weather -->
		<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
			<div>
				<label style={labelStyle} for="water_type">{t.waterType}</label>
				<select id="water_type" name="water_type" style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="">—</option>
					<option value="freshwater">{t.waterType_freshwater}</option>
					<option value="saltwater">{t.waterType_saltwater}</option>
				</select>
			</div>
			<div>
				<label style={labelStyle} for="light_conditions">{t.lightConditions}</label>
				<input id="light_conditions" name="light_conditions" type="text" list="suggest-light-conditions" placeholder="e.g. Sunny"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Tags -->
		<div>
			<label style={labelStyle}>{t.tags}</label>
			<TagInput name="tags" />
		</div>

		<!-- Notes -->
		<div>
			<label style={labelStyle} for="notes">{t.notes}</label>
			<textarea id="notes" name="notes" rows="3" placeholder={t.notesPlaceholder}
				style="{inputStyle} resize:none; min-height:90px;"
				onfocus={focusInput} onblur={blurInput}></textarea>
		</div>

		<!-- Actions -->
		<div style="display:flex; gap:10px; padding-top:4px; border-top:1px solid #172f4a; margin-top:-4px;">
			<button type="submit"
				style="background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>
				{t.saveLure}
			</button>
			<a href="/"
				style="display:inline-flex; align-items:center; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#132841'; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#0f2238'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
			>
				{t.cancel}
			</a>
		</div>
	</form>
</div>

{#if showCrop && cropSrc}
	<CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={onCropCancel} />
{/if}
