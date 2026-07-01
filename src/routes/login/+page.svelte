<script lang="ts">
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';
	import logo from '$lib/assets/openfishing-logo.svg?raw';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	let showPassword = $state(false);
	const justReset = $derived($page.url.searchParams.has('reset'));
</script>

<svelte:head>
	<title>OpenFishing — Login</title>
</svelte:head>

<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--of-bg-base);">
	<div style="width:100%; max-width:360px;">

		<!-- Logo / title -->
		<div style="text-align:center; margin-bottom:32px;">
			<div style="margin-bottom:16px; color:var(--of-accent);">
				{@html logo.replace('<svg ', '<svg style="width:100%;display:block;" ')}
			</div>
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.loginSubtitle}</p>
		</div>

		<!-- Card -->
		<form method="POST" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:20px;">

			{#if justReset}
				<div style="background:var(--of-success-bg); border:1px solid var(--of-success-border); color:var(--of-success); font-size:0.875rem; padding:10px 14px; border-radius:9px;">
					{t.resetSuccess}
				</div>
			{/if}

			{#if form?.error}
				<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.875rem; padding:10px 14px; border-radius:9px;">
					{t.loginError}
				</div>
			{/if}

			<div>
				<label for="identifier" style="display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">{t.loginIdentifierLabel}</label>
				<input
					id="identifier"
					name="identifier"
					type="text"
					autofocus
					autocomplete="username"
					style="width:100%; padding:9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s, box-shadow 0.15s;"
					onfocus={function(e){(e.target as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.target as HTMLElement).style.boxShadow='0 0 0 3px var(--of-accent-glow)';}}
					onblur={function(e){(e.target as HTMLElement).style.borderColor='var(--of-border)'; (e.target as HTMLElement).style.boxShadow='none';}}
				/>
			</div>

			<div>
				<label for="password" style="display:block; font-size:0.78rem; font-weight:500; color:var(--of-text-3); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">{t.loginPasswordLabel}</label>
				<div style="position:relative;">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						style="width:100%; padding:9px 40px 9px 12px; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:9px; color:var(--of-text); font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s, box-shadow 0.15s;"
						onfocus={function(e){(e.target as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.target as HTMLElement).style.boxShadow='0 0 0 3px var(--of-accent-glow)';}}
						onblur={function(e){(e.target as HTMLElement).style.borderColor='var(--of-border)'; (e.target as HTMLElement).style.boxShadow='none';}}
					/>
					<button
						type="button"
						onclick={() => showPassword = !showPassword}
						style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--of-text-4); padding:2px; display:flex; align-items:center;"
						aria-label={showPassword ? t.loginHidePassword : t.loginShowPassword}
					>
						{#if showPassword}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
								<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button
				type="submit"
				style="background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:11px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>
				{t.loginSubmit}
			</button>

			{#if data.mailEnabled}
				<a href="/forgot-password" style="text-align:center; font-size:0.8rem; color:var(--of-text-4); text-decoration:none;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-4)';}}
				>{t.loginForgotPassword}</a>
			{/if}
		</form>
	</div>
</div>
