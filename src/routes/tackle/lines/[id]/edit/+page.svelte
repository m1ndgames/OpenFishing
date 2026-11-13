<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t, line: l } = $derived(data);

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.8125rem; font-weight:500; color:var(--of-text-2); margin-bottom:6px; ";
	function focusInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='var(--of-accent-solid)'; el.style.boxShadow='0 0 0 3px var(--of-accent-glow)'; }
	function blurInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='var(--of-border)'; el.style.boxShadow='none'; }
</script>

<div style="max-width:520px; margin:0 auto;">
	<a href="/tackle/lines/{l.id}" class="of-tap" style="display:inline-flex; align-items:center; gap:6px; color:var(--of-text-3); font-size:0.8125rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
		{t.back}
	</a>

	{#if form?.error}
		<div role="alert" style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); border-radius:9px; padding:10px 14px; margin-bottom:16px; color:var(--of-danger); font-size:0.875rem;">{t[form.error as keyof typeof t] ?? form.error}</div>
	{/if}

	<form method="POST" action="?/update" class="of-panel" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px 28px; display:flex; flex-direction:column; gap:20px;">
		<h1 style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0;">{t.lineEditTitle}</h1>
		<div>
			<label style={labelStyle} for="brand">{t.lineBrand}</label>
			<input id="brand" name="brand" type="text" value={l.brand ?? ''} style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>
		<div>
			<label style={labelStyle} for="model">{t.lineModel} <span style="color:var(--of-danger);">*</span></label>
			<input id="model" name="model" type="text" value={l.model} required style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>
		<div>
			<label style={labelStyle} for="type">{t.lineType}</label>
			<select id="type" name="type" style="{inputStyle} appearance:none;">
				<option value="" selected={!l.type}>—</option>
				<option value="Braid" selected={l.type === 'Braid'}>{t.lineTypeBraid}</option>
				<option value="Mono" selected={l.type === 'Mono'}>{t.lineTypeMono}</option>
				<option value="Fluoro" selected={l.type === 'Fluoro'}>{t.lineTypeFluoro}</option>
			</select>
		</div>
		<div class="of-grid-2-sm">
			<div>
				<label style={labelStyle} for="diameter_mm">{t.lineDiameter}</label>
				<input id="diameter_mm" name="diameter_mm" type="number" step="0.01" min="0" value={l.diameterMm ?? ''} style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
			<div>
				<label style={labelStyle} for="strength_kg">{t.lineStrength}</label>
				<input id="strength_kg" name="strength_kg" type="number" step="0.1" min="0" value={l.strengthKg ?? ''} style={inputStyle} onfocus={focusInput} onblur={blurInput} />
			</div>
		</div>
		<div>
			<label style={labelStyle} for="notes">{t.lineNotes}</label>
			<textarea id="notes" name="notes" rows="3" style="{inputStyle} resize:vertical;" onfocus={focusInput} onblur={blurInput}>{l.notes ?? ''}</textarea>
		</div>
		<button type="submit" class="of-primary"
			style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:11px 24px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; align-self:flex-start;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
		>{t.lineSaveChanges}</button>
	</form>

	<div class="of-panel" style="margin-top:16px; padding:20px 28px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px;">
		<form method="POST" action="?/delete">
			<button type="submit"
				style="background:var(--of-danger-bg); color:var(--of-danger); border:1px solid var(--of-danger-border); font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:var(--of-transition);"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-danger-bg)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-danger-bg)'; (e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}
				onclick={(e) => { if (!confirm(t.lineDeleteConfirm)) e.preventDefault(); }}
			>{t.lineDelete}</button>
		</form>
	</div>
</div>
