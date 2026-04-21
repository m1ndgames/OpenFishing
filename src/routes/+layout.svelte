<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t, lang } = data;

	const luresActive    = $derived($page.url.pathname === '/' || $page.url.pathname.startsWith('/lures'));
	const spotsActive    = $derived($page.url.pathname.startsWith('/spots'));
	const catchesActive  = $derived($page.url.pathname.startsWith('/catches'));
	const settingsActive = $derived($page.url.pathname.startsWith('/settings') || $page.url.pathname === '/qr');

	let showAddMenu = $state(false);
</script>

<svelte:document onclick={(e) => {
	if (showAddMenu && !(e.target as Element).closest('[data-add-menu]')) showAddMenu = false;
}} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Carter+One&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<link rel="icon" href={favicon} />
	<title>OpenFishing</title>
</svelte:head>

<div class="min-h-screen" style="background-color:#060d17; background-image: radial-gradient(ellipse at 15% 60%, rgba(6,182,212,0.04) 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(251,191,36,0.025) 0%, transparent 45%);">

	<!-- Top accent stripe -->
	<div class="h-px no-print" style="background: linear-gradient(90deg, transparent, #22d3ee 30%, #06b6d4 50%, #22d3ee 70%, transparent);"></div>

	<!-- ── DESKTOP NAV (md+) ── -->
	<header class="no-print hidden md:block" style="background-color:#0b1a2c; border-bottom:1px solid #172f4a; position:relative; z-index:1000;">
		<div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">

			<!-- Logo -->
			<a href="/" style="font-family:'Carter One',sans-serif; font-size:1.15rem; color:#e0eaf8; text-decoration:none; letter-spacing:-0.01em; display:flex; align-items:center; gap:8px; margin-right:8px; flex-shrink:0;">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				OpenFishing
			</a>

			<!-- Nav links -->
			<a href="/"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={luresActive ? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);' : 'color:#5d8fa8; border:1px solid transparent;'}
				onmouseenter={function(e){ if (!luresActive) { (e.currentTarget as HTMLElement).style.color='#c2dce8'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!luresActive) { (e.currentTarget as HTMLElement).style.color='#5d8fa8'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navLures}</a>

			<a href="/spots"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={spotsActive ? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);' : 'color:#5d8fa8; border:1px solid transparent;'}
				onmouseenter={function(e){ if (!spotsActive) { (e.currentTarget as HTMLElement).style.color='#c2dce8'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!spotsActive) { (e.currentTarget as HTMLElement).style.color='#5d8fa8'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navSpots}</a>

			<a href="/catches"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={catchesActive ? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);' : 'color:#5d8fa8; border:1px solid transparent;'}
				onmouseenter={function(e){ if (!catchesActive) { (e.currentTarget as HTMLElement).style.color='#c2dce8'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!catchesActive) { (e.currentTarget as HTMLElement).style.color='#5d8fa8'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navCatches}</a>

			<a href="/settings"
				class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
				style={settingsActive ? 'color:#22d3ee; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);' : 'color:#5d8fa8; border:1px solid transparent;'}
				onmouseenter={function(e){ if (!settingsActive) { (e.currentTarget as HTMLElement).style.color='#c2dce8'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}}
				onmouseleave={function(e){ if (!settingsActive) { (e.currentTarget as HTMLElement).style.color='#5d8fa8'; (e.currentTarget as HTMLElement).style.background=''; }}}
			>{t.navSettings}</a>

			<div class="flex-1"></div>

			<!-- Add... dropdown -->
			<div data-add-menu="true" style="position:relative; flex-shrink:0;">
				<button
					onclick={() => showAddMenu = !showAddMenu}
					style="display:flex; align-items:center; gap:6px; font-size:0.875rem; font-weight:700; padding:7px 14px; border-radius:9px; border:1px solid transparent; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
						background:{showAddMenu ? '#22d3ee' : '#06b6d4'}; color:#030a12;"
					onmouseenter={function(e){ (e.currentTarget as HTMLElement).style.background='#22d3ee'; }}
					onmouseleave={function(e){ if (!showAddMenu) (e.currentTarget as HTMLElement).style.background='#06b6d4'; }}
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					Add
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-left:1px; transition:transform 0.15s; transform:{showAddMenu ? 'rotate(180deg)' : 'rotate(0deg)'}">
						<path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				{#if showAddMenu}
					<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:160px; background:#0f2238; border:1px solid #243f5e; border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
						<a href="/lures/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{t.addLure}
						</a>
						<a href="/spots/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
							{t.addSpot}
						</a>
						<a href="/catches/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500; transition:background 0.1s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 9 L20 6 M22 9 L20 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
							{t.addCatch}
						</a>
					</div>
				{/if}
			</div>

			<!-- Language switcher -->
			<form method="POST" action="/api/lang" style="flex-shrink:0;">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select name="lang" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.8rem; border:1px solid #243f5e; border-radius:8px; padding:5px 8px; background:#0f2238; color:#8ab8cc; cursor:pointer; outline:none;">
					<option value="en" selected={lang === 'en'}>🇬🇧 EN</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 DE</option>
				</select>
			</form>
		</div>
	</header>

	<!-- ── MOBILE TOP BAR (< md) ── -->
	<header class="no-print md:hidden" style="background-color:#0b1a2c; border-bottom:1px solid #172f4a;">
		<div class="px-4 h-12 flex items-center justify-between gap-2">
			<a href="/" style="font-family:'Carter One',sans-serif; font-size:1.1rem; color:#e0eaf8; text-decoration:none; display:flex; align-items:center; gap:7px; flex-shrink:0;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				OpenFishing
			</a>

			<div style="flex:1;"></div>

			<!-- Add... dropdown (mobile) -->
			<div data-add-menu="true" style="position:relative; flex-shrink:0;">
				<button
					onclick={() => showAddMenu = !showAddMenu}
					style="display:flex; align-items:center; gap:5px; font-size:0.78rem; font-weight:700; padding:6px 11px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; background:{showAddMenu ? '#22d3ee' : '#06b6d4'}; color:#030a12;"
				>
					<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					Add
				</button>
				{#if showAddMenu}
					<div style="position:absolute; top:calc(100% + 6px); right:0; min-width:160px; background:#0f2238; border:1px solid #243f5e; border-radius:10px; padding:4px; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
						<a href="/lures/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>
							{t.addLure}
						</a>
						<a href="/spots/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
							{t.addSpot}
						</a>
						<a href="/catches/new" onclick={() => showAddMenu = false}
							style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:7px; text-decoration:none; color:#c2dce8; font-size:0.875rem; font-weight:500;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.08)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M22 9 L20 6 M20 12 L22 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
							{t.addCatch}
						</a>
					</div>
				{/if}
			</div>

			<!-- Language switcher -->
			<form method="POST" action="/api/lang" style="flex-shrink:0;">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select name="lang" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.78rem; border:1px solid #243f5e; border-radius:7px; padding:4px 7px; background:#0f2238; color:#8ab8cc; cursor:pointer; outline:none;">
					<option value="en" selected={lang === 'en'}>🇬🇧 EN</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 DE</option>
				</select>
			</form>
		</div>
	</header>

	<!-- Content -->
	<main class="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="no-print pb-20 md:pb-6" style="border-top:1px solid #0f2238; padding-top:20px; background:transparent;">
		<div class="max-w-6xl mx-auto px-4">
			<div style="display:flex; justify-content:center;">
				<a href="https://github.com/m1ndgames/openfishing" target="_blank" rel="noopener noreferrer"
					style="display:flex; align-items:center; gap:8px; text-decoration:none; color:#3d6a84; transition:color 0.15s; font-size:0.8rem; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
					</svg>
					OpenFishing
				</a>
			</div>
		</div>
	</footer>

	<!-- ── MOBILE BOTTOM TAB NAV (< md) ── -->
	<nav class="no-print flex md:hidden items-stretch" style="position:fixed; bottom:0; left:0; right:0; height:64px; background:#0b1a2c; border-top:1px solid #172f4a; z-index:50; padding-bottom:env(safe-area-inset-bottom);">

		<!-- Lures -->
		<a href="/" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{luresActive ? '#22d3ee' : '#3d6a84'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
				<rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
				<rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
				<rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill={luresActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navLures}</span>
		</a>

		<!-- Spots -->
		<a href="/spots" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{spotsActive ? '#22d3ee' : '#3d6a84'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.6" fill={spotsActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
				<circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.6" fill={spotsActive ? 'rgba(34,211,238,0.3)' : 'none'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navSpots}</span>
		</a>

		<!-- Catches -->
		<a href="/catches" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{catchesActive ? '#22d3ee' : '#3d6a84'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill={catchesActive ? 'rgba(34,211,238,0.15)' : 'none'}/>
				<path d="M22 9 L20 6 M22 9 L20 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				<circle cx="7" cy="11" r="1" fill="currentColor" opacity={catchesActive ? '1' : '0.5'}/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navCatches}</span>
		</a>

		<!-- Settings -->
		<a href="/settings" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; transition:color 0.15s; color:{settingsActive ? '#22d3ee' : '#3d6a84'};">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" fill={settingsActive ? 'rgba(34,211,238,0.2)' : 'none'}/>
				<path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
			</svg>
			<span style="font-size:0.65rem; font-weight:600; letter-spacing:0.03em;">{t.navSettings}</span>
		</a>
	</nav>
</div>

<style>
	@media print {
		:global(.no-print) { display: none !important; }
	}
</style>
