<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t } = data;

	const qrActive      = $derived($page.url.pathname === '/settings/qr');
	const backupActive  = $derived($page.url.pathname === '/settings' || $page.url.pathname === '/settings/');
</script>

<div>
	<!-- Sub-nav -->
	<nav class="no-print" style="display:flex; gap:6px; margin-bottom:28px; padding:4px; background:#0b1a2c; border:1px solid #172f4a; border-radius:12px; width:fit-content;">
		<a href="/settings"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{backupActive ? 'color:#030a12; background:#06b6d4;' : 'color:#5d8fa8; background:transparent;'}"
		>{t.settingsBackupRestore}</a>
		<a href="/settings/qr"
			style="font-size:0.8rem; font-weight:600; padding:7px 14px; border-radius:8px; text-decoration:none; transition:all 0.15s; letter-spacing:0.02em;
				{qrActive ? 'color:#030a12; background:#06b6d4;' : 'color:#5d8fa8; background:transparent;'}"
		>{t.navQrCodes}</a>
	</nav>

	{@render children()}
</div>
