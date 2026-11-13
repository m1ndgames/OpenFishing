<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, combo: c, currentLine } = $derived(data);

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function daysSince(d: Date) {
		return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
	}
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle?tab=combos" class="of-tap" style="display:inline-flex; align-items:center; gap:6px; color:var(--of-text-3); font-size:0.8125rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
		{t.back}
	</a>

	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<h1 style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0;">{c.name}</h1>

		<!-- Rod -->
		{#if c.rod}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.comboRod}</p>
				<a href="/tackle/rods/{c.rod.id}"
					style="display:inline-flex; align-items:center; gap:8px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:8px 14px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition);"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 21L20 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
					{c.rod.brand ? `${c.rod.brand} ${c.rod.model}` : c.rod.model}
					{#if c.rod.type}<span style="font-size:0.75rem; color:var(--of-text-3); margin-left:4px;">({c.rod.type})</span>{/if}
				</a>
			</div>
		{/if}

		<!-- Reel + current line -->
		{#if c.reel}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.comboReel}</p>
				<a href="/tackle/reels/{c.reel.id}"
					style="display:inline-flex; align-items:center; gap:8px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:8px 14px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition);"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/></svg>
					{c.reel.brand ? `${c.reel.brand} ${c.reel.model}` : c.reel.model}
					{#if c.reel.size}<span style="font-size:0.75rem; color:var(--of-text-3); margin-left:4px;">#{c.reel.size}</span>{/if}
				</a>
				{#if currentLine}
					<div style="display:flex; align-items:center; gap:6px; margin-top:8px; padding:8px 12px; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:8px;">
						<div style="width:6px; height:6px; border-radius:50%; background:var(--of-accent); flex-shrink:0;"></div>
						<span style="font-size:0.8125rem; color:var(--of-accent); font-weight:500;">{currentLine.lineName}</span>
						<span style="font-size:0.75rem; color:var(--of-text-4); margin-left:4px;">· {formatDate(currentLine.spooledAt)} ({daysSince(currentLine.spooledAt)}d)</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Terminal tackle -->
		{#if c.terminalTackle}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.comboTerminalTackle}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{c.terminalTackle}</p>
			</div>
		{/if}

		<!-- Notes -->
		{#if c.notes}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.comboNotes}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{c.notes}</p>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:4px;">
			<a href="/tackle/combos/{c.id}/edit"
				style="display:inline-block; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
