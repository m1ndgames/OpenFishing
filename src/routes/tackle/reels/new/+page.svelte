<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	const inputStyle = "width:100%; padding:9px 12px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.78rem; font-weight:500; color:#5d8fa8; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;";
	function focusInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='#06b6d4'; el.style.boxShadow='0 0 0 3px rgba(6,182,212,0.1)'; }
	function blurInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='#243f5e'; el.style.boxShadow='none'; }
</script>

<div style="max-width:520px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:#3d6a84; font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
	>{t.back}</a>

	{#if form?.error}
		<div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:9px; padding:10px 14px; margin-bottom:16px; color:#f87171; font-size:0.875rem;">{t[form.error as keyof typeof t] ?? form.error}</div>
	{/if}

	<form method="POST" style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; padding:24px 28px; display:flex; flex-direction:column; gap:20px;">
		<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0;">{t.reelAddTitle}</h1>
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
				style="background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; padding:11px 24px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.reelSave}</button>
			<a href="/tackle" style="display:inline-flex; align-items:center; padding:11px 24px; border-radius:9px; border:1px solid #243f5e; color:#5d8fa8; font-size:0.875rem; font-weight:600; text-decoration:none; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='#3d6a84'; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#5d8fa8';}}
			>{t.cancel}</a>
		</div>
	</form>
</div>
