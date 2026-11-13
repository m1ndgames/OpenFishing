<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t } = $derived(data);

	const qrActive      = $derived(page.url.pathname === '/settings/qr');
	const exportActive  = $derived(page.url.pathname === '/settings/export');
	const backupActive  = $derived(page.url.pathname === '/settings' || page.url.pathname === '/settings/');
	const appearanceActive = $derived(page.url.pathname === '/settings/appearance');
	const accountActive = $derived(page.url.pathname.startsWith('/settings/account'));
	const adminActive   = $derived(page.url.pathname.startsWith('/settings/admin'));
	const tabTitle = $derived(
		qrActive ? t.navQrCodes : exportActive ? t.navCatchExport : appearanceActive ? t.settingsAppearance
		: accountActive ? t.accountTitle : t.settingsBackupRestore
	);

	const tabStyle = (active: boolean) =>
		`font-size:0.8125rem; font-weight:500; padding:8px 16px; border-radius:8px; text-decoration:none; transition:var(--of-transition); ${active ? 'color:var(--of-text-bright); background:var(--of-bg-elevated); box-shadow:inset 0 0 0 1px var(--of-border);' : 'color:var(--of-text-3); background:transparent;'}`;
</script>

<div>
	<!-- Sub-nav -->
	<nav aria-label={t.navSettings} class="no-print" style="display:flex; gap:4px; margin-bottom:32px; padding:4px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; width:fit-content; flex-wrap:wrap;">
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

	{#if !adminActive}<h1 class="sr-only">{t.navSettings}: {tabTitle}</h1>{/if}
	{@render children()}
</div>
