<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { t, rod: r, combos } = $derived(data);
</script>

<div style="max-width:580px; margin:0 auto;">
	<a href="/tackle?tab=rods" class="of-tap" style="display:inline-flex; align-items:center; gap:6px; color:var(--of-text-3); font-size:0.8125rem; text-decoration:none; margin-bottom:20px;"
		onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
		onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
		{t.back}
	</a>

	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px;">
		<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
			<div>
				<h1 style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0 0 4px;">{r.brand ? `${r.brand} ${r.model}` : r.model}</h1>
				{#if r.type}
					<span style="font-size:0.75rem; font-weight:600; color:var(--of-accent); background:var(--of-accent-bg-hover); border:1px solid var(--of-accent-border); padding:3px 10px; border-radius:20px;">{r.type}</span>
				{/if}
			</div>
		</div>

		{#if r.lengthM || r.castingWeight}
			<div style="display:flex; flex-wrap:wrap; gap:8px;">
				{#if r.lengthM}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-section); font-weight:600; color:var(--of-accent);">{r.lengthM}</span>
						<span style="font-size:0.75rem; color:var(--of-text-3); margin-top:2px;">{t.rodLength}</span>
					</div>
				{/if}
				{#if r.castingWeight}
					<div style="display:flex; flex-direction:column; align-items:center; background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); border-radius:10px; padding:8px 16px; min-width:72px;">
						<span style="font-family:'JetBrains Mono',monospace; font-size:var(--of-fs-section); font-weight:600; color:var(--of-accent);">{r.castingWeight}</span>
						<span style="font-size:0.75rem; color:var(--of-text-3); margin-top:2px;">{t.rodCastingWeight}</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if r.notes}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 6px;">{t.rodNotes}</p>
				<p style="font-size:0.875rem; color:var(--of-text-2); margin:0; line-height:1.6; white-space:pre-wrap;">{r.notes}</p>
			</div>
		{/if}

		{#if combos.length > 0}
			<div>
				<p style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); margin:0 0 8px;">{t.tackleCombos}</p>
				<div style="display:flex; flex-wrap:wrap; gap:6px;">
					{#each combos as c}
						<a href="/tackle/combos/{c.id}"
							style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; font-weight:500; padding:6px 12px; border-radius:8px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition);"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
						>{c.name}</a>
					{/each}
				</div>
			</div>
		{/if}

		<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle); margin-top:4px;">
			<a href="/tackle/rods/{r.id}/edit"
				style="display:inline-block; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
