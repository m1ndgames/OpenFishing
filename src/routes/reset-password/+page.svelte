<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;
	const tr = t as unknown as Record<string, string>;
</script>

<svelte:head>
	<title>OpenFishing — {t.resetTitle}</title>
</svelte:head>

<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--of-bg-base);">
	<div style="width:100%; max-width:360px;">
		<div style="text-align:center; margin-bottom:32px;">
			<svg width="48" height="48" viewBox="0 0 64 64" fill="none" style="margin:0 auto 12px; display:block; color:var(--of-accent-solid);">
				<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none"/>
				<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none"/>
				<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
			<h1 style="font-family:'Carter One',sans-serif; font-size:1.6rem; color:var(--of-text-bright); margin:0 0 4px;">OpenFishing</h1>
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.resetSubtitle}</p>
		</div>

		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:28px;">
			{#if !data.valid}
				<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.84rem; padding:12px 14px; border-radius:9px; line-height:1.5;">
					{t.resetTokenInvalid}
				</div>
				<a href="/forgot-password" style="display:block; text-align:center; margin-top:18px; font-size:0.85rem; color:var(--of-accent); text-decoration:none;">{t.resetRequestNew}</a>
			{:else}
				{#if form?.error}
					<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.84rem; padding:10px 14px; border-radius:9px; margin-bottom:16px;">{tr[form.error] ?? form.error}</div>
				{/if}
				<form method="POST" style="display:flex; flex-direction:column; gap:20px;">
					<input type="hidden" name="token" value={data.token} />
					<div>
						<label for="password" style="display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">{t.accountNewPassword}</label>
						<input id="password" name="password" type="password" autofocus autocomplete="new-password"
							style="width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif;" />
					</div>
					<button type="submit" style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:11px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif;">
						{t.resetSubmit}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
