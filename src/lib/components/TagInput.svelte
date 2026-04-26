<script lang="ts">
	let { name = 'tags', value = '', suggest = [], placeholder = 'e.g. add tags…' }: { name?: string; value?: string; suggest?: string[]; placeholder?: string } = $props();

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

<input type="hidden" {name} value={tags.join(' ')} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	style="display:flex; flex-wrap:wrap; gap:6px; width:100%; min-height:42px; padding:8px 10px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; box-sizing:border-box; cursor:text; transition:border-color 0.15s, box-shadow 0.15s;"
	onclick={() => inputEl.focus()}
	onfocusin={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4'; (e.currentTarget as HTMLElement).style.boxShadow='0 0 0 3px rgba(6,182,212,0.1)';}}
	onfocusout={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.boxShadow='none';}}
>
	{#each tags as tag, i (tag)}
		<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(6,182,212,0.12); color:#22d3ee; font-size:0.8rem; padding:2px 8px; border-radius:6px; border:1px solid rgba(6,182,212,0.25);">
			{tag}
			<button
				type="button"
				onclick={() => removeTag(i)}
				style="color:#67e8f9; background:none; border:none; cursor:pointer; line-height:1; padding:0; font-size:0.85rem; opacity:0.7; display:flex; align-items:center;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.opacity='1';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.opacity='0.7';}}
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
		list={suggest.length > 0 ? `suggest-taginput-${name}` : undefined}
		placeholder={tags.length === 0 ? placeholder : ''}
		style="flex:1; min-width:96px; outline:none; background:transparent; color:#c2dce8; font-size:0.875rem; border:none; padding:1px 2px; font-family:'DM Sans',sans-serif;"
	/>
</div>

{#if suggest.length > 0}
	<datalist id="suggest-taginput-{name}">
		{#each suggest as s}<option value={s}></option>{/each}
	</datalist>
{/if}
