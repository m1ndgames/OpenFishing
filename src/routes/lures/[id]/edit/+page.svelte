<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import TagInput from '$lib/components/TagInput.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { lure, suggestions, t } = data;

	let photoInput: HTMLInputElement;
	let uploadInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let clearPhoto = $state(false);

	const existingPhoto = lure.photoPath ? `/uploads/${lure.photoPath}` : null;
	const displayPhoto = $derived(clearPhoto ? null : (previewUrl ?? existingPhoto));

	function handleFile(file: File | null | undefined) {
		if (!file) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		photoInput.files = dt.files;
		previewUrl = URL.createObjectURL(file);
		clearPhoto = false;
	}

	function removePhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		photoInput.value = '';
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
		clearPhoto = true;
	}
</script>

<div class="max-w-xl">
	<div class="mb-6 flex items-center gap-3">
		<a href="/lures/{lure.id}" class="text-gray-400 hover:text-gray-600 transition-colors">{t.back}</a>
		<h1 class="text-2xl font-bold text-gray-900">{t.editLureTitle}</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
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

	<datalist id="suggest-weather">
		{#each suggestions.weathers as w}<option value={w}></option>{/each}
	</datalist>

	<!-- Trigger-only inputs -->
	<input
		bind:this={uploadInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])}
	/>
	<input
		bind:this={cameraInput}
		type="file"
		accept="image/*"
		capture="environment"
		class="hidden"
		onchange={(e) => handleFile((e.target as HTMLInputElement).files?.[0])}
	/>

	<form
		method="POST"
		action="?/update"
		enctype="multipart/form-data"
		class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5"
	>
		<input bind:this={photoInput} type="file" name="photo" accept="image/*" class="hidden" />
		<input type="hidden" name="clear_photo" value={clearPhoto ? '1' : '0'} />

		<!-- Photo -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">{t.photo}</label>

			{#if displayPhoto}
				<div class="relative rounded-xl overflow-hidden bg-slate-900 mb-2" style="aspect-ratio: 4/3;">
					<img src={displayPhoto} alt={lure.name} class="absolute inset-0 w-full h-full object-cover" />
					<button
						type="button"
						onclick={removePhoto}
						class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white
						       rounded-full w-8 h-8 flex items-center justify-center
						       text-xs font-bold transition-colors z-10"
						aria-label="Remove photo"
					>✕</button>
					<svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
						<path d="M16,36 L16,16 L36,16" fill="none" stroke="white" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
						<path d="M364,16 L384,16 L384,36" fill="none" stroke="white" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
						<path d="M16,264 L16,284 L36,284" fill="none" stroke="white" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
						<path d="M384,264 L384,284 L364,284" fill="none" stroke="white" stroke-width="2.5" stroke-opacity="0.7" stroke-linecap="round"/>
					</svg>
				</div>
			{/if}

			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					onclick={() => uploadInput.click()}
					class="flex items-center justify-center gap-2 border border-gray-200
					       hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700
					       text-gray-600 text-sm font-medium py-2 rounded-lg transition-all"
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none" class="shrink-0">
						<path d="M7.5 1.5v9M4 7l3.5 3.5L11 7M2 12.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t.uploadPhoto}
				</button>
				<button
					type="button"
					onclick={() => cameraInput.click()}
					class="flex items-center justify-center gap-2 border border-gray-200
					       hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700
					       text-gray-600 text-sm font-medium py-2 rounded-lg transition-all"
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none" class="shrink-0">
						<path d="M1.5 4.5A1 1 0 012.5 3.5h1.382a1 1 0 00.894-.553l.448-.894A1 1 0 016.118 1.5h2.764a1 1 0 01.894.553l.448.894a1 1 0 00.894.553H12.5a1 1 0 011 1v7a1 1 0 01-1 1h-10a1 1 0 01-1-1v-7z" stroke="currentColor" stroke-width="1.2"/>
						<circle cx="7.5" cy="8" r="2.2" stroke="currentColor" stroke-width="1.2"/>
					</svg>
					{t.takePhoto}
				</button>
			</div>
		</div>

		<!-- Name -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="name">
				{t.name} <span class="text-red-500">*</span>
			</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				list="suggest-names"
				value={lure.name}
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="brand">{t.brand}</label>
				<input
					id="brand"
					name="brand"
					type="text"
					list="suggest-brands"
					value={lure.brand ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="type">{t.type}</label>
				<input
					id="type"
					name="type"
					type="text"
					list="suggest-types"
					value={lure.type ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="color">{t.color}</label>
				<input
					id="color"
					name="color"
					type="text"
					list="suggest-colors"
					value={lure.color ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="weight">{t.weightG}</label>
				<input
					id="weight"
					name="weight"
					type="number"
					min="0"
					step="0.1"
					value={lure.weight ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="size">{t.size}</label>
				<input
					id="size"
					name="size"
					type="text"
					value={lure.size ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="running_depth">{t.runningDepth}</label>
				<select
					id="running_depth"
					name="running_depth"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="" selected={!lure.runningDepth}>—</option>
					<option value="shallow" selected={lure.runningDepth === 'shallow'}>{t.runningDepth_shallow}</option>
					<option value="medium" selected={lure.runningDepth === 'medium'}>{t.runningDepth_medium}</option>
					<option value="deep" selected={lure.runningDepth === 'deep'}>{t.runningDepth_deep}</option>
				</select>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="water_type">{t.waterType}</label>
				<select
					id="water_type"
					name="water_type"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="" selected={!lure.waterType}>—</option>
					<option value="freshwater" selected={lure.waterType === 'freshwater'}>{t.waterType_freshwater}</option>
					<option value="saltwater" selected={lure.waterType === 'saltwater'}>{t.waterType_saltwater}</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="weather">{t.weather}</label>
				<input
					id="weather"
					name="weather"
					type="text"
					list="suggest-weather"
					value={lure.weather ?? ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{t.tags}</label>
			<TagInput name="tags" value={lure.tags.map((tag) => tag.name).join(' ')} />
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{t.fishSpecies}</label>
			<TagInput name="species" value={lure.species ?? ''} />
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="notes">{t.notes}</label>
			<textarea
				id="notes"
				name="notes"
				rows="3"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
			>{lure.notes ?? ''}</textarea>
		</div>

		<label class="flex items-center gap-3 cursor-pointer select-none">
			<input type="hidden" name="qr_coded" value="0" />
			<input
				type="checkbox"
				name="qr_coded"
				value="1"
				checked={lure.qrCoded}
				class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
			/>
			<span class="text-sm font-medium text-gray-700">{t.labeled}</span>
			<span class="text-xs text-gray-400">{t.labeledHint}</span>
		</label>

		<div class="flex flex-col sm:flex-row gap-2 pt-2">
			<button
				type="submit"
				class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 sm:py-2 rounded-lg text-sm transition-colors"
			>
				{t.saveChanges}
			</button>
			<a
				href="/lures/{lure.id}"
				class="w-full sm:w-auto text-center border border-gray-300 hover:bg-gray-100 text-sm font-medium px-6 py-3 sm:py-2 rounded-lg transition-colors"
			>
				{t.cancel}
			</a>
		</div>
	</form>

	<!-- Delete -->
	<form
		method="POST"
		action="?/delete"
		class="mt-4"
		onsubmit={(e) => { if (!confirm(t.deleteConfirm)) e.preventDefault(); }}
	>
		<button
			type="submit"
			class="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200
			       text-sm font-medium px-6 py-3 sm:py-2 rounded-lg transition-colors"
		>
			{t.deleteLure}
		</button>
	</form>
</div>
