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
	let lightValue = $state<number | null>(null);
	let photoError = $state(false);
	let showCrop = $state(false);
	let cropSrc = $state<string | null>(null);

	// Controlled field values for identify-to-fill
	let brandValue = $state('');
	let nameValue = $state('');
	let typeValue = $state('');
	let colorValue = $state('');
	let sizeValue = $state('');
	let weightValue = $state('');
	let runningDepthValue = $state('');
	let waterTypeValue = $state('');
	let speciesInitial = $state('');
	let speciesKey = $state(0);

	interface LureIdResult {
		brand: string | null;
		name: string | null;
		type: string | null;
		color: string | null;
		weight: number | null;
		size: number | null;
		runningDepth: 'shallow' | 'medium' | 'deep' | null;
		waterType: 'freshwater' | 'saltwater' | null;
		lightConditions: number | null;
		species: string[] | null;
		notes: string;
	}

	let identifyLoading = $state(false);
	let identifyResult = $state<LureIdResult | null>(null);
	let identifySelected = $state<Record<string, boolean>>({});

	async function identifyLure() {
		const file = photoInput.files?.[0];
		if (!file) return;
		identifyLoading = true;
		identifyResult = null;

		const imageData = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		try {
			const res = await fetch('/api/identify-lure', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageData })
			});
			if (res.ok) {
				const r: LureIdResult = await res.json();
				identifyResult = r;
				identifySelected = {
					brand: r.brand !== null,
					name: r.name !== null,
					type: r.type !== null,
					color: r.color !== null,
					weight: r.weight !== null,
					size: r.size !== null,
					runningDepth: r.runningDepth !== null,
					waterType: r.waterType !== null,
					lightConditions: r.lightConditions !== null,
					species: (r.species?.length ?? 0) > 0
				};
			}
		} catch { /* silently ignore */ }
		identifyLoading = false;
	}

	function applyIdentified() {
		const r = identifyResult!;
		if (identifySelected.brand && r.brand) brandValue = r.brand;
		if (identifySelected.name && r.name) nameValue = r.name;
		if (identifySelected.type && r.type) typeValue = r.type;
		if (identifySelected.color && r.color) colorValue = r.color;
		if (identifySelected.weight && r.weight !== null) weightValue = String(r.weight);
		if (identifySelected.size && r.size !== null) sizeValue = String(r.size);
		if (identifySelected.runningDepth && r.runningDepth) runningDepthValue = r.runningDepth;
		if (identifySelected.waterType && r.waterType) waterTypeValue = r.waterType;
		if (identifySelected.lightConditions && r.lightConditions !== null) lightValue = r.lightConditions;
		if (identifySelected.species && (r.species?.length ?? 0) > 0) {
			speciesInitial = r.species!.join(' ');
			speciesKey++;
		}
		identifyResult = null;
	}

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
		identifyResult = null;
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
		identifyResult = null;
	}

	function handleSubmit(e: SubmitEvent) {
		if (!previewUrl) {
			e.preventDefault();
			photoError = true;
		}
	}

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s, box-shadow 0.15s;";
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

	function hasAnyResult(r: LureIdResult): boolean {
		return !!(r.brand || r.name || r.type || r.color || r.weight !== null || r.size !== null || r.runningDepth || r.waterType || r.lightConditions !== null || (r.species?.length ?? 0) > 0);
	}
</script>

<div style="max-width:560px; margin:0 auto;">
{#if form?.error}
		<div style="margin-bottom:16px; background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.875rem; padding:12px 16px; border-radius:10px;">
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

	<!-- Trigger-only inputs -->
	<input bind:this={uploadInput} type="file" accept="image/*" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />
	<input bind:this={cameraInput} type="file" accept="image/*" capture="environment" class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])} />

	<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}
		style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:20px;">
		<input bind:this={photoInput} type="file" name="photo" accept="image/*" class="hidden" />

		<!-- Photo -->
		<div>
			<p style="{labelStyle}{photoError ? 'color:var(--of-danger);' : ''}">{t.photo} <span style="color:var(--of-danger);">*</span></p>

			{#if photoError}
				<p style="font-size:0.8rem; color:var(--of-danger); margin:0 0 8px;">{t.photoRequired}</p>
			{/if}

			{#if previewUrl}
				<div style="position:relative; border-radius:12px; overflow:hidden; background:var(--of-bg-overlay); aspect-ratio:4/3; margin-bottom:10px;">
					<img src={previewUrl} alt="Preview" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
					<button type="button" onclick={clearPhoto}
						style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); border:none; color:var(--of-text-bright); border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; z-index:10;"
						aria-label="Remove photo">✕</button>
					<svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" viewBox="0 0 400 300" preserveAspectRatio="none">
						<path d="M16,36 L16,16 L36,16" fill="none" stroke="var(--of-accent-border)" stroke-width="2" stroke-linecap="round"/>
						<path d="M364,16 L384,16 L384,36" fill="none" stroke="var(--of-accent-border)" stroke-width="2" stroke-linecap="round"/>
						<path d="M16,264 L16,284 L36,284" fill="none" stroke="var(--of-accent-border)" stroke-width="2" stroke-linecap="round"/>
						<path d="M384,264 L384,284 L364,284" fill="none" stroke="var(--of-accent-border)" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</div>
			{/if}

			<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
				<button type="button" onclick={() => uploadInput.click()}
					style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text-2); font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="14" height="14" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;">
						<path d="M7.5 1.5v9M4 7l3.5 3.5L11 7M2 12.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t.uploadPhoto}
				</button>
				<button type="button" onclick={() => cameraInput.click()}
					style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text-2); font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="14" height="14" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;">
						<path d="M1.5 4.5A1 1 0 012.5 3.5h1.382a1 1 0 00.894-.553l.448-.894A1 1 0 016.118 1.5h2.764a1 1 0 01.894.553l.448.894a1 1 0 00.894.553H12.5a1 1 0 011 1v7a1 1 0 01-1 1h-10a1 1 0 01-1-1v-7z" stroke="currentColor" stroke-width="1.2"/>
						<circle cx="7.5" cy="8" r="2.2" stroke="currentColor" stroke-width="1.2"/>
					</svg>
					{t.takePhoto}
				</button>
			</div>

			{#if previewUrl}
				<button type="button" onclick={identifyLure} disabled={identifyLoading}
					style="margin-top:8px; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:9px; background:var(--of-accent-bg); border:1px solid var(--of-accent-border); border-radius:9px; color:var(--of-accent); font-size:0.8rem; font-weight:500; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; opacity:{identifyLoading ? '0.6' : '1'};"
					onmouseenter={function(e){if (!identifyLoading) { (e.currentTarget as HTMLElement).style.background='var(--of-accent-bg-hover)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; }}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
				>
					{#if identifyLoading}
						<span class="id-spin">⟳</span> {t.identifying}
					{:else}
						<svg width="14" height="14" viewBox="0 0 15 15" fill="none" style="flex-shrink:0;">
							<circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.3"/>
							<path d="M7.5 5v3l2 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
						</svg>
						{t.identifyLure}
					{/if}
				</button>
			{/if}
		</div>

		<!-- Identify result panel -->
		{#if identifyResult}
			<div style="background:var(--of-bg-overlay); border:1px solid var(--of-accent-border); border-radius:12px; padding:16px; margin-top:-8px;">
				<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
					<span style="font-size:0.75rem; font-weight:600; color:var(--of-accent); text-transform:uppercase; letter-spacing:0.08em;">
						<svg width="12" height="12" viewBox="0 0 15 15" fill="none" style="vertical-align:-1px; margin-right:4px;"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M7.5 5v3l2 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
						Detected
					</span>
					<button type="button" onclick={() => identifyResult = null}
						style="background:none; border:none; color:var(--of-text-4); cursor:pointer; font-size:1rem; line-height:1; padding:2px 4px;"
						aria-label="Dismiss">✕</button>
				</div>

				{#if !hasAnyResult(identifyResult)}
					<p style="font-size:0.82rem; color:var(--of-text-3); margin:0 0 8px;">{t.identifyLureNoResult}</p>
				{:else}
					<div style="display:flex; flex-direction:column; gap:2px; margin-bottom:12px;">
						{#if identifyResult.brand !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.brand} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.brand}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.brand}</span>
							</label>
						{/if}
						{#if identifyResult.name !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.name} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.name}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.name}</span>
							</label>
						{/if}
						{#if identifyResult.type !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.type} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.type}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.type}</span>
							</label>
						{/if}
						{#if identifyResult.color !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.color} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.color}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.color}</span>
							</label>
						{/if}
						{#if identifyResult.weight !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.weight} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.weightG}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.weight} g</span>
							</label>
						{/if}
						{#if identifyResult.size !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.size} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.size}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.size} cm</span>
							</label>
						{/if}
						{#if identifyResult.runningDepth !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.runningDepth} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.runningDepth}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{t[`runningDepth_${identifyResult.runningDepth}` as keyof typeof t]}</span>
							</label>
						{/if}
						{#if identifyResult.waterType !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.waterType} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.waterType}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{t[`waterType_${identifyResult.waterType}` as keyof typeof t]}</span>
							</label>
						{/if}
						{#if identifyResult.lightConditions !== null}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.lightConditions} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.lightConditions}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{t[`lightConditions_${identifyResult.lightConditions}` as keyof typeof t]} ({identifyResult.lightConditions}/10)</span>
							</label>
						{/if}
						{#if (identifyResult.species?.length ?? 0) > 0}
							<label style="display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:6px; cursor:pointer;">
								<input type="checkbox" bind:checked={identifySelected.species} style="accent-color:var(--of-accent-solid); width:14px; height:14px; flex-shrink:0;" />
								<span style="font-size:0.75rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.05em; min-width:90px;">{t.fishSpecies}</span>
								<span style="font-size:0.875rem; color:var(--of-text); font-weight:500;">{identifyResult.species!.join(', ')}</span>
							</label>
						{/if}
					</div>
				{/if}

				{#if identifyResult.notes}
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 10px; font-style:italic;">{identifyResult.notes}</p>
				{/if}

				{#if hasAnyResult(identifyResult)}
					<div style="display:flex; gap:8px;">
						<button type="button" onclick={applyIdentified}
							style="flex:1; padding:8px 16px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.8rem; font-weight:700; border:none; border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
						>{t.identifyApplySelected}</button>
						<button type="button" onclick={() => identifyResult = null}
							style="padding:8px 16px; background:transparent; color:var(--of-text-3); font-size:0.8rem; border:1px solid var(--of-border); border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-text-4)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
						>{t.cancel}</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Divider -->
		<div style="height:1px; background:var(--of-border-subtle); margin:-4px 0;"></div>

		<!-- Brand + Name -->
		<div class="of-grid-2">
			<div>
				<label style={labelStyle} for="brand">{t.brand}</label>
				<input id="brand" name="brand" type="text" list="suggest-brands" placeholder="e.g. Rapala"
					bind:value={brandValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="name">{t.name}</label>
				<input id="name" name="name" type="text" list="suggest-names" placeholder="e.g. CD-7"
					bind:value={nameValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Type + Color -->
		<div class="of-grid-2">
			<div>
				<label style={labelStyle} for="type">{t.type}</label>
				<input id="type" name="type" type="text" list="suggest-types" placeholder="e.g. Crankbait"
					bind:value={typeValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="color">{t.color}</label>
				<input id="color" name="color" type="text" list="suggest-colors" placeholder="e.g. Fire Tiger"
					bind:value={colorValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Size + Weight + Amount -->
		<div class="of-grid-3">
			<div>
				<label style={labelStyle} for="size">{t.size} (cm)</label>
				<input id="size" name="size" type="number" min="0" step="0.1"
					bind:value={sizeValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="weight">{t.weightG}</label>
				<input id="weight" name="weight" type="number" min="0" step="0.1" placeholder="e.g. 7"
					bind:value={weightValue}
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="amount">{t.amount}</label>
				<input id="amount" name="amount" type="number" min="1" step="1" value="1"
					style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>

		<!-- Tags + Running Depth -->
		<div class="of-grid-2">
			<div>
				<label style={labelStyle}>{t.tags}</label>
				<TagInput name="tags" placeholder={t.lureTagsPlaceholder} />
			</div>
			<div>
				<label style={labelStyle} for="running_depth">{t.runningDepth}</label>
				<select id="running_depth" name="running_depth" bind:value={runningDepthValue} style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="">—</option>
					<option value="shallow">{t.runningDepth_shallow}</option>
					<option value="medium">{t.runningDepth_medium}</option>
					<option value="deep">{t.runningDepth_deep}</option>
				</select>
			</div>
		</div>

		<!-- Water Type + Light Conditions -->
		<div class="of-grid-2">
			<div>
				<label style={labelStyle} for="water_type">{t.waterType}</label>
				<select id="water_type" name="water_type" bind:value={waterTypeValue} style={selectStyle}
					onfocus={focusInput} onblur={blurInput}>
					<option value="">—</option>
					<option value="freshwater">{t.waterType_freshwater}</option>
					<option value="saltwater">{t.waterType_saltwater}</option>
				</select>
			</div>
			<div>
				<div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:6px;">
					<label style="font-size:0.78rem; font-weight:500; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.06em;" for="light_conditions">{t.lightConditions}</label>
					{#if lightValue !== null}
						<span style="font-size:0.82rem; font-weight:600; color:var(--of-accent);">{t[`lightConditions_${lightValue}` as keyof typeof t]}</span>
					{/if}
				</div>
				<input type="hidden" name="light_conditions" value={lightValue !== null ? String(lightValue) : ''} />
				{#if lightValue !== null}
					<input id="light_conditions" type="range" min="0" max="10" step="1"
						value={lightValue}
						oninput={(e) => lightValue = Number((e.target as HTMLInputElement).value)}
						style="width:100%; accent-color:var(--of-accent-solid); cursor:pointer; margin-bottom:4px;" />
					<div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--of-text-4);">
						<span>{t.lightConditions_0}</span>
						<span>{t.lightConditions_10}</span>
					</div>
				{:else}
					<button type="button" onclick={() => lightValue = 5}
						style="width:100%; padding:8px 12px; background:transparent; border:1px dashed var(--of-border); border-radius:9px; color:var(--of-text-4); font-size:0.82rem; font-family:'DM Sans',sans-serif; cursor:pointer; text-align:left; transition:border-color 0.15s, color 0.15s;"
						onmouseenter={(e) => { (e.target as HTMLElement).style.borderColor='var(--of-text-4)'; (e.target as HTMLElement).style.color='var(--of-text-3)'; }}
						onmouseleave={(e) => { (e.target as HTMLElement).style.borderColor='var(--of-border)'; (e.target as HTMLElement).style.color='var(--of-text-4)'; }}>
						＋ {t.lightConditions}
					</button>
				{/if}
			</div>
		</div>

		<!-- Fish Species -->
		<div>
			<label style={labelStyle}>{t.fishSpecies}</label>
			{#key speciesKey}
				<TagInput name="species" value={speciesInitial} suggest={data.suggestions.species} placeholder={t.speciesPlaceholder} />
			{/key}
		</div>

		<!-- Notes -->
		<div>
			<label style={labelStyle} for="notes">{t.notes}</label>
			<textarea id="notes" name="notes" rows="3" placeholder={t.notesPlaceholder}
				style="{inputStyle} resize:none; min-height:90px;"
				onfocus={focusInput} onblur={blurInput}></textarea>
		</div>

		<!-- Actions -->
		<div style="display:flex; gap:10px; padding-top:4px; border-top:1px solid var(--of-border-subtle); margin-top:-4px;">
			<button type="submit"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:10px 24px; border-radius:9px; border:none; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				{t.saveLure}
			</button>
			<a href="/"
				style="display:inline-flex; align-items:center; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:10px 20px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)'; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
			>
				{t.cancel}
			</a>
		</div>
	</form>
</div>

{#if showCrop && cropSrc}
	<CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={onCropCancel} />
{/if}

<style>
	.id-spin {
		display: inline-block;
		animation: id-spin 1s linear infinite;
	}
	@keyframes id-spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
