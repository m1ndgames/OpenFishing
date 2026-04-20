<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import TagInput from '$lib/components/TagInput.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	let photoInput: HTMLInputElement;
	let uploadInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);

	function handleFile(file: File | null | undefined) {
		if (!file) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		photoInput.files = dt.files;
		previewUrl = URL.createObjectURL(file);
	}

	function clearPhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		photoInput.value = '';
		uploadInput.value = '';
		if (cameraInput) cameraInput.value = '';
	}
</script>

<div class="max-w-xl">
	<div class="mb-6 flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-gray-600 transition-colors">{t.back}</a>
		<h1 class="text-2xl font-bold text-gray-900">{t.addLureTitle}</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
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

	<datalist id="suggest-weather">
		{#each data.suggestions.weathers as w}<option value={w}></option>{/each}
	</datalist>

	<!-- Trigger-only inputs (outside form intentionally) -->
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
		enctype="multipart/form-data"
		class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5"
	>
		<input bind:this={photoInput} type="file" name="photo" accept="image/*" class="hidden" />

		<!-- Photo -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">{t.photo}</label>

			{#if previewUrl}
				<div
					class="relative rounded-xl overflow-hidden bg-slate-900 zone-grid mb-2"
					style="aspect-ratio: 4/3;"
				>
					<img src={previewUrl} alt="Preview" class="absolute inset-0 w-full h-full object-cover" />
					<button
						type="button"
						onclick={clearPhoto}
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

			<div class="mt-2 grid grid-cols-2 gap-2">
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

		<!-- Zeile 1: Marke, Name -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="brand">{t.brand}</label>
				<input
					id="brand"
					name="brand"
					type="text"
					list="suggest-brands"
					placeholder="e.g. Rapala"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
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
					placeholder="e.g. CD-7"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Zeile 2: Typ, Farbe -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="type">{t.type}</label>
				<input
					id="type"
					name="type"
					type="text"
					list="suggest-types"
					placeholder="e.g. Crankbait"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="color">{t.color}</label>
				<input
					id="color"
					name="color"
					type="text"
					list="suggest-colors"
					placeholder="e.g. Fire Tiger"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Zeile 3: Größe, Gewicht -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="size">{t.size}</label>
				<input
					id="size"
					name="size"
					type="text"
					placeholder="e.g. 7cm"
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
					placeholder="e.g. 7"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Zeile 4: Zielfisch, Lauftiefe -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">{t.fishSpecies}</label>
				<TagInput name="species" />
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="running_depth">{t.runningDepth}</label>
				<select
					id="running_depth"
					name="running_depth"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="">—</option>
					<option value="shallow">{t.runningDepth_shallow}</option>
					<option value="medium">{t.runningDepth_medium}</option>
					<option value="deep">{t.runningDepth_deep}</option>
				</select>
			</div>
		</div>

		<!-- Zeile 5: Gewässer, Wetter -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="water_type">{t.waterType}</label>
				<select
					id="water_type"
					name="water_type"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="">—</option>
					<option value="freshwater">{t.waterType_freshwater}</option>
					<option value="saltwater">{t.waterType_saltwater}</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1" for="weather">{t.weather}</label>
				<input
					id="weather"
					name="weather"
					type="text"
					list="suggest-weather"
					placeholder="e.g. Sunny"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Zeile 6: Tags -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">{t.tags}</label>
			<TagInput name="tags" />
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="notes">{t.notes}</label>
			<textarea
				id="notes"
				name="notes"
				rows="3"
				placeholder={t.notesPlaceholder}
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
			></textarea>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 pt-2">
			<button
				type="submit"
				class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 sm:py-2 rounded-lg text-sm transition-colors"
			>
				{t.saveLure}
			</button>
			<a
				href="/"
				class="w-full sm:w-auto text-center border border-gray-300 hover:bg-gray-100 text-sm font-medium px-6 py-3 sm:py-2 rounded-lg transition-colors"
			>
				{t.cancel}
			</a>
		</div>
	</form>
</div>
