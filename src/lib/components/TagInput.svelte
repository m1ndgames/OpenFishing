<script lang="ts">
	let { name = 'tags', value = '' }: { name?: string; value?: string } = $props();

	let tags = $state<string[]>(value ? value.split(/\s+/).filter(Boolean) : []);
	let inputValue = $state('');
	let inputEl: HTMLInputElement;

	function addTag() {
		const val = inputValue.trim();
		if (val && !tags.includes(val)) {
			tags = [...tags, val];
		}
		inputValue = '';
	}

	function removeTag(index: number) {
		tags = tags.filter((_, i) => i !== index);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			addTag();
		} else if (e.key === 'Backspace' && inputValue === '') {
			tags = tags.slice(0, -1);
		}
	}
</script>

<!-- Hidden input carries the value on form submit -->
<input type="hidden" {name} value={tags.join(' ')} />

<!-- Tag field -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="flex flex-wrap gap-1.5 w-full border border-gray-300 rounded-lg px-3 py-2
	       focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
	       cursor-text min-h-[42px]"
	onclick={() => inputEl.focus()}
>
	{#each tags as tag, i (tag)}
		<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded-md">
			{tag}
			<button
				type="button"
				onclick={() => removeTag(i)}
				class="text-blue-500 hover:text-blue-800 leading-none"
				aria-label="Remove {tag}"
			>×</button>
		</span>
	{/each}

	<input
		bind:this={inputEl}
		bind:value={inputValue}
		onkeydown={onKeydown}
		onblur={addTag}
		type="text"
		placeholder={tags.length === 0 ? 'e.g. pike saltwater topwater' : ''}
		class="flex-1 min-w-24 outline-none text-base sm:text-sm bg-transparent placeholder-gray-400"
	/>
</div>
