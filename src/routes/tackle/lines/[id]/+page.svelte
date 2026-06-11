<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, line: l, logs } = data;

	function typeColor(type: string | null) {
		if (type === 'Braid') return '#22d3ee';
		if (type === 'Fluoro') return '#a78bfa';
		return '#6ee7b7';
	}

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:#3d6a84; font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
	>{t.back}</a>

	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0 0 6px;">{l.brand ? `${l.brand} ${l.model}` : l.model}</h1>
				{#if l.type}
					<span style="font-size:0.75rem; font-weight:600; color:{typeColor(l.type)}; background:rgba(34,211,238,0.08); border:1px solid rgba(34,211,238,0.2); padding:3px 10px; border-radius:20px;">{l.type}</span>
				{/if}
			</div>
		</div>

		{#if l.diameterMm || l.strengthKg}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if l.diameterMm}
					<div style="display:flex; flex-direction:column; align-items:center; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#22d3ee;">{l.diameterMm}</span>
						<span style="font-size:0.68rem; color:#5d8fa8; text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.lineDiameter}</span>
					</div>
				{/if}
				{#if l.strengthKg}
					<div style="display:flex; flex-direction:column; align-items:center; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#22d3ee;">{l.strengthKg}</span>
						<span style="font-size:0.68rem; color:#5d8fa8; text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.lineStrength}</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if l.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.lineNotes}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{l.notes}</p>
			</div>
		{/if}

		{#if logs.length > 0}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.reelCurrentLine}</p>
				<div style="display:flex; flex-direction:column; gap:6px;">
					{#each logs as log}
						<a href="/tackle/reels/{log.reel?.id}"
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; background:#060d17; border:1px solid #172f4a; border-radius:9px; text-decoration:none; transition:border-color 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(34,211,238,0.25)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#172f4a';}}
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="#5d8fa8" stroke-width="1.4"/><circle cx="12" cy="12" r="2.5" stroke="#5d8fa8" stroke-width="1.2"/></svg>
							<span style="font-size:0.8rem; font-weight:500; color:#8ab8cc; flex:1;">{log.reel?.brand ? `${log.reel.brand} ${log.reel.model}` : (log.reel?.model ?? '—')}</span>
							<span style="font-size:0.72rem; color:#3d6a84;">{formatDate(log.spooledAt)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid #172f4a; margin-top:4px;">
			<a href="/tackle/lines/{l.id}/edit"
				style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
