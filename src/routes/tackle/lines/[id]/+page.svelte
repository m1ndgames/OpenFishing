<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, line: l, logs } = data;

	function typeColor(type: string | null) {
		if (type === 'Braid') return 'var(--of-accent)';
		if (type === 'Fluoro') return '#a78bfa';
		return '#6ee7b7';
	}

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:var(--of-text-4); font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-4)';}}
	>{t.back}</a>

	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:var(--of-text-bright); margin:0 0 6px;">{l.brand ? `${l.brand} ${l.model}` : l.model}</h1>
				{#if l.type}
					<span style="font-size:0.75rem; font-weight:600; color:{typeColor(l.type)}; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); padding:3px 10px; border-radius:20px;">{l.type}</span>
				{/if}
			</div>
		</div>

		{#if l.diameterMm || l.strengthKg}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if l.diameterMm}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-accent);">{l.diameterMm}</span>
						<span style="font-size:0.68rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.lineDiameter}</span>
					</div>
				{/if}
				{#if l.strengthKg}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-accent);">{l.strengthKg}</span>
						<span style="font-size:0.68rem; color:var(--of-text-3); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.lineStrength}</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if l.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.lineNotes}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{l.notes}</p>
			</div>
		{/if}

		{#if logs.length > 0}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:var(--of-text-4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.reelCurrentLine}</p>
				<div style="display:flex; flex-direction:column; gap:6px;">
					{#each logs as log}
						<a href="/tackle/reels/{log.reel?.id}"
							style="display:flex; align-items:center; gap:10px; padding:9px 12px; background:var(--of-bg-base); border:1px solid var(--of-border-subtle); border-radius:9px; text-decoration:none; transition:border-color 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(34,211,238,0.25)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border-subtle)';}}
						>
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="var(--of-text-3)" stroke-width="1.4"/><circle cx="12" cy="12" r="2.5" stroke="var(--of-text-3)" stroke-width="1.2"/></svg>
							<span style="font-size:0.8rem; font-weight:500; color:var(--of-text-2); flex:1;">{log.reel?.brand ? `${log.reel.brand} ${log.reel.model}` : (log.reel?.model ?? '—')}</span>
							<span style="font-size:0.72rem; color:var(--of-text-4);">{formatDate(log.spooledAt)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:4px;">
			<a href="/tackle/lines/{l.id}/edit"
				style="display:inline-block; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
