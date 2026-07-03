<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { THEMES } from '$lib/themes';

	let { data }: { data: PageData } = $props();
	const { t, lang, demoMode } = data;

	let selectedMode = $state(data.colorMode);
	let selectedTheme = $state(data.themeName);
	let saved = $state(false);
	let saveTimer: ReturnType<typeof setTimeout>;

	function onSaved() {
		saved = true;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => { saved = false; }, 2000);
	}

</script>

<div style="display:flex; flex-direction:column; gap:16px;">

	<!-- Language -->
	<section style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">
		<div style="padding:20px;">
			<p style="font-weight:600; color:var(--of-text); margin:0 0 16px; font-size:0.925rem;">{t.settingsLanguage}</p>
			<form method="POST" action="/api/lang">
				<input type="hidden" name="redirect" value={$page.url.pathname} />
				<select name="lang" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
					style="font-size:0.875rem; border:1px solid var(--of-border); border-radius:9px; padding:8px 12px; background:var(--of-bg-elevated); color:var(--of-text-2); cursor:pointer; outline:none; min-width:160px;">
					<option value="en" selected={lang === 'en'}>🇬🇧 English</option>
					<option value="de" selected={lang === 'de'}>🇩🇪 Deutsch</option>
					<option value="nl" selected={lang === 'nl'}>🇳🇱 Nederlands</option>
					<option value="fr" selected={lang === 'fr'}>🇫🇷 Français</option>
					<option value="es" selected={lang === 'es'}>🇪🇸 Español</option>
					<option value="it" selected={lang === 'it'}>🇮🇹 Italiano</option>
					<option value="pt" selected={lang === 'pt'}>🇵🇹 Português</option>
					<option value="pl" selected={lang === 'pl'}>🇵🇱 Polski</option>
					<option value="uk" selected={lang === 'uk'}>🇺🇦 Українська</option>
				</select>
			</form>
		</div>
	</section>

	<!-- Color mode -->
	<section style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">
		<div style="padding:20px;">
			<p style="font-weight:600; color:var(--of-text); margin:0 0 16px; font-size:0.925rem;">{t.appearanceColorMode}</p>

			<form
				method="POST"
				action="?/setMode"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
						onSaved();
					};
				}}
			>
				<div style="display:flex; gap:8px; flex-wrap:wrap;">
					{#each [
						{ value: 'dark',   icon: '🌑', label: t.appearanceModeDark },
						{ value: 'light',  icon: '☀️', label: t.appearanceModeLight },
						{ value: 'system', icon: '💻', label: t.appearanceModeSystem }
					] as opt}
						<label style="cursor:pointer;">
							<input
								type="radio"
								name="colorMode"
								value={opt.value}
								bind:group={selectedMode}
								class="sr-only"
								onchange={(e) => {
									const el = e.currentTarget as HTMLInputElement;
									if (demoMode) {
										document.documentElement.setAttribute('data-mode', el.value);
										return;
									}
									el.form?.requestSubmit();
								}}
							/>
							<span style="display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:10px; font-size:0.875rem; font-weight:600; font-family:'DM Sans',sans-serif; transition:all 0.15s; border:1px solid {selectedMode === opt.value ? 'var(--of-accent-border)' : 'var(--of-border)'}; background:{selectedMode === opt.value ? 'var(--of-accent-bg-hover)' : 'var(--of-bg-elevated)'}; color:{selectedMode === opt.value ? 'var(--of-accent)' : 'var(--of-text-2)'};">
								<span style="font-size:1rem; line-height:1;">{opt.icon}</span>
								{opt.label}
							</span>
						</label>
					{/each}
				</div>

				{#if saved}
					<p style="margin:12px 0 0; font-size:0.8rem; color:var(--of-success);">{t.appearanceSaved}</p>
				{/if}
			</form>
		</div>
	</section>

	<!-- Theme -->
	<section style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">
		<div style="padding:20px;">
			<p style="font-weight:600; color:var(--of-text); margin:0 0 16px; font-size:0.925rem;">{t.appearanceTheme}</p>

			<form
				method="POST"
				action="?/setTheme"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
						onSaved();
					};
				}}
			>
				<div style="display:flex; gap:8px; flex-wrap:wrap;">
					{#each THEMES as theme}
						{@const active = selectedTheme === theme.id}
						<label style="cursor:pointer; flex:1 1 100px; min-width:100px; max-width:160px; display:flex;">
							<input
								type="radio"
								name="themeName"
								value={theme.id}
								bind:group={selectedTheme}
								class="sr-only"
								onchange={(e) => {
									const el = e.currentTarget as HTMLInputElement;
									if (demoMode) {
										document.documentElement.setAttribute('data-theme', el.value);
										return;
									}
									el.form?.requestSubmit();
								}}
							/>
							<div style="
								flex:1 1 100px; min-width:100px; max-width:160px; border-radius:12px; overflow:hidden;
								border:2px solid {active ? 'var(--of-accent-border)' : 'var(--of-border)'};
								background:{active ? 'var(--of-accent-bg-hover)' : 'var(--of-bg-elevated)'};
								transition:all 0.15s;
							">
								<!-- Swatch preview -->
								<div style="height:56px; background:{theme.bg}; display:flex; align-items:flex-end; padding:8px; gap:5px; border-bottom:1px solid {theme.border};">
									<div style="width:14px; height:14px; border-radius:50%; background:{theme.surface}; border:1px solid {theme.border};"></div>
									<div style="flex:1; height:8px; border-radius:4px; background:{theme.surface};"></div>
									<div style="width:20px; height:14px; border-radius:4px; background:{theme.accent};"></div>
								</div>
								<!-- Label -->
								<div style="padding:8px 10px;">
									<p style="margin:0; font-size:0.8rem; font-weight:600; color:{active ? 'var(--of-accent)' : 'var(--of-text-2)'}; font-family:'DM Sans',sans-serif;">{theme.label}</p>
								</div>
							</div>
						</label>
					{/each}
				</div>
			</form>
		</div>
	</section>

</div>
