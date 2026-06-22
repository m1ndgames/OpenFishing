<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import type { Translations } from '$lib/i18n';

	function renderMarkdown(text: string): string {
		return marked.parse(text, { async: false }) as string;
	}

	function handleLinkClick(e: MouseEvent) {
		const a = (e.target as HTMLElement).closest('a');
		if (!a) return;
		const href = a.getAttribute('href');
		if (!href?.startsWith('/')) return;
		e.preventDefault();
		goto(href, { invalidateAll: true });
	}

	type Message = { role: 'user' | 'assistant'; content: string };
	type Session = { sessionId: string; firstMessage: string | null; lastAt: number; count: number };

	let { t }: { t: Translations } = $props();

	let open = $state(false);
	let messages = $state<Message[]>([]);
	let input = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);
	let location = $state<{ lat: number; lng: number } | null>(null);
	let sessionId = $state<string>(crypto.randomUUID());
	let showHistory = $state(false);
	let sessions = $state<Session[]>([]);
	let loadingHistory = $state(false);

	$effect(() => {
		if (open && !location && typeof navigator !== 'undefined' && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => { location = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
				() => {}
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
					sessionId,
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

	function newChat() {
		sessionId = crypto.randomUUID();
		messages = [];
		showHistory = false;
		errorMsg = '';
	}

	async function openHistory() {
		showHistory = true;
		loadingHistory = true;
		try {
			const res = await fetch('/api/chat');
			sessions = await res.json();
		} catch {
			sessions = [];
		} finally {
			loadingHistory = false;
		}
	}

	async function loadSession(sid: string) {
		try {
			const res = await fetch(`/api/chat/${sid}`);
			const data = await res.json();
			messages = data.messages;
			sessionId = sid;
			showHistory = false;
			await scrollToBottom();
		} catch {
			// keep current state
		}
	}

	async function deleteSession(sid: string, e: MouseEvent) {
		e.stopPropagation();
		await fetch(`/api/chat/${sid}`, { method: 'DELETE' });
		sessions = sessions.filter((s) => s.sessionId !== sid);
		if (sid === sessionId) newChat();
	}

	function formatDate(seconds: number): string {
		const d = new Date(seconds * 1000);
		const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
		if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays}d ago`;
		return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
	}

	function truncate(text: string | null, len = 50): string {
		if (!text) return '…';
		return text.length > len ? text.slice(0, len) + '…' : text;
	}

	function headerBtnStyle(active = false) {
		return `width:30px;height:30px;border-radius:8px;flex-shrink:0;background:${active ? 'rgba(34,211,238,0.12)' : 'transparent'};border:1px solid ${active ? 'rgba(34,211,238,0.3)' : '#243f5e'};color:${active ? '#22d3ee' : '#5d8fa8'};cursor:pointer;display:flex;align-items:center;justify-content:center;`;
	}
</script>

<!-- FAB: open button -->
{#if !open}
<button onclick={() => (open = true)} aria-label={t.chatbotOpen} class="chat-fab">
	<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
		<path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
	</svg>
</button>
{/if}

<!-- Backdrop (mobile only) -->
{#if open}
<div class="chat-backdrop" onclick={() => { open = false; showHistory = false; }} aria-hidden="true"></div>
{/if}

<!-- Chat panel -->
{#if open}
<div class="chat-panel">

	<!-- Header -->
	<div style="padding:14px 16px 13px;border-bottom:1px solid #243f5e;display:flex;align-items:center;gap:8px;background:#0f2238;flex-shrink:0;" class="chat-panel-header">
		{#if showHistory}
			<button onclick={() => (showHistory = false)} aria-label="Back" style={headerBtnStyle()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
			<span style="font-family:'Carter One',sans-serif;font-size:0.9rem;color:#c2dce8;">{t.chatbotHistory}</span>
		{:else}
			<div style="width:32px;height:32px;border-radius:50%;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color:#22d3ee;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
			</div>
			<span style="font-family:'Carter One',sans-serif;font-size:0.9rem;color:#c2dce8;">{t.chatbotTitle}</span>
		{/if}

		<div style="flex:1;"></div>

		{#if !showHistory}
			<button onclick={newChat} aria-label={t.chatbotNewChat} title={t.chatbotNewChat} style={headerBtnStyle()}>
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
			</button>
			<button onclick={openHistory} aria-label={t.chatbotHistory} title={t.chatbotHistory} style={headerBtnStyle(showHistory)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
		{/if}

		<button onclick={() => { open = false; showHistory = false; }} aria-label={t.chatbotClose} style={headerBtnStyle()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
		</button>
	</div>

	{#if showHistory}
		<!-- History list -->
		<div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:#243f5e transparent;">
			{#if loadingHistory}
				<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#3d6a84;font-size:0.82rem;font-family:'DM Sans',sans-serif;">…</div>
			{:else if sessions.length === 0}
				<div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#3d6a84;font-size:0.82rem;font-family:'DM Sans',sans-serif;">{t.chatbotNoHistory}</div>
			{:else}
				{#each sessions as session (session.sessionId)}
					<div
						role="button"
						tabindex="0"
						onclick={() => loadSession(session.sessionId)}
						onkeydown={(e) => e.key === 'Enter' && loadSession(session.sessionId)}
						style="width:100%;text-align:left;padding:10px 12px;border-radius:10px;background:{session.sessionId === sessionId ? 'rgba(34,211,238,0.08)' : '#0d1f35'};border:1px solid {session.sessionId === sessionId ? 'rgba(34,211,238,0.3)' : '#1d3855'};cursor:pointer;display:flex;align-items:center;gap:10px;"
					>
						<div style="flex:1;min-width:0;">
							<div style="font-size:0.82rem;color:#c2dce8;font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;">{truncate(session.firstMessage)}</div>
							<div style="font-size:0.72rem;color:#3d6a84;font-family:'DM Sans',sans-serif;margin-top:3px;">{formatDate(session.lastAt)} · {session.count} msgs</div>
						</div>
						<button
							onclick={(e) => deleteSession(session.sessionId, e)}
							aria-label="Delete session"
							style="width:26px;height:26px;border-radius:6px;flex-shrink:0;background:transparent;border:1px solid transparent;color:#3d6a84;cursor:pointer;display:flex;align-items:center;justify-content:center;"
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
					</div>
				{/each}
			{/if}
		</div>

	{:else}
		<!-- Messages -->
		<div bind:this={messagesEl} onclick={handleLinkClick} style="flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#243f5e transparent;">
			{#if messages.length === 0}
				<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:20px;">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" style="color:#243f5e;flex-shrink:0;">
						<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
						<circle cx="20" cy="8" r="2" fill="currentColor"/>
						<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
					</svg>
					<p style="color:#3d6a84;font-size:0.82rem;font-family:'DM Sans',sans-serif;line-height:1.5;margin:0;">{t.chatbotEmptyHint}</p>
					<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:4px;">
						{#each [t.chatbotSuggestion1, t.chatbotSuggestion2, t.chatbotSuggestion3] as suggestion}
							<button
								onclick={() => { input = suggestion; send(); }}
								style="font-size:0.75rem;padding:5px 10px;border-radius:20px;background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.2);color:#22d3ee;cursor:pointer;font-family:'DM Sans',sans-serif;"
							>{suggestion}</button>
						{/each}
					</div>
				</div>
			{/if}

			{#each messages as msg}
				<div style="display:flex;{msg.role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}">
					<div
						style="max-width:82%;padding:9px 13px;border-radius:{msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};background:{msg.role === 'user' ? 'rgba(6,182,212,0.18)' : '#0d1f35'};border:1px solid {msg.role === 'user' ? 'rgba(34,211,238,0.3)' : '#1d3855'};color:#c2dce8;font-size:0.84rem;font-family:'DM Sans',sans-serif;line-height:1.55;white-space:pre-wrap;word-break:break-word;"
						class={msg.role === 'assistant' ? 'md-bubble' : ''}
					>
						{#if msg.role === 'assistant'}
							{@html renderMarkdown(msg.content)}
						{:else}
							{msg.content}
						{/if}
					</div>
				</div>
			{/each}

			{#if loading}
				<div style="display:flex;justify-content:flex-start;">
					<div style="padding:10px 14px;border-radius:14px 14px 14px 4px;background:#0d1f35;border:1px solid #1d3855;display:flex;align-items:center;gap:5px;">
						<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out infinite;"></span>
						<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out 0.4s infinite;"></span>
						<span style="width:6px;height:6px;border-radius:50%;background:#3d6a84;animation:pulse 1.2s ease-in-out 0.8s infinite;"></span>
					</div>
				</div>
			{/if}

			{#if errorMsg}
				<div style="padding:9px 13px;border-radius:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:0.8rem;font-family:'DM Sans',sans-serif;">⚠ {errorMsg}</div>
			{/if}
		</div>

		<!-- Input -->
		<div class="chat-input">
			<textarea
				bind:value={input}
				onkeydown={onKeydown}
				placeholder={t.chatbotPlaceholder}
				rows="1"
				disabled={loading}
				style="flex:1;resize:none;overflow:hidden;background:#0f2238;border:1px solid #243f5e;border-radius:10px;padding:9px 12px;color:#c2dce8;font-size:0.84rem;font-family:'DM Sans',sans-serif;outline:none;line-height:1.4;max-height:100px;overflow-y:auto;transition:border-color 0.15s;"
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
				aria-label="Send"
				style="width:38px;height:38px;border-radius:10px;flex-shrink:0;background:{loading || !input.trim() ? '#0f2238' : '#06b6d4'};border:1px solid {loading || !input.trim() ? '#243f5e' : '#22d3ee'};color:{loading || !input.trim() ? '#3d6a84' : '#030a12'};display:flex;align-items:center;justify-content:center;cursor:{loading || !input.trim() ? 'default' : 'pointer'};transition:background 0.15s,border-color 0.15s,color 0.15s;"
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
			</button>
		</div>
	{/if}

</div>
{/if}

<style>
	.chat-fab {
		position: fixed;
		bottom: 80px;
		right: 20px;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #06b6d4;
		border: 1.5px solid #22d3ee;
		color: #030a12;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 200;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.chat-fab {
			bottom: 24px;
		}
	}

	.chat-backdrop {
		display: none;
	}

	@media (max-width: 767px) {
		.chat-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 198;
			animation: fadeIn 0.25s ease-out;
		}
	}

	.chat-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 85dvh;
		background: #0b1a2c;
		border: 1px solid #243f5e;
		border-bottom: none;
		border-radius: 16px 16px 0 0;
		display: flex;
		flex-direction: column;
		z-index: 199;
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.25s ease-out;
	}

	.chat-panel-header {
		border-radius: 16px 16px 0 0;
	}

	@media (min-width: 768px) {
		.chat-panel {
			left: auto;
			width: 420px;
			height: min(520px, 80dvh);
		}
	}

	.chat-input {
		padding: 10px 12px;
		padding-bottom: max(14px, calc(14px + env(safe-area-inset-bottom)));
		border-top: 1px solid #1d3855;
		display: flex;
		gap: 8px;
		align-items: flex-end;
		flex-shrink: 0;
	}

	@keyframes slideUp {
		from { transform: translateY(20px); opacity: 0; }
		to   { transform: translateY(0);    opacity: 1; }
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; transform: scale(0.85); }
		50%       { opacity: 1;   transform: scale(1.1); }
	}

	:global(.md-bubble) { white-space: normal !important; }
	:global(.md-bubble p) { margin: 0 0 0.4em; }
	:global(.md-bubble p:last-child) { margin-bottom: 0; }
	:global(.md-bubble h1, .md-bubble h2, .md-bubble h3) { font-size: 0.88rem; font-weight: 700; margin: 0.6em 0 0.2em; color: #22d3ee; }
	:global(.md-bubble ul, .md-bubble ol) { margin: 0.3em 0; padding-left: 1.2em; }
	:global(.md-bubble li) { margin-bottom: 0.2em; }
	:global(.md-bubble strong) { color: #e2f0f8; font-weight: 600; }
	:global(.md-bubble code) { background: rgba(34, 211, 238, 0.1); border-radius: 3px; padding: 1px 4px; font-size: 0.8em; }
	:global(.md-bubble a) { color: #22d3ee; text-decoration: underline; text-decoration-color: rgba(34, 211, 238, 0.4); }
	:global(.md-bubble a:hover) { text-decoration-color: #22d3ee; }
</style>
