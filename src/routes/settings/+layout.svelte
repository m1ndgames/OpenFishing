<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t } = data;

	const qrActive      = $derived($page.url.pathname === '/settings/qr');
	const exportActive  = $derived($page.url.pathname === '/settings/export');
	const backupActive  = $derived($page.url.pathname === '/settings' || $page.url.pathname === '/settings/');
	const appearanceActive = $derived($page.url.pathname === '/settings/appearance');
	const accountActive = $derived($page.url.pathname.startsWith('/settings/account'));
	const adminActive   = $derived($page.url.pathname.startsWith('/settings/admin'));

	const tabStyle = (active: boolean) =>
		`font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em; ${active ? 'color:var(--of-ink); background:var(--of-accent-solid);' : 'color:var(--of-text-3); background:transparent;'}`;
</script>

<div>
	<!-- Sub-nav -->
	<nav class="no-print" style="display:flex; gap:6px; margin-bottom:28px; padding:4px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; width:fit-content; flex-wrap:wrap;">
		<a href="/settings" style={tabStyle(backupActive)}>{t.settingsBackupRestore}</a>
		<a href="/settings/qr" style={tabStyle(qrActive)}>{t.navQrCodes}</a>
		<a href="/settings/export" style={tabStyle(exportActive)}>{t.navCatchExport}</a>
		<a href="/settings/appearance" style={tabStyle(appearanceActive)}>{t.settingsAppearance}</a>
		{#if data.user}
			<a href="/settings/account" style={tabStyle(accountActive)}>{t.accountTitle}</a>
		{/if}
		{#if data.user?.isAdmin}
			<a href="/settings/admin" style={tabStyle(adminActive)}>{t.navAdmin}</a>
		{/if}
	</nav>

	{@render children()}
</div>
