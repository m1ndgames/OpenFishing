<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import Chatbot from '$lib/components/Chatbot.svelte';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t, lang, demoMode, chatbotEnabled } = data;

	const adminActive = $derived($page.url.pathname.startsWith('/admin'));
	const accountActive = $derived($page.url.pathname.startsWith('/account'));
	let showUserMenu = $state(false);

	$effect(() => {
		document.documentElement.setAttribute('data-mode', data.colorMode);
		document.documentElement.setAttribute('data-theme', data.themeName);
	});

	const isLoginPage    = $derived($page.url.pathname === '/login');
	const isSharePage    = $derived($page.url.pathname.startsWith('/share/'));
	const luresActive    = $derived($page.url.pathname === '/' || $page.url.pathname.startsWith('/lures'));
	const spotsActive    = $derived($page.url.pathname.startsWith('/spots'));
	const catchesActive  = $derived($page.url.pathname.startsWith('/catches'));
	const statsActive    = $derived($page.url.pathname.startsWith('/stats'));
	const tackleActive   = $derived($page.url.pathname.startsWith('/tackle'));
	const settingsActive = $derived($page.url.pathname.startsWith('/settings') || $page.url.pathname === '/qr');

	let showAddMenu = $state(false);

	let demoToast = $state(false);
	let demoToastTimer: ReturnType<typeof setTimeout>;

	function showDemoMessage() {
		demoToast = true;
		clearTimeout(demoToastTimer);
		demoToastTimer = setTimeout(() => { demoToast = false; }, 3500);
	}

	onMount(() => {
		if (!demoMode) return;
		const handler = (e: Event) => {
			const form = e.target as HTMLFormElement;
			// Allow the language switcher through
			if ((form.getAttribute('action') ?? '').includes('/api/lang')) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			showDemoMessage();
		};
		// Capture phase — fires before use:enhance on the form element
		document.addEventListener('submit', handler, true);
		return () => document.removeEventListener('submit', handler, true);
	});
</script>

<svelte:document onclick={(e) => {
	if (showAddMenu && !(e.target as Element).closest('[data-add-menu]')) showAddMenu = false;
	if (showUserMenu && !(e.target as Element).closest('[data-user-menu]')) showUserMenu = false;
}} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<link rel="icon" href={favicon} />
	<title>OpenFishing</title>
</svelte:head>

{#if isLoginPage || isSharePage}
	{@render children()}
{:else}
<div class="min-h-screen" style="background-color:var(--of-bg-base); background-image: radial-gradient(ellipse at 15% 60%, var(--of-accent-bg) 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(251,191,36,0.025) 0%, transparent 45%);">

	<!-- Top accent stripe -->
	<div class="h-px no-print" style="background: linear-gradient(90deg, transparent, var(--of-accent) 30%, var(--of-accent-solid) 50%, var(--of-accent) 70%, transparent);"></div>

	<!-- Demo mode banner -->
	{#if demoMode}
	<div class="no-print" style="background:var(--of-warning-bg); border-bottom:1px solid var(--of-warning-border); padding:7px 16px; display:flex; align-items:center; justify-content:center; gap:8px;">
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:var(--of-warning-solid); flex-shrink:0;">
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/>
			<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
		</svg>
		<span style="font-size:0.8rem; color:var(--of-warning); font-weight:500; font-family:'DM Sans',sans-serif;">{t.demoBanner}</span>
	</div>
	{/if}

	<!-- ── DESKTOP NAV (md+) ── -->
	<header class="no-print hidden md:block" style="background-color:var(--of-bg-surface); border-bottom:1px solid var(--of-border-subtle); position:relative; z-index:1000;">
		<div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">

			<!-- Logo -->
			<a href="/" style="text-decoration:none; display:flex; align-items:center; margin-right:8px; flex-shrink:0; color:var(--of-text-bright);">
				<svg viewBox="0 0 192 52" height="26" fill="none" role="img" aria-label="OpenFishing">
					<text x="2" y="35" font-family="'Inter','Segoe UI',system-ui,-apple-system,sans-serif" font-style="italic" font-size="26" letter-spacing="-0.5" fill="currentColor">
						<tspan font-weight="400">Open</tspan><tspan font-weight="800">Fishing</tspan>
					</text>
				</svg>
			</a>

			<!-- Nav links -->
			<a href="/"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={luresActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!luresActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!luresActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navLures}</a>

			<a href="/tackle"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={tackleActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!tackleActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!tackleActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navTackle}</a>

			<a href="/spots"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={spotsActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!spotsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!spotsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navSpots}</a>

			<a href="/catches"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={catchesActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!catchesActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!catchesActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navCatches}</a>

			<a href="/stats"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={statsActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!statsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!statsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navStats}</a>

			<a href="/settings"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={settingsActive ? 'color:var(--of-accent); background:var(--of-accent-glow); border:1px solid var(--of-accent-border);' : 'color:var(--of-text-3); border:1px solid transparent;'}
				onmouseenter={function(e){ if (!settingsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!settingsActive) { (e.currentTarget as HTMLElement).style.color='var(--of-text-3)'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navSettings}</a>

			<div class="flex-1"></div>

				<!-- User menu (desktop) -->
				{#if data.user}
				<div data-user-menu="true" style="position:relative; flex-shrink:0;">
					<button
						onclick={() => showUserMenu = !showUserMenu}
						title={data.user.email}
						style="display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:600; padding:6px 11px; border-radius:9px; cursor:pointer; font-family:'DM Sans',sans-serif;
							border:1px solid {(adminActive || accountActive) ? 'var(--of-accent-border)' : 'var(--of-border)'};
							background:{(adminActive || accountActive) ? 'var(--of-accent-glow)' : 'var(--of-bg-elevated)'};
							color:{(adminActive || accountActive) ? 'var(--of-accent)' : 'var(--of-text-2)'};">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
						{data.user.username}
					</button>
					{#if showUserMenu}
						<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:170px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
							<a href="/account" onclick={() => showUserMenu = false} style="display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.85rem; font-weight:500;"
								onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}} onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}>
								{t.navAccount}
							</a>
							{#if data.user.isAdmin}
								<a href="/admin" onclick={() => showUserMenu = false} style="display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.85rem; font-weight:500;"
									onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}} onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}>
									{t.navAdmin}
								</a>
							{/if}
							<form method="POST" action="/logout" style="margin:0;">
								<button type="submit" style="width:100%; text-align:left; display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:7px; background:none; border:none; cursor:pointer; color:var(--of-danger); font-size:0.85rem; font-weight:500; font-family:'DM Sans',sans-serif;">
									{t.navLogout}
								</button>
							</form>
						</div>
					{/if}
				</div>
				{/if}

			<!-- Add... dropdown -->
			<div data-add-menu="true" style="position:relative; flex-shrink:0;">
				<button
					onclick={() => showAddMenu = !showAddMenu}
					style="display:flex; align-items:center; gap:6px; font-size:0.875rem; font-weight:700; padding:7px 14px; border-radius:9px; border:1px solid transparent; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
						background:{showAddMenu ? 'var(--of-accent)' : 'var(--of-accent-solid)'}; color:var(--of-ink);"
					onmouseenter={function(e){ (e.currentTarget as HTMLElement).style.background='var(--of-accent)'; }}
					onmouseleave={function(e){ if (!showAddMenu) (e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)'; }}
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					{t.add}
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-left:1px; transition:transform 0.15s; transform:{showAddMenu ? 'rotate(180deg)' : 'rotate(0deg)'}">
						<path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				{#if showAddMenu}
					<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:160px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
						<a href="/lures/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{t.navAddLure}
						</a>
						<a href="/spots/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
							{t.navAddSpot}
						</a>
						<a href="/catches/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='var(--of-text)';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 9 L20 6 M22 9 L20 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
							{t.navAddCatch}
						</a>
					</div>
				{/if}
			</div>

			<!-- Language switcher -->
			<form method="POST" action="/api/lang" style="flex-shrink:0;">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select name="lang" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.8rem; border:1px solid var(--of-border); border-radius:8px; padding:5px 8px; background:var(--of-bg-elevated); color:var(--of-text-2); cursor:pointer; outline:none;">
					<option value="en" selected={lang === 'en'}>🇬🇧 EN</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 DE</option>
					<option value="nl" selected={lang === 'nl'}>🇳🇱 NL</option>
					<option value="fr" selected={lang === 'fr'}>🇫🇷 FR</option>
					<option value="es" selected={lang === 'es'}>🇪🇸 ES</option>
					<option value="it" selected={lang === 'it'}>🇮🇹 IT</option>
					<option value="pt" selected={lang === 'pt'}>🇵🇹 PT</option>
					<option value="pl" selected={lang === 'pl'}>🇵🇱 PL</option>
					<option value="uk" selected={lang === 'uk'}>🇺🇦 UK</option>
				</select>
			</form>
		</div>
	</header>

	<!-- ── MOBILE TOP BAR (< md) ── -->
	<header class="no-print md:hidden" style="background-color:var(--of-bg-surface); border-bottom:1px solid var(--of-border-subtle);">
		<div class="px-4 h-12 flex items-center justify-between gap-2">
			<a href="/" style="text-decoration:none; display:flex; align-items:center; flex-shrink:0; color:var(--of-text-bright);">
				<svg viewBox="0 0 192 52" height="22" fill="none" role="img" aria-label="OpenFishing">
					<text x="2" y="35" font-family="'Inter','Segoe UI',system-ui,-apple-system,sans-serif" font-style="italic" font-size="26" letter-spacing="-0.5" fill="currentColor">
						<tspan font-weight="400">Open</tspan><tspan font-weight="800">Fishing</tspan>
					</text>
				</svg>
			</a>

			<div style="flex:1;"></div>

				<!-- User menu (mobile) -->
				{#if data.user}
				<div data-user-menu="true" style="position:relative; flex-shrink:0;">
					<button
						onclick={() => showUserMenu = !showUserMenu}
						aria-label={data.user.username}
						style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; cursor:pointer;
							border:1px solid {(adminActive || accountActive) ? 'var(--of-accent-border)' : 'var(--of-border)'};
							background:{(adminActive || accountActive) ? 'var(--of-accent-glow)' : 'var(--of-bg-elevated)'};
							color:{(adminActive || accountActive) ? 'var(--of-accent)' : 'var(--of-text-2)'};">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
					</button>
					{#if showUserMenu}
						<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:170px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
							<div style="padding:7px 12px 4px; font-size:0.78rem; color:var(--of-text-4); font-weight:600;">{data.user.username}</div>
							<a href="/account" onclick={() => showUserMenu = false} style="display:flex; align-items:center; gap:9px; padding:10px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500;">{t.navAccount}</a>
							{#if data.user.isAdmin}
								<a href="/admin" onclick={() => showUserMenu = false} style="display:flex; align-items:center; gap:9px; padding:10px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500;">{t.navAdmin}</a>
							{/if}
							<form method="POST" action="/logout" style="margin:0;">
								<button type="submit" style="width:100%; text-align:left; padding:10px 12px; border-radius:7px; background:none; border:none; cursor:pointer; color:var(--of-danger); font-size:0.875rem; font-weight:500; font-family:'DM Sans',sans-serif;">{t.navLogout}</button>
							</form>
						</div>
					{/if}
				</div>
				{/if}

			<!-- Add... dropdown (mobile) -->
			<div data-add-menu="true" style="position:relative; flex-shrink:0;">
				<button
					onclick={() => showAddMenu = !showAddMenu}
					style="display:flex; align-items:center; gap:5px; font-size:0.78rem; font-weight:700; padding:6px 11px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; background:{showAddMenu ? 'var(--of-accent)' : 'var(--of-accent-solid)'}; color:var(--of-ink);"
				>
					<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					{t.add}
				</button>
				{#if showAddMenu}
					<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:160px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
						<a href="/lures/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{t.navAddLure}
						</a>
						<a href="/spots/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
							{t.navAddSpot}
						</a>
						<a href="/catches/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:var(--of-text); font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-bg)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 9 L20 6 M20 12 L22 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
							{t.navAddCatch}
						</a>
					</div>
				{/if}
			</div>

			<!-- Language switcher -->
			<form method="POST" action="/api/lang" style="flex-shrink:0;">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select name="lang" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.78rem; border:1px solid var(--of-border); border-radius:7px; padding:4px 7px; background:var(--of-bg-elevated); color:var(--of-text-2); cursor:pointer; outline:none;">
					<option value="en" selected={lang === 'en'}>🇬🇧 EN</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 DE</option>
					<option value="nl" selected={lang === 'nl'}>🇳🇱 NL</option>
					<option value="fr" selected={lang === 'fr'}>🇫🇷 FR</option>
					<option value="es" selected={lang === 'es'}>🇪🇸 ES</option>
					<option value="it" selected={lang === 'it'}>🇮🇹 IT</option>
					<option value="pt" selected={lang === 'pt'}>🇵🇹 PT</option>
					<option value="pl" selected={lang === 'pl'}>🇵🇱 PL</option>
					<option value="uk" selected={lang === 'uk'}>🇺🇦 UK</option>
				</select>
			</form>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="no-print pb-20 md:pb-6" style="border-top:1px solid var(--of-bg-elevated); padding-top:20px; background:transparent;">
		<div class="max-w-6xl mx-auto px-4">
			<div style="display:flex; justify-content:center; align-items:center; gap:12px;">

				<!-- GitHub -->
				<a href="https://github.com/m1ndgames/openfishing" target="_blank" rel="noopener noreferrer"
					title="GitHub"
					style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:var(--of-bg-elevated); border:1px solid var(--of-border-subtle); color:var(--of-text-4); text-decoration:none; transition:color 0.15s, border-color 0.15s, background 0.15s; flex-shrink:0;"
					onmouseenter={function(e){const el=e.currentTarget as HTMLElement; el.style.color='var(--of-text)'; el.style.borderColor='var(--of-text-4)'; el.style.background='var(--of-border-subtle)';}}
					onmouseleave={function(e){const el=e.currentTarget as HTMLElement; el.style.color='var(--of-text-4)'; el.style.borderColor='var(--of-border-subtle)'; el.style.background='var(--of-bg-elevated)';}}
				>
					<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
					</svg>
				</a>

				<!-- Discord -->
				<a href="https://discord.gg/jETYPFXdGr" target="_blank" rel="noopener noreferrer"
					title="Discord"
					style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:var(--of-bg-elevated); border:1px solid var(--of-border-subtle); color:var(--of-text-4); text-decoration:none; transition:color 0.15s, border-color 0.15s, background 0.15s; flex-shrink:0;"
					onmouseenter={function(e){const el=e.currentTarget as HTMLElement; el.style.color='#5865f2'; el.style.borderColor='#5865f2'; el.style.background='rgba(88,101,242,0.1)';}}
					onmouseleave={function(e){const el=e.currentTarget as HTMLElement; el.style.color='var(--of-text-4)'; el.style.borderColor='var(--of-border-subtle)'; el.style.background='var(--of-bg-elevated)';}}
				>
					<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.01.022.02.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
					</svg>
				</a>

				<!-- Ko-Fi -->
				<a href="https://ko-fi.com/m1ndio" target="_blank" rel="noopener noreferrer"
					title="Ko-Fi"
					style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:var(--of-bg-elevated); border:1px solid var(--of-border-subtle); color:var(--of-text-4); text-decoration:none; transition:color 0.15s, border-color 0.15s, background 0.15s; flex-shrink:0;"
					onmouseenter={function(e){const el=e.currentTarget as HTMLElement; el.style.color='#ff5e5b'; el.style.borderColor='#ff5e5b'; el.style.background='rgba(255,94,91,0.1)';}}
					onmouseleave={function(e){const el=e.currentTarget as HTMLElement; el.style.color='var(--of-text-4)'; el.style.borderColor='var(--of-border-subtle)'; el.style.background='var(--of-bg-elevated)';}}
				>
					<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.655.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
					</svg>
				</a>

			</div>
		</div>
	</footer>

	<!-- ── MOBILE BOTTOM TAB NAV (< md) ── -->
	<nav class="no-print flex md:hidden items-stretch" style="position:fixed; bottom:0; left:0; right:0; height:64px; background:var(--of-bg-surface); border-top:1px solid var(--of-border-subtle); z-index:50; padding-bottom:env(safe-area-inset-bottom);">

		<!-- Lures -->
		<a href="/" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{luresActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navLures}</span>
		</a>

		<!-- Spots -->
		<a href="/spots" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{spotsActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6" fill={spotsActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.6" fill={spotsActive ? 'var(--of-accent-border)' : 'none'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navSpots}</span>
		</a>

		<!-- Catches -->
		<a href="/catches" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{catchesActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill={catchesActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<path d="M22 9 L20 6 M22 9 L20 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				<circle cx="7" cy="11" r="1" fill="currentColor" opacity={catchesActive ? '1' : '0.5'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navCatches}</span>
		</a>

		<!-- Stats -->
		<a href="/stats" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{statsActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.6" fill={statsActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.6" fill={statsActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.6" fill={statsActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
			</svg>
			<span style="font-size:0.6rem; font-weight:600; letter-spacing:0.02em;">{t.navStats}</span>
		</a>

		<!-- Tackle -->
		<a href="/tackle" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{tackleActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path d="M3 21L20 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				<circle cx="7.5" cy="16.5" r="3" stroke="currentColor" stroke-width="1.5" fill={tackleActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<circle cx="7.5" cy="16.5" r="1" fill="currentColor" opacity={tackleActive ? '1' : '0.5'}/>
			</svg>
			<span style="font-size:0.6rem; font-weight:600; letter-spacing:0.02em;">{t.navTackle}</span>
		</a>

		<!-- Settings -->
		<a href="/settings" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{settingsActive ? 'var(--of-accent)' : 'var(--of-text-4)'};">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" fill={settingsActive ? 'var(--of-accent-bg-hover)' : 'none'}/>
				<path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
			</svg>
			<span style="font-size:0.6rem; font-weight:600; letter-spacing:0.02em;">{t.navSettings}</span>
		</a>
	</nav>

	<!-- AI Chatbot -->
	{#if chatbotEnabled}
		<Chatbot {t} />
	{/if}

	<!-- Demo mode toast -->
	{#if demoToast}
		<div style="position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:9999; background:var(--of-bg-elevated); border:1px solid var(--of-warning-border); border-radius:12px; padding:13px 20px; display:flex; align-items:center; gap:10px; box-shadow:0 8px 32px rgba(0,0,0,0.5); pointer-events:none; white-space:nowrap;">
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="color:var(--of-warning-solid); flex-shrink:0;">
				<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/>
				<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
			</svg>
			<span style="font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:500; color:var(--of-warning);">{t.demoToast}</span>
		</div>
	{/if}
</div>
{/if}

<style>
	@media print {
		:global(.no-print) { display: none !important; }
	}
</style>
