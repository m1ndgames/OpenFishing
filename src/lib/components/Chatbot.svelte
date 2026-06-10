<script lang="ts">
	import { tick } from 'svelte';
	import type { Translations } from '$lib/i18n';

	type Message = { role: 'user' | 'assistant'; content: string };

	let { t }: { t: Translations } = $props();

	let open = $state(false);
	let messages = $state<Message[]>([]);
	let input = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);
	let location = $state<{ lat: number; lng: number } | null>(null);

	$effect(() => {
		if (open && !location && typeof navigator !== 'undefined' && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => { location = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
				() => { /* permission denied or unavailable — context will be omitted */ }
			);
		}
	});

	async function scrollToBottom() {
		await tick();
		if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	async function send() {
		const text = input.trim();
		if (!text || loading) return;
		input = '';
		errorMsg = '';
		messages = [...messages, { role: 'user', content: text }];
		loading = true;
		await scrollToBottom();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages,
					context: {
						datetime: new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }),
						lat: location?.lat,
						lng: location?.lng
					}
				})
			});
			if (!res.ok) throw new Error(`Error ${res.status}`);
			const data = await res.json();
			messages = [...messages, { role: 'assistant', content: data.reply }];
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Something went wrong';
		} finally {
			loading = false;
			await scrollToBottom();
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<!-- Floating open button — hidden while panel is open -->
{#if !open}
<button
	onclick={() => (open = true)}
	aria-label={t.chatbotOpen}
	style="
		position:fixed;
		bottom:80px;
		right:20px;
		width:52px; height:52px;
		border-radius:50%;
		background:#06b6d4;
		border:1.5px solid #22d3ee;
		color:#030a12;
		display:flex; align-items:center; justify-content:center;
		cursor:pointer;
		z-index:200;
		box-shadow:0 4px 20px rgba(0,0,0,0.4);
		flex-shrink:0;
	"
	class="md:bottom-6"
>
	<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
		<path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
	</svg>
</button>
{/if}

<!-- Chat panel -->
{#if open}
<div
	style="
		position:fixed;
		bottom:0; right:0;
		width:100%; max-width:420px;
		height:min(520px, 80dvh);
		background:#0b1a2c;
		border:1px solid #243f5e;
		border-bottom:none;
		border-radius:16px 16px 0 0;
		display:flex; flex-direction:column;
		z-index:199;
		box-shadow:0 -8px 40px rgba(0,0,0,0.5);
		animation:slideUp 0.25s ease-out;
	"
>
	<!-- Header -->
	<div style="
		padding:14px 16px 13px;
		border-bottom:1px solid #243f5e;
		display:flex; align-items:center; gap:10px;
		background:#0f2238;
		border-radius:16px 16px 0 0;
		flex-shrink:0;
	">
		<div style="
			width:32px; height:32px; border-radius:50%;
			background:rgba(34,211,238,0.12); border:1px solid rgba(34,211,238,0.25);
			display:flex; align-items:center; justify-content:center; flex-shrink:0;
		">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color:#22d3ee;">
				<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
				<circle cx="20" cy="8" r="2" fill="currentColor"/>
				<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
			</svg>
		</div>
		<div style="font-family:'Carter One',sans-serif; font-size:0.9rem; color:#c2dce8;">{t.chatbotTitle}</div>
		<div style="flex:1;"></div>
		<button
			onclick={() => (open = false)}
			aria-label={t.chatbotClose}
			style="
				width:30px; height:30px; border-radius:8px; flex-shrink:0;
				background:transparent; border:1px solid #243f5e;
				color:#5d8fa8; cursor:pointer;
				display:flex; align-items:center; justify-content:center;
				transition:background 0.15s, color 0.15s;
			"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color='#c2dce8';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='#5d8fa8';}}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
				<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		</button>
	</div>

	<!-- Messages -->
	<div bind:this={messagesEl} style="
		flex:1; overflow-y:auto; padding:14px 14px 8px;
		display:flex; flex-direction:column; gap:10px;
		scrollbar-width:thin; scrollbar-color:#243f5e transparent;
	">
		{#if messages.length === 0}
			<div style="
				flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
				gap:8px; text-align:center; padding:20px;
			">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" style="color:#243f5e; flex-shrink:0;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				<p style="color:#3d6a84; font-size:0.82rem; font-family:'DM Sans',sans-serif; line-height:1.5; margin:0;">
					{t.chatbotEmptyHint}
				</p>
				<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:4px;">
					{#each [t.chatbotSuggestion1, t.chatbotSuggestion2, t.chatbotSuggestion3] as suggestion}
						<button
							onclick={() => { input = suggestion; send(); }}
							style="
								font-size:0.75rem; padding:5px 10px; border-radius:20px;
								background:rgba(34,211,238,0.06); border:1px solid rgba(34,211,238,0.2);
								color:#22d3ee; cursor:pointer; font-family:'DM Sans',sans-serif;
								transition:background 0.15s;
							"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.12)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='rgba(34,211,238,0.06)';}}
						>{suggestion}</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as msg}
			<div style="display:flex; {msg.role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}">
				<div style="
					max-width:82%;
					padding:9px 13px;
					border-radius:{msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
					background:{msg.role === 'user' ? 'rgba(6,182,212,0.18)' : '#0d1f35'};
					border:1px solid {msg.role === 'user' ? 'rgba(34,211,238,0.3)' : '#1d3855'};
					color:{msg.role === 'user' ? '#c2dce8' : '#c2dce8'};
					font-size:0.84rem;
					font-family:'DM Sans',sans-serif;
					line-height:1.55;
					white-space:pre-wrap;
					word-break:break-word;
				">{msg.content}</div>
			</div>
		{/each}

		{#if loading}
			<div style="display:flex; justify-content:flex-start;">
				<div style="
					padding:10px 14px; border-radius:14px 14px 14px 4px;
					background:#0d1f35; border:1px solid #1d3855;
					display:flex; align-items:center; gap:5px;
				">
					<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out infinite;"></span>
					<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out 0.4s infinite;"></span>
					<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out 0.8s infinite;"></span>
				</div>
			</div>
		{/if}

		{#if errorMsg}
			<div style="
				padding:9px 13px; border-radius:10px;
				background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25);
				color:#f87171; font-size:0.8rem; font-family:'DM Sans',sans-serif;
			">⚠ {errorMsg}</div>
		{/if}
	</div>

	<!-- Input -->
	<div style="
		padding:10px 12px 14px;
		border-top:1px solid #1d3855;
		display:flex; gap:8px; align-items:flex-end;
		flex-shrink:0;
	">
		<textarea
			bind:value={input}
			onkeydown={onKeydown}
			placeholder={t.chatbotPlaceholder}
			rows="1"
			disabled={loading}
			style="
				flex:1; resize:none; overflow:hidden;
				background:#0f2238; border:1px solid #243f5e;
				border-radius:10px; padding:9px 12px;
				color:#c2dce8; font-size:0.84rem;
				font-family:'DM Sans',sans-serif;
				outline:none; line-height:1.4;
				max-height:100px; overflow-y:auto;
				transition:border-color 0.15s;
			"
			onfocus={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4';}}
			onblur={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e';}}
			oninput={function(e){
				const el = e.currentTarget as HTMLTextAreaElement;
				el.style.height = 'auto';
				el.style.height = Math.min(el.scrollHeight, 100) + 'px';
			}}
		></textarea>
		<button
			onclick={send}
			disabled={loading || !input.trim()}
			style="
				width:38px; height:38px; border-radius:10px; flex-shrink:0;
				background:{loading || !input.trim() ? '#0f2238' : '#06b6d4'};
				border:1px solid {loading || !input.trim() ? '#243f5e' : '#22d3ee'};
				color:{loading || !input.trim() ? '#3d6a84' : '#030a12'};
				display:flex; align-items:center; justify-content:center;
				cursor:{loading || !input.trim() ? 'default' : 'pointer'};
				transition:background 0.15s, border-color 0.15s, color 0.15s;
			"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none">
				<path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
			</svg>
		</button>
	</div>
</div>
{/if}

<style>
	@keyframes slideUp {
		from { transform: translateY(20px); opacity: 0; }
		to   { transform: translateY(0);    opacity: 1; }
	}
	@keyframes pulse {
		0%, 100% { opacity: 0.3; transform: scale(0.85); }
		50%       { opacity: 1;   transform: scale(1.1); }
	}
	@media (min-width: 768px) {
		button[aria-label] {
			bottom: 24px !important;
		}
	}
</style>
