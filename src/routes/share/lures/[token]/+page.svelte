<script lang="ts">
	import type { PageData } from './$types';
	import { detailSrcset, DETAIL_SIZES } from '#lib/photo.js';
	import favicon from '#lib/assets/favicon.svg';
	import mark from '#lib/assets/openfishing-mark.svg?raw';

	let { data }: { data: PageData } = $props();
	const { t, lure } = $derived(data);

	const waterTypeLabels: Record<string, string> = $derived({
		freshwater: t.waterType_freshwater,
		saltwater: t.waterType_saltwater
	});

	const runningDepthLabels: Record<string, string> = $derived({
		shallow: t.runningDepth_shallow,
		medium: t.runningDepth_medium,
		deep: t.runningDepth_deep
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<title>{lure.name} · OpenFishing</title>
</svelte:head>

<div style="min-height:100vh; background-color:var(--of-bg-base); color:var(--of-text-bright); font-family:'DM Sans',sans-serif;">

	<!-- Minimal header -->
	<header style="background:var(--of-bg-surface); border-bottom:1px solid var(--of-border-subtle); padding:0 16px;">
		<div style="max-width:640px; margin:0 auto; height:52px; display:flex; align-items:center; justify-content:space-between;">
			<span style="font-family:'DM Sans',sans-serif; font-size:var(--of-fs-section); color:var(--of-text-bright); display:flex; align-items:center; gap:8px;">
				<span style="color:var(--of-accent); flex-shrink:0; display:flex;">
					{@html mark.replace('<svg ', '<svg width="20" height="20" ')}
				</span>
				OpenFishing
			</span>
			<span style="font-size:0.75rem; font-weight:500; color:var(--of-text-4); background:var(--of-accent-bg); border:1px solid var(--of-accent-bg-hover); padding:3px 10px; border-radius:20px;">{t.shareViewOnly}</span>
		</div>
	</header>

	<div style="max-width:640px; margin:0 auto; padding:24px 16px;">
		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">

			{#if lure.photoPath}
				<div style="aspect-ratio:4/3; background:var(--of-bg-overlay); position:relative;">
					<img src="/uploads/{lure.photoPath}" srcset={detailSrcset(lure.photoPath)} sizes={DETAIL_SIZES} alt={lure.name}
						style="width:100%; height:100%; object-fit:cover; display:block;" />
					<div style="position:absolute; bottom:0; left:0; right:0; height:60px; background:linear-gradient(to top, rgba(0,0,0,0.5), transparent); pointer-events:none;"></div>
				</div>
			{/if}

			<div style="padding:20px;">
				<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px;">
					<h1 style="font-family:'DM Sans',sans-serif; font-weight:500; font-size:var(--of-fs-headline); color:var(--of-text-bright); margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">{lure.name}</h1>
					{#if lure.lureNumber}
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--of-accent-hover); flex-shrink:0; padding-top:4px;">#{String(lure.lureNumber).padStart(4, '0')}</span>
					{/if}
				</div>

				<dl style="display:grid; grid-template-columns:1fr 1fr; gap:16px 24px; font-size:0.875rem; margin-bottom:16px;">
					{#if lure.brand}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.brand}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{lure.brand}</dd>
						</div>
					{/if}
					{#if lure.type}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.type}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{lure.type}</dd>
						</div>
					{/if}
					{#if lure.color}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.color}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{lure.color}</dd>
						</div>
					{/if}
					{#if lure.weight}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.weightG}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{lure.weight}g</dd>
						</div>
					{/if}
					{#if lure.size}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.size}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{lure.size}</dd>
						</div>
					{/if}
					{#if lure.runningDepth}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.runningDepth}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{runningDepthLabels[lure.runningDepth] ?? lure.runningDepth}</dd>
						</div>
					{/if}
					{#if lure.waterType}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.waterType}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{waterTypeLabels[lure.waterType] ?? lure.waterType}</dd>
						</div>
					{/if}
					{#if lure.lightConditions != null}
						<div>
							<dt style="font-size:0.75rem; color:var(--of-text-4); margin-bottom:3px;">{t.lightConditions}</dt>
							<dd style="font-weight:600; color:var(--of-text-bright); margin:0;">{t[`lightConditions_${lure.lightConditions}` as keyof typeof t] ?? lure.lightConditions}</dd>
						</div>
					{/if}
				</dl>

				{#if lure.species || lure.tags.length > 0}
					<div style="height:1px; background:var(--of-border-subtle); margin:0 0 16px;"></div>
				{/if}

				{#if lure.species}
					<div style="margin-bottom:14px;">
						<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 8px;">{t.fishSpecies}</p>
						<div style="display:flex; flex-wrap:wrap; gap:6px;">
							{#each lure.species.split(/\s+/).filter(Boolean) as s}
								<span style="font-size:0.8125rem; padding:3px 10px; border-radius:20px; background:var(--of-accent-glow); color:var(--of-accent); border:1px solid var(--of-accent-bg-hover); font-weight:500;">{s}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if lure.tags.length > 0}
					<div style="margin-bottom:14px;">
						<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 8px;">{t.tags}</p>
						<div style="display:flex; flex-wrap:wrap; gap:6px;">
							{#each lure.tags as tag (tag.id)}
								<span style="font-size:0.8125rem; padding:3px 10px; border-radius:20px; background:var(--of-success-bg); color:var(--of-success); border:1px solid var(--of-success-border); font-weight:500;">{tag.name}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if lure.notes}
					<div>
						<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 6px;">{t.notes}</p>
						<p style="font-size:0.875rem; color:var(--of-text-2); white-space:pre-wrap; margin:0; line-height:1.6;">{lure.notes}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
