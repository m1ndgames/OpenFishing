<script lang="ts">
	let { name = 'tags', value = '', suggest = [], placeholder = 'e.g. add tags…', removeLabel = 'Remove {tag}', id }: { name?: string; value?: string; suggest?: string[]; placeholder?: string; removeLabel?: string; id?: string } = $props();

	let tags = $derived<string[]>(value ? value.split(/\s+/).filter(Boolean) : []);
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

	// Android virtual keyboards send keydown with key "Unidentified" for space,
	// so onKeydown never sees it there. Commit on the typed whitespace instead.
	function onInput() {
		if (/\s$/.test(inputValue)) addTag();
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

<input type="hidden" {name} value={tags.join(' ')} />

<!-- Clicking the chip area focuses the text field; keyboard users tab straight to the field. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	style="display:flex; flex-wrap:wrap; gap:6px; width:100%; min-height:42px; padding:8px 10px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; box-sizing:border-box; cursor:text; transition:border-color 0.15s, box-shadow 0.15s;"
	onclick={() => inputEl.focus()}
	onfocusin={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px var(--of-accent-glow)';}}
	onfocusout={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.boxShadow='none';}}
>
	{#each tags as tag, i (tag)}
		<span style="display:inline-flex; align-items:center; gap:4px; background:var(--of-accent-bg-hover); color:var(--of-accent); font-size:0.8125rem; padding:2px 8px; border-radius:6px; border:1px solid var(--of-accent-border);">
			{tag}
			<button
				type="button"
				class="of-tap"
				onclick={(e) => { e.stopPropagation(); removeTag(i); }}
				style="color:var(--of-accent); background:none; border:none; cursor:pointer; padding:0; margin-right:-2px; width:16px; height:16px; border-radius:4px; display:flex; align-items:center; justify-content:center;"
				aria-label={removeLabel.replace('{tag}', tag)}
			><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
		</span>
	{/each}

	<input
		{id}
		bind:this={inputEl}
		bind:value={inputValue}
		onkeydown={onKeydown}
		oninput={onInput}
		onblur={addTag}
		type="text"
		enterkeyhint="enter"
		autocapitalize="off"
		list={suggest.length > 0 ? `suggest-taginput-${name}` : undefined}
		placeholder={tags.length === 0 ? placeholder : ''}
		style="flex:1; min-width:96px; min-height:24px; outline:none; background:transparent; color:var(--of-text); font-size:0.875rem; border:none; padding:1px 2px; font-family:'DM Sans',sans-serif;"
	/>
</div>

{#if suggest.length > 0}
	<datalist id="suggest-taginput-{name}">
		{#each suggest as s}<option value={s}></option>{/each}
	</datalist>
{/if}
