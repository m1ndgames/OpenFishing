<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, rod: r, combos } = data;
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle" style="display:inline-flex; align-items:center; gap:6px; color:#3d6a84; font-size:0.8rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
	>{t.back}</a>

	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'Carter One',sans-serif; font-size:1.4rem; color:#e0eaf8; margin:0 0 4px;">{r.brand ? `${r.brand} ${r.model}` : r.model}</h1>
				{#if r.type}
					<span style="font-size:0.75rem; font-weight:600; color:#06b6d4; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.2); padding:3px 10px; border-radius:20px;">{r.type}</span>
				{/if}
			</div>
		</div>

		{#if r.lengthM || r.castingWeight}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if r.lengthM}
					<div style="display:flex; flex-direction:column; align-items:center; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#22d3ee;">{r.lengthM}</span>
						<span style="font-size:0.68rem; color:#5d8fa8; text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.rodLength}</span>
					</div>
				{/if}
				{#if r.castingWeight}
					<div style="display:flex; flex-direction:column; align-items:center; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#22d3ee;">{r.castingWeight}</span>
						<span style="font-size:0.68rem; color:#5d8fa8; text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">{t.rodCastingWeight}</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if r.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.rodNotes}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{r.notes}</p>
			</div>
		{/if}

		{#if combos.length > 0}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.tackleCombos}</p>
				<div style="display:flex; flex-wrap:wrap; gap:6px;">
					{#each combos as c}
						<a href="/tackle/combos/{c.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:#0f2238; color:#8ab8cc; font-size:0.8rem; font-weight:500; padding:6px 12px; border-radius:8px; border:1px solid #243f5e; text-decoration:none; transition:all 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
						>{c.name}</a>
					{/each}
				</div>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid #172f4a; margin-top:4px;">
			<a href="/tackle/rods/{r.id}/edit"
				style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
