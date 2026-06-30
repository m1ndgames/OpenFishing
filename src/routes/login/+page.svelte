<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const { t } = data;

	let showPassword = $state(false);
</script>

<svelte:head>
	<title>OpenFishing — Login</title>
</svelte:head>

<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--of-bg-base);">
	<div style="width:100%; max-width:360px;">

		<!-- Logo / title -->
		<div style="text-align:center; margin-bottom:32px;">
			<svg width="48" height="48" viewBox="0 0 64 64" fill="none" style="margin:0 auto 12px; display:block; color:var(--of-accent-solid);">
				<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.15"/>
				<ellipse cx="36" cy="32" rx="14" ry="7" stroke="currentColor" stroke-width="1.8" fill="none"/>
				<ellipse cx="31" cy="29" rx="5" ry="2.5" fill="currentColor" opacity="0.4"/>
				<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none"/>
				<circle cx="48" cy="32" r="1.1" fill="currentColor"/>
				<line x1="18" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
				<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
			<h1 style="font-family:'Carter One',sans-serif; font-size:1.6rem; color:var(--of-text-bright); margin:0 0 4px;">OpenFishing</h1>
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.loginSubtitle}</p>
		</div>

		<!-- Card -->
		<form method="POST" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:20px;">

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
						aria-label={showPassword ? 'Hide password' : 'Show password'}
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
		</form>
	</div>
</div>
