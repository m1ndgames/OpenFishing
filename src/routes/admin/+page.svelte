<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { t } = data;

	const MB = 1024 * 1024;
	function mb(bytes: number | null): string {
		if (bytes == null) return '∞';
		return (bytes / MB).toFixed(bytes < MB ? 1 : 0);
	}
	function quotaInput(bytes: number | null): string {
		return bytes == null ? '' : String(Math.round(bytes / MB));
	}

	const tr = t as unknown as Record<string, string>;

	let restoreFile = $state<string | null>(null);
	let restoreConfirmed = $state(false);
	let restoring = $state(false);
	const inputStyle = 'width:100%; padding:8px 11px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:8px; color:var(--of-text); font-size:0.85rem; outline:none; box-sizing:border-box; font-family:"DM Sans",sans-serif;';
	const labelStyle = 'display:block; font-size:0.7rem; font-weight:600; color:var(--of-text-4); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;';
	const btn = 'display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:600; padding:7px 13px; border-radius:8px; cursor:pointer; border:1px solid var(--of-border); background:var(--of-bg-elevated); color:var(--of-text-2); font-family:"DM Sans",sans-serif;';
</script>

<svelte:head><title>OpenFishing — {t.navAdmin}</title></svelte:head>

<div style="max-width:920px;">
	<h1 style="font-family:'Carter One',sans-serif; font-size:1.5rem; color:var(--of-text-bright); margin:0 0 20px;">{t.adminTitle}</h1>

	{#if form?.error}
		<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.84rem; padding:10px 14px; border-radius:9px; margin-bottom:16px;">
			{tr[form.error] ?? form.error}
		</div>
	{/if}
	{#if form?.success}
		<div style="background:var(--of-success-bg); border:1px solid var(--of-success-border); color:var(--of-success); font-size:0.84rem; padding:10px 14px; border-radius:9px; margin-bottom:16px;">
			{tr[form.success] ?? form.success}
		</div>
	{/if}

	<!-- Create user -->
	<section style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:20px; margin-bottom:24px;">
		<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 14px;">{t.adminCreateUser}</h2>
		<form method="POST" action="?/createUser" use:enhance style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; align-items:end;">
			<div><label for="c_email" style={labelStyle}>{t.adminEmail}</label><input id="c_email" name="email" type="email" style={inputStyle} /></div>
			<div><label for="c_username" style={labelStyle}>{t.adminUsername}</label><input id="c_username" name="username" type="text" style={inputStyle} /></div>
			<div><label for="c_password" style={labelStyle}>{t.adminPassword}</label><input id="c_password" name="password" type="text" style={inputStyle} /></div>
			<div><label for="c_quota" style={labelStyle}>{t.adminQuotaMb}</label><input id="c_quota" name="quota_mb" type="number" min="0" placeholder={t.adminQuotaUnlimited} style={inputStyle} /></div>
			<button type="submit" style="{btn} background:var(--of-accent-solid); color:var(--of-ink); border-color:transparent; justify-content:center;">{t.adminCreate}</button>
		</form>
	</section>

	<!-- Users list -->
	<section style="display:flex; flex-direction:column; gap:14px;">
		{#each data.users as u (u.id)}
			<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:18px;">
				<div style="display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
					<span style="font-weight:700; color:var(--of-text-bright); font-size:0.95rem;">{u.username}</span>
					{#if u.isAdmin}
						<span style="font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border); padding:2px 8px; border-radius:6px;">{t.adminAdminBadge}</span>
					{/if}
					{#if u.disabled}
						<span style="font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--of-danger); background:var(--of-danger-bg); border:1px solid var(--of-danger-border); padding:2px 8px; border-radius:6px;">{t.adminDisabledBadge}</span>
					{/if}
					<span style="margin-left:auto; font-size:0.78rem; color:var(--of-text-4); font-family:'JetBrains Mono',monospace;">
						{t.adminColUsage}: {mb(u.usedBytes)} / {mb(u.quotaBytes)} MB
					</span>
				</div>

				<!-- Edit form -->
				<form method="POST" action="?/updateUser" use:enhance style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; align-items:end; margin-bottom:12px;">
					<input type="hidden" name="id" value={u.id} />
					<div><label style={labelStyle} for="e_{u.id}">{t.adminEmail}</label><input id="e_{u.id}" name="email" type="email" value={u.email} disabled={u.isAdmin} style={inputStyle} /></div>
					<div><label style={labelStyle} for="u_{u.id}">{t.adminUsername}</label><input id="u_{u.id}" name="username" type="text" value={u.username} disabled={u.isAdmin} style={inputStyle} /></div>
					<div><label style={labelStyle} for="q_{u.id}">{t.adminQuotaMb}</label><input id="q_{u.id}" name="quota_mb" type="number" min="0" value={quotaInput(u.quotaBytes)} placeholder={t.adminQuotaUnlimited} style={inputStyle} /></div>
					{#if !u.isAdmin}
						<div><label style={labelStyle} for="p_{u.id}">{t.adminResetPassword}</label><input id="p_{u.id}" name="password" type="text" placeholder="••••••" style={inputStyle} /></div>
					{/if}
					<button type="submit" style="{btn} background:var(--of-accent-solid); color:var(--of-ink); border-color:transparent; justify-content:center;">{t.adminSave}</button>
				</form>

				<!-- API token -->
				<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
					<span style={labelStyle}>{t.adminColApiToken}</span>
					<code style="font-size:0.74rem; color:var(--of-text-3); background:var(--of-bg-elevated); padding:4px 8px; border-radius:6px; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; max-width:280px; white-space:nowrap;">{u.apiToken ?? '—'}</code>
				</div>

				<!-- Action buttons -->
				<div style="display:flex; gap:8px; flex-wrap:wrap;">
					{#if data.chatbotConfigured}
						<form method="POST" action="?/toggleChatbot" use:enhance>
							<input type="hidden" name="id" value={u.id} />
							<button type="submit" style={btn}>{u.chatbotEnabled ? t.adminChatbotOn : t.adminChatbotOff}</button>
						</form>
					{/if}
					<form method="POST" action="?/regenerateToken" use:enhance>
						<input type="hidden" name="id" value={u.id} />
						<button type="submit" style={btn}>{t.adminRegenerateToken}</button>
					</form>
					{#if !u.isAdmin}
						<form method="POST" action="?/toggleDisabled" use:enhance>
							<input type="hidden" name="id" value={u.id} />
							<button type="submit" style={btn}>{u.disabled ? t.adminEnable : t.adminDisable}</button>
						</form>
						<form method="POST" action="?/deleteUser" use:enhance onsubmit={(e) => { if (!confirm(t.adminConfirmDelete)) e.preventDefault(); }}>
							<input type="hidden" name="id" value={u.id} />
							<button type="submit" style="{btn} color:var(--of-danger); border-color:var(--of-danger-border); background:var(--of-danger-bg);">{t.adminDelete}</button>
						</form>
					{/if}
				</div>
			</div>
		{/each}
	</section>

	<!-- Full backup & restore (all users) -->
	<section style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:20px; margin-top:24px;">
		<h2 style="font-size:1rem; font-weight:700; color:var(--of-text); margin:0 0 4px;">{t.adminBackupAllTitle}</h2>
		<p style="font-size:0.8rem; color:var(--of-text-4); margin:0 0 16px; line-height:1.5;">{t.adminBackupAllDesc}</p>

		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; padding-bottom:16px; border-bottom:1px solid var(--of-border-subtle);">
			<div>
				<p style="font-weight:600; color:var(--of-text); margin:0 0 4px; font-size:0.9rem;">{t.adminBackupAllExportTitle}</p>
				<p style="font-size:0.8rem; color:var(--of-text-4); margin:0;">{t.adminBackupAllExportDesc}</p>
			</div>
			<a href="/admin/export" download style="flex-shrink:0; display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; text-decoration:none; white-space:nowrap;">{t.adminBackupAllExportBtn}</a>
		</div>

		<div style="padding-top:16px;">
			<p style="font-weight:600; color:var(--of-warning); margin:0 0 4px; font-size:0.9rem;">{t.adminRestoreAllTitle}</p>
			<p style="font-size:0.8rem; color:var(--of-text-4); margin:0 0 14px; line-height:1.5;">{t.adminRestoreAllDesc}</p>
			<form method="POST" action="?/restoreAll" enctype="multipart/form-data" use:enhance={() => {
					restoring = true;
					return async ({ update }) => { await update(); restoring = false; restoreConfirmed = false; restoreFile = null; };
				}}
				onsubmit={(e) => { if (!restoreConfirmed) e.preventDefault(); }}
				style="display:flex; flex-direction:column; gap:10px;">
				<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
					<input type="file" name="backup" accept=".zip" class="hidden" onchange={(e) => { restoreFile = (e.target as HTMLInputElement).files?.[0]?.name ?? null; restoreConfirmed = false; }} />
					<span style="display:inline-flex; align-items:center; gap:7px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.82rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); cursor:pointer; white-space:nowrap;">{t.backupChooseFile}</span>
					<span style="font-size:0.8rem; color:var(--of-text-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{restoreFile ?? t.backupNoFile}</span>
				</label>
				{#if restoreFile}
					<label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; user-select:none;">
						<input type="checkbox" bind:checked={restoreConfirmed} style="margin-top:2px; width:15px; height:15px; flex-shrink:0; accent-color:var(--of-danger); cursor:pointer;" />
						<span style="font-size:0.8rem; color:var(--of-text-2); line-height:1.5;">{t.adminRestoreAllConfirm}</span>
					</label>
					<div>
						<button type="submit" disabled={!restoreConfirmed || restoring}
							style="display:inline-flex; align-items:center; gap:7px; background:var(--of-danger-bg); color:var(--of-danger); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; border:1px solid var(--of-danger-border); cursor:pointer; font-family:'DM Sans',sans-serif; {(!restoreConfirmed || restoring) ? 'opacity:0.45; cursor:not-allowed;' : ''}">
							{restoring ? t.backupImporting : t.adminRestoreAllBtn}
						</button>
					</div>
				{/if}
			</form>
		</div>
	</section>
</div>
