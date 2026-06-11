<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, combo: c, currentLine } = data;

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function daysSince(d: Date) {
		return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
	}
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:#3d6a84; font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
	>{t.back}</a>

	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0;">{c.name}</h1>

		<!-- Rod -->
		{#if c.rod}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.comboRod}</p>
				<a href="/tackle/rods/{c.rod.id}"
					style="display:inline-flex; align-items:center; gap:8px; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; padding:8px 14px; border-radius:9px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 21L20 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
					{c.rod.brand ? `${c.rod.brand} ${c.rod.model}` : c.rod.model}
					{#if c.rod.type}<span style="font-size:0.75rem; color:#5d8fa8; margin-left:4px;">({c.rod.type})</span>{/if}
				</a>
			</div>
		{/if}

		<!-- Reel + current line -->
		{#if c.reel}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.comboReel}</p>
				<a href="/tackle/reels/{c.reel.id}"
					style="display:inline-flex; align-items:center; gap:8px; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; padding:8px 14px; border-radius:9px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
				>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/></svg>
					{c.reel.brand ? `${c.reel.brand} ${c.reel.model}` : c.reel.model}
					{#if c.reel.size}<span style="font-size:0.75rem; color:#5d8fa8; margin-left:4px;">#{c.reel.size}</span>{/if}
				</a>
				{#if currentLine}
					<div style="display:flex; align-items:center; gap:6px; margin-top:8px; padding:8px 12px; background:rgba(34,211,238,0.04); border:1px solid rgba(34,211,238,0.15); border-radius:8px;">
						<div style="width:6px; height:6px; border-radius:50%; background:#22d3ee; flex-shrink:0;"></div>
						<span style="font-size:0.8rem; color:#22d3ee; font-weight:500;">{currentLine.lineName}</span>
						<span style="font-size:0.72rem; color:#3d6a84; margin-left:4px;">· {formatDate(currentLine.spooledAt)} ({daysSince(currentLine.spooledAt)}d)</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Terminal tackle -->
		{#if c.terminalTackle}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.comboTerminalTackle}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{c.terminalTackle}</p>
			</div>
		{/if}

		<!-- Notes -->
		{#if c.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.comboNotes}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{c.notes}</p>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid #172f4a; margin-top:4px;">
			<a href="/tackle/combos/{c.id}/edit"
				style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
