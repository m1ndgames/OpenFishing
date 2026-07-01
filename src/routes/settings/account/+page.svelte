<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { t } = data;
	const tr = t as unknown as Record<string, string>;
	const acc = data.account;

	const MB = 1024 * 1024;
	function mb(bytes: number | null): string {
		return bytes == null ? '∞' : (bytes / MB).toFixed(bytes < MB ? 1 : 0);
	}
	const usedPct = acc.quotaBytes ? Math.min(100, Math.round((acc.usedBytes / acc.quotaBytes) * 100)) : 0;

	let copied = $state(false);
	function copyToken() {
		if (acc.apiToken) {
			navigator.clipboard.writeText(acc.apiToken);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		}
	}

	const inputStyle = 'width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:"DM Sans",sans-serif;';
	const labelStyle = 'display:block; font-size:0.72rem; font-weight:600; color:var(--of-text-4); margin-bottom:5px; text-transform:uppercase; letter-spacing:0.05em;';
	const cardStyle = 'background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:22px; margin-bottom:20px;';
	const btnPrimary = 'background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; border:none; cursor:pointer; font-family:"DM Sans",sans-serif;';
</script>

<svelte:head><title>OpenFishing — {t.accountTitle}</title></svelte:head>

<div style="max-width:560px;">
	{#if form?.error}
		<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.84rem; padding:10px 14px; border-radius:9px; margin-bottom:16px;">{tr[form.error] ?? form.error}</div>
	{/if}
	{#if form?.success}
		<div style="background:var(--of-success-bg); border:1px solid var(--of-success-border); color:var(--of-success); font-size:0.84rem; padding:10px 14px; border-radius:9px; margin-bottom:16px;">{tr[form.success] ?? form.success}</div>
	{/if}

	{#if acc.isAdmin}
		<!-- Admin: fully env-controlled identity, nothing to edit -->
		<section style={cardStyle}>
			<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 12px;">{t.accountProfile}</h2>
			<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:14px;">
				<div><span style={labelStyle}>{t.adminUsername}</span><p style="margin:0; font-size:0.9rem; color:var(--of-text); font-family:'JetBrains Mono',monospace;">{acc.username}</p></div>
			</div>
			<p style="font-size:0.82rem; color:var(--of-text-4); margin:0; line-height:1.5;">{t.accountAdminIdentityNote}</p>
		</section>
	{:else}
		<!-- Profile -->
		<section style={cardStyle}>
			<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 14px;">{t.accountProfile}</h2>
			<form method="POST" action="?/updateProfile" use:enhance style="display:flex; flex-direction:column; gap:14px;">
				<div><label for="email" style={labelStyle}>{t.adminEmail}</label><input id="email" name="email" type="email" value={acc.email} style={inputStyle} /></div>
				<div><label for="username" style={labelStyle}>{t.adminUsername}</label><input id="username" name="username" type="text" value={acc.username} style={inputStyle} /></div>
				<div><button type="submit" style={btnPrimary}>{t.accountSaveProfile}</button></div>
			</form>
		</section>

		<!-- Password -->
		<section style={cardStyle}>
			<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 14px;">{t.accountChangePassword}</h2>
			<form method="POST" action="?/changePassword" use:enhance style="display:flex; flex-direction:column; gap:14px;">
				<div><label for="cur" style={labelStyle}>{t.accountCurrentPassword}</label><input id="cur" name="current_password" type="password" autocomplete="current-password" style={inputStyle} /></div>
				<div><label for="new" style={labelStyle}>{t.accountNewPassword}</label><input id="new" name="new_password" type="password" autocomplete="new-password" style={inputStyle} /></div>
				<div><button type="submit" style={btnPrimary}>{t.accountSavePassword}</button></div>
			</form>
		</section>
	{/if}

	<!-- Quota -->
	<section style={cardStyle}>
		<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 12px;">{t.accountStorage}</h2>
		<div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--of-text-3); margin-bottom:8px; font-family:'JetBrains Mono',monospace;">
			<span>{mb(acc.usedBytes)} MB</span><span>{acc.quotaBytes == null ? t.adminQuotaUnlimited : mb(acc.quotaBytes) + ' MB'}</span>
		</div>
		<div style="height:8px; background:var(--of-bg-elevated); border-radius:5px; overflow:hidden;">
			<div style="height:100%; width:{usedPct}%; background:{usedPct > 90 ? 'var(--of-danger)' : 'var(--of-accent-solid)'};"></div>
		</div>
	</section>

	<!-- API token -->
	<section style={cardStyle}>
		<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 12px;">{t.accountApiToken}</h2>
		<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
			<code style="flex:1; min-width:200px; font-size:0.78rem; color:var(--of-text-3); background:var(--of-bg-elevated); padding:8px 11px; border-radius:8px; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{acc.apiToken ?? '—'}</code>
			<button type="button" onclick={copyToken} style="font-size:0.8rem; font-weight:600; padding:8px 13px; border-radius:8px; cursor:pointer; border:1px solid var(--of-border); background:var(--of-bg-elevated); color:var(--of-text-2);">{copied ? t.accountCopied : t.accountCopy}</button>
			<form method="POST" action="?/regenerateToken" use:enhance>
				<button type="submit" style="font-size:0.8rem; font-weight:600; padding:8px 13px; border-radius:8px; cursor:pointer; border:1px solid var(--of-border); background:var(--of-bg-elevated); color:var(--of-text-2);">{t.adminRegenerateToken}</button>
			</form>
		</div>
	</section>

	<!-- Logout -->
	<section style={cardStyle}>
		<form method="POST" action="/logout">
			<button type="submit" style="display:inline-flex; align-items:center; gap:8px; font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; cursor:pointer; border:1px solid var(--of-danger-border); background:var(--of-danger-bg); color:var(--of-danger); font-family:'DM Sans',sans-serif;">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				{t.navLogout}
			</button>
		</form>
	</section>
</div>
