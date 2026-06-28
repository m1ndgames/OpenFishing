<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t } = data;

	const qrActive      = $derived($page.url.pathname === '/settings/qr');
	const exportActive  = $derived($page.url.pathname === '/settings/export');
	const backupActive  = $derived($page.url.pathname === '/settings' || $page.url.pathname === '/settings/');
	const appearanceActive = $derived($page.url.pathname === '/settings/appearance');
</script>

<div>
	<!-- Sub-nav -->
	<nav class="no-print" style="display:flex; gap:6px; margin-bottom:28px; padding:4px; background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:12px; width:fit-content;">
		<a href="/settings"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{backupActive ? 'color:var(--of-ink); background:var(--of-accent-solid);' : 'color:var(--of-text-3); background:transparent;'}"
		>{t.settingsBackupRestore}</a>
		<a href="/settings/qr"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{qrActive ? 'color:var(--of-ink); background:var(--of-accent-solid);' : 'color:var(--of-text-3); background:transparent;'}"
		>{t.navQrCodes}</a>
		<a href="/settings/export"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{exportActive ? 'color:var(--of-ink); background:var(--of-accent-solid);' : 'color:var(--of-text-3); background:transparent;'}"
		>{t.navCatchExport}</a>
		<a href="/settings/appearance"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{appearanceActive ? 'color:var(--of-ink); background:var(--of-accent-solid);' : 'color:var(--of-text-3); background:transparent;'}"
		>{t.settingsAppearance}</a>
	</nav>

	{@render children()}
</div>
