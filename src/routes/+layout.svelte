<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const { t, lang } = data;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>OpenFishing</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 shadow-sm">
		<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
			<a href="/" class="text-xl font-bold text-blue-600 tracking-tight shrink-0">🎣 OpenFishing</a>

			<div class="flex items-center gap-2">
				<!-- Language switcher -->
				<form method="POST" action="/api/lang">
					<input type="hidden" name="redirect" value={$page.url.pathname} />
					<select
						name="lang"
						onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
						class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
					>
						<option value="en" selected={lang === 'en'}>EN</option>
						<option value="de" selected={lang === 'de'}>DE</option>
					</select>
				</form>

				<a
					href="/qr"
					class="text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0
					       {$page.url.pathname === '/qr' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}"
				>
					{t.navQrCodes}
				</a>

				<a
					href="/lures/new"
					class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
				>
					{t.addLure}
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-4 py-4 sm:py-8">
		{@render children()}
	</main>
</div>
