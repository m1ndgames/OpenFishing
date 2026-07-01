<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import type { Translations } from '$lib/i18n';
	import icon from '$lib/assets/openfishing-mark.svg?raw';

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
		if (diffDays === 1) return t.chatbotYesterday;
		if (diffDays < 7) return t.chatbotDaysAgo.replace('{n}', String(diffDays));
		return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
	}

	function truncate(text: string | null, len = 50): string {
		if (!text) return '…';
		return text.length > len ? text.slice(0, len) + '…' : text;
	}

	function headerBtnStyle(active = false) {
		return `width:30px;height:30px;border-radius:8px;flex-shrink:0;background:${active ? 'var(--of-accent-bg-hover)' : 'transparent'};border:1px solid ${active ? 'var(--of-accent-border)' : 'var(--of-border)'};color:${active ? 'var(--of-accent)' : 'var(--of-text-3)'};cursor:pointer;display:flex;align-items:center;justify-content:center;`;
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
	<div style="padding:14px 16px 13px;border-bottom:1px solid var(--of-border);display:flex;align-items:center;gap:8px;background:var(--of-bg-elevated);flex-shrink:0;" class="chat-panel-header">
		{#if showHistory}
			<button onclick={() => (showHistory = false)} aria-label={t.chatbotBack} style={headerBtnStyle()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
			<span style="font-family:'Carter One',sans-serif;font-size:0.9rem;color:var(--of-text);">{t.chatbotHistory}</span>
		{:else}
			<div style="width:32px;height:32px;border-radius:50%;background:var(--of-accent-bg-hover);border:1px solid var(--of-accent-border);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--of-accent);">
				{@html icon.replace('<svg ', '<svg width="18" height="18" ')}
			</div>
			<span style="font-family:'Carter One',sans-serif;font-size:0.9rem;color:var(--of-text);">{t.chatbotTitle}</span>
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
		<div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin;scrollbar-color:var(--of-border) transparent;">
			{#if loadingHistory}
				<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--of-text-4);font-size:0.82rem;font-family:'DM Sans',sans-serif;">…</div>
			{:else if sessions.length === 0}
				<div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--of-text-4);font-size:0.82rem;font-family:'DM Sans',sans-serif;">{t.chatbotNoHistory}</div>
			{:else}
				{#each sessions as session (session.sessionId)}
					<div
						role="button"
						tabindex="0"
						onclick={() => loadSession(session.sessionId)}
						onkeydown={(e) => e.key === 'Enter' && loadSession(session.sessionId)}
						style="width:100%;text-align:left;padding:10px 12px;border-radius:10px;background:{session.sessionId === sessionId ? 'var(--of-accent-bg)' : 'var(--of-bg-overlay)'};border:1px solid {session.sessionId === sessionId ? 'var(--of-accent-border)' : 'var(--of-bg-hover)'};cursor:pointer;display:flex;align-items:center;gap:10px;"
					>
						<div style="flex:1;min-width:0;">
							<div style="font-size:0.82rem;color:var(--of-text);font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;">{truncate(session.firstMessage)}</div>
							<div style="font-size:0.72rem;color:var(--of-text-4);font-family:'DM Sans',sans-serif;margin-top:3px;">{formatDate(session.lastAt)} · {t.chatbotMsgCount.replace('{n}', String(session.count))}</div>
						</div>
						<button
							onclick={(e) => deleteSession(session.sessionId, e)}
							aria-label={t.chatbotDeleteSession}
							style="width:26px;height:26px;border-radius:6px;flex-shrink:0;background:transparent;border:1px solid transparent;color:var(--of-text-4);cursor:pointer;display:flex;align-items:center;justify-content:center;"
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
					</div>
				{/each}
			{/if}
		</div>

	{:else}
		<!-- Messages -->
		<div bind:this={messagesEl} onclick={handleLinkClick} style="flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--of-border) transparent;">
			{#if messages.length === 0}
				<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:20px;">
					<div style="color:var(--of-border);flex-shrink:0;">
						{@html icon.replace('<svg ', '<svg width="36" height="36" ')}
					</div>
					<p style="color:var(--of-text-4);font-size:0.82rem;font-family:'DM Sans',sans-serif;line-height:1.5;margin:0;">{t.chatbotEmptyHint}</p>
					<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:4px;">
						{#each [t.chatbotSuggestion1, t.chatbotSuggestion2, t.chatbotSuggestion3] as suggestion}
							<button
								onclick={() => { input = suggestion; send(); }}
								style="font-size:0.75rem;padding:5px 10px;border-radius:20px;background:var(--of-accent-bg);border:1px solid var(--of-accent-bg-hover);color:var(--of-accent);cursor:pointer;font-family:'DM Sans',sans-serif;"
							>{suggestion}</button>
						{/each}
					</div>
				</div>
			{/if}

			{#each messages as msg}
				<div style="display:flex;{msg.role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}">
					<div
						style="max-width:82%;padding:9px 13px;border-radius:{msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};background:{msg.role === 'user' ? 'var(--of-accent-bg-hover)' : 'var(--of-bg-overlay)'};border:1px solid {msg.role === 'user' ? 'var(--of-accent-border)' : 'var(--of-bg-hover)'};color:var(--of-text);font-size:0.84rem;font-family:'DM Sans',sans-serif;line-height:1.55;white-space:pre-wrap;word-break:break-word;"
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
					<div style="padding:10px 14px;border-radius:14px 14px 14px 4px;background:var(--of-bg-overlay);border:1px solid var(--of-bg-hover);display:flex;align-items:center;gap:5px;">
						<span style="width:6px;height:6px;border-radius:50%;background:var(--of-text-4);animation:pulse 1.2s ease-in-out infinite;"></span>
						<span style="width:6px;height:6px;border-radius:50%;background:var(--of-text-4);animation:pulse 1.2s ease-in-out 0.4s infinite;"></span>
						<span style="width:6px;height:6px;border-radius:50%;background:var(--of-text-4);animation:pulse 1.2s ease-in-out 0.8s infinite;"></span>
					</div>
				</div>
			{/if}

			{#if errorMsg}
				<div style="padding:9px 13px;border-radius:10px;background:var(--of-danger-bg);border:1px solid var(--of-danger-border);color:var(--of-danger);font-size:0.8rem;font-family:'DM Sans',sans-serif;">⚠ {errorMsg}</div>
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
				style="flex:1;resize:none;overflow:hidden;background:var(--of-bg-elevated);border:1px solid var(--of-border);border-radius:10px;padding:9px 12px;color:var(--of-text);font-size:0.84rem;font-family:'DM Sans',sans-serif;outline:none;line-height:1.4;max-height:100px;overflow-y:auto;transition:border-color 0.15s;"
				onfocus={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)';}}
				onblur={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
				oninput={function(e){
					const el = e.currentTarget as HTMLTextAreaElement;
					el.style.height = 'auto';
					el.style.height = Math.min(el.scrollHeight, 100) + 'px';
				}}
			></textarea>
			<button
				onclick={send}
				disabled={loading || !input.trim()}
				aria-label={t.chatbotSend}
				style="width:38px;height:38px;border-radius:10px;flex-shrink:0;background:{loading || !input.trim() ? 'var(--of-bg-elevated)' : 'var(--of-accent-solid)'};border:1px solid {loading || !input.trim() ? 'var(--of-border)' : 'var(--of-accent)'};color:{loading || !input.trim() ? 'var(--of-text-4)' : 'var(--of-ink)'};display:flex;align-items:center;justify-content:center;cursor:{loading || !input.trim() ? 'default' : 'pointer'};transition:background 0.15s,border-color 0.15s,color 0.15s;"
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
		background: var(--of-accent-solid);
		border: 1.5px solid var(--of-accent);
		color: var(--of-ink);
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
		background: var(--of-bg-surface);
		border: 1px solid var(--of-border);
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
		border-top: 1px solid var(--of-bg-hover);
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
	:global(.md-bubble h1, .md-bubble h2, .md-bubble h3) { font-size: 0.88rem; font-weight: 700; margin: 0.6em 0 0.2em; color: var(--of-accent); }
	:global(.md-bubble ul, .md-bubble ol) { margin: 0.3em 0; padding-left: 1.2em; }
	:global(.md-bubble li) { margin-bottom: 0.2em; }
	:global(.md-bubble strong) { color: var(--of-text-bright); font-weight: 600; }
	:global(.md-bubble code) { background: var(--of-accent-glow); border-radius: 3px; padding: 1px 4px; font-size: 0.8em; }
	:global(.md-bubble a) { color: var(--of-accent); text-decoration: underline; text-decoration-color: var(--of-accent-bg-hover); }
	:global(.md-bubble a:hover) { text-decoration-color: var(--of-accent); }
</style>
