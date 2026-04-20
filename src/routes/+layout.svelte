<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t, lang } = data;

	const luresActive = $derived(
		$page.url.pathname === '/' || $page.url.pathname.startsWith('/lures')
	);
	const settingsActive = $derived($page.url.pathname.startsWith('/settings'));
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Carter+One&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<link rel="icon" href={favicon} />
	<title>OpenFishing</title>
</svelte:head>

<div class="min-h-screen" style="background-color:#060d17; background-image: radial-gradient(ellipse at 15% 60%, rgba(6,182,212,0.04) 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(251,191,36,0.025) 0%, transparent 45%);">

	<!-- Top accent stripe -->
	<div class="h-px" style="background: linear-gradient(90deg, transparent, #22d3ee 30%, #06b6d4 50%, #22d3ee 70%, transparent);"></div>

	<!-- Main nav -->
	<header style="background-color:#0b1a2c; border-bottom: 1px solid #172f4a;">
		<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
			<div class="flex items-center gap-1">
				<a href="/" class="shrink-0 flex items-center gap-2 mr-2" style="font-family:'Carter One',sans-serif; font-weight:800; font-size:1.2rem; color:#e0eaf8; text-decoration:none; letter-spacing:-0.02em;">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
						<path d="M12 3C9.5 3 7.5 4.5 6.5 6.5C5 6.2 3 7 2 9C4 9.5 5.5 9 6.5 8C7 10 8.5 11.5 10.5 12C8 13.5 6 16.5 6 20C8 19 9.5 17 10 15C11 16.5 12.5 17.5 14 17.5C15.5 17.5 17 16.5 18 15C18.5 17 20 19 22 20C22 16.5 20 13.5 17.5 12C19.5 11.5 21 10 21.5 8C22.5 9 24 9.5 26 9C25 7 23 6.2 21.5 6.5C20.5 4.5 18.5 3 12 3Z" fill="currentColor" opacity="0.2"/>
						<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
						<circle cx="20" cy="8" r="2" fill="currentColor"/>
						<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
					</svg>
					OpenFishing
				</a>

				<a
					href="/"
					class="text-sm font-medium px-4 py-1.5 rounded-lg transition-all shrink-0"
					style={luresActive
						? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);'
						: 'color:#5d8fa8; border:1px solid transparent;'}
					onmouseenter={function(e) { if (!luresActive) { (e.currentTarget as HTMLElement).style.cssText += 'color:#c2dce8; background:rgba(255,255,255,0.05);'; } }}
					onmouseleave={function(e) { if (!luresActive) { (e.currentTarget as HTMLElement).style.cssText = 'color:#5d8fa8; border:1px solid transparent;'; } }}
				>
					{t.navLures}
				</a>

				<a
					href="/settings"
					class="text-sm font-medium px-4 py-1.5 rounded-lg transition-all shrink-0"
					style={settingsActive
						? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);'
						: 'color:#5d8fa8; border:1px solid transparent;'}
					onmouseenter={function(e) { if (!settingsActive) { (e.currentTarget as HTMLElement).style.cssText += 'color:#c2dce8; background:rgba(255,255,255,0.05);'; } }}
					onmouseleave={function(e) { if (!settingsActive) { (e.currentTarget as HTMLElement).style.cssText = 'color:#5d8fa8; border:1px solid transparent;'; } }}
				>
					{t.navSettings}
				</a>
			</div>

			<!-- Language switcher -->
			<form method="POST" action="/api/lang">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select
					name="lang"
					onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.8rem; border:1px solid #243f5e; border-radius:8px; padding:6px 10px; background:#0f2238; color:#8ab8cc; cursor:pointer; outline:none;"
				>
					<option value="en" selected={lang === 'en'}>🇬🇧 EN</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 DE</option>
				</select>
			</form>
		</div>
	</header>

	<!-- Sub nav -->
	<div class="no-print" style="background-color:#0b1a2c; border-bottom:1px solid rgba(23,47,74,0.6);">
		<div class="max-w-6xl mx-auto px-4 h-11 flex items-center gap-2">
			{#if settingsActive}
				<a
					href="/settings"
					class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all shrink-0"
					style="color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);"
				>
					Backup
				</a>
			{:else}
				<a
					href="/lures/new"
					class="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all shrink-0"
					style="background:#06b6d4; color:#030a12; border:1px solid transparent;"
					onmouseenter={function(e) { (e.currentTarget as HTMLElement).style.background = '#22d3ee'; }}
					onmouseleave={function(e) { (e.currentTarget as HTMLElement).style.background = '#06b6d4'; }}
				>
					+ {t.addLure}
				</a>
				<a
					href="/qr"
					class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all shrink-0"
					style={$page.url.pathname === '/qr'
						? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);'
						: 'color:#5d8fa8; border:1px solid transparent;'}
				>
					{t.navQrCodes}
				</a>
			{/if}
		</div>
	</div>

	<main class="max-w-6xl mx-auto px-4 py-6 sm:py-10">
		{@render children()}
	</main>
</div>
