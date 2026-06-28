<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	const inputStyle = "width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;";
	function focusInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='var(--of-accent-solid)'; el.style.boxShadow='0 0 0 3px var(--of-accent-glow)'; }
	function blurInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='var(--of-border)'; el.style.boxShadow='none'; }
</script>

<div style="max-width:520px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:var(--of-text-4); font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-4)';}}
	>{t.back}</a>

	{#if form?.error}
		<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); border-radius:9px; padding:10px 14px; margin-bottom:16px; color:var(--of-danger); font-size:0.875rem;">{t[form.error as keyof typeof t] ?? form.error}</div>
	{/if}

	<form method="POST" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:24px 28px; display:flex; flex-direction:column; gap:20px;">
		<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:var(--of-text-bright); margin:0;">{t.reelAddTitle}</h1>
		<div>
			<label style={labelStyle}>{t.reelBrand}</label>
			<input name="brand" type="text" style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>
		<div>
			<label style={labelStyle}>{t.reelModel} *</label>
			<input name="model" type="text" required style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>
		<div>
			<label style={labelStyle}>{t.reelSize}</label>
			<input name="size" type="text" placeholder="e.g. 2500, 3000" style={inputStyle} onfocus={focusInput} onblur={blurInput} />
		</div>
		<div>
			<label style={labelStyle}>{t.reelNotes}</label>
			<textarea name="notes" rows="3" style="{inputStyle} resize:vertical;" onfocus={focusInput} onblur={blurInput}></textarea>
		</div>
		<div style="display:flex; gap:10px;">
			<button type="submit"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:11px 24px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.reelSave}</button>
			<a href="/tackle" style="display:inline-flex; align-items:center; padding:11px 24px; border-radius:9px; border:1px solid var(--of-border); color:var(--of-text-3); font-size:0.875rem; font-weight:600; text-decoration:none; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-text-4)'; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
			>{t.cancel}</a>
		</div>
	</form>
</div>
