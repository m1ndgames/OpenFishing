<script lang="ts">
	import type { PageData } from './$types';
	import favicon from '$lib/assets/favicon.svg';

	let { data }: { data: PageData } = $props();
	const { t, lure } = data;

	const waterTypeLabels: Record<string, string> = {
		freshwater: t.waterType_freshwater,
		saltwater: t.waterType_saltwater
	};

	const runningDepthLabels: Record<string, string> = {
		shallow: t.runningDepth_shallow,
		medium: t.runningDepth_medium,
		deep: t.runningDepth_deep
	};
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link href="https://fonts.googleapis.com/css2?family=Carter+One&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<link rel="icon" href={favicon} />
	<title>{lure.name} · OpenFishing</title>
</svelte:head>

<div style="min-height:100vh; background-color:#060d17; background-image:radial-gradient(ellipse at 15% 60%, rgba(6,182,212,0.04) 0%, transparent 55%); color:#e0eaf8; font-family:'DM Sans',sans-serif;">
	<div style="height:1px; background:linear-gradient(90deg, transparent, #22d3ee 30%, #06b6d4 50%, #22d3ee 70%, transparent);"></div>

	<!-- Minimal header -->
	<header style="background:#0b1a2c; border-bottom:1px solid #172f4a; padding:0 16px;">
		<div style="max-width:640px; margin:0 auto; height:52px; display:flex; align-items:center; justify-content:space-between;">
			<span style="font-family:'Carter One',sans-serif; font-size:1.1rem; color:#e0eaf8; display:flex; align-items:center; gap:8px;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:#22d3ee; flex-shrink:0;">
					<path d="M4 20 Q8 16 12 14 Q16 12 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
					<circle cx="20" cy="8" r="2" fill="currentColor"/>
					<path d="M20 8 L23 5 M20 8 L23 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				OpenFishing
			</span>
			<span style="font-size:0.72rem; font-weight:500; color:#3d6a84; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.15); padding:3px 10px; border-radius:20px; letter-spacing:0.04em;">{t.shareViewOnly}</span>
		</div>
	</header>

	<div style="max-width:640px; margin:0 auto; padding:24px 16px;">
		<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; overflow:hidden;">

			{#if lure.photoPath}
				<div style="aspect-ratio:4/3; background:#0d1f35; position:relative;">
					<img src="/uploads/{lure.photoPath}" alt={lure.name}
						style="width:100%; height:100%; object-fit:cover; display:block;" />
					<div style="position:absolute; bottom:0; left:0; right:0; height:60px; background:linear-gradient(to top, rgba(11,26,44,0.7), transparent); pointer-events:none;"></div>
				</div>
			{/if}

			<div style="padding:20px;">
				<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px;">
					<h1 style="font-family:'Carter One',sans-serif; font-weight:800; font-size:1.4rem; color:#e0eaf8; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">{lure.name}</h1>
					{#if lure.lureNumber}
						<span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:#7dd3fc; letter-spacing:0.05em; flex-shrink:0; padding-top:4px;">#{String(lure.lureNumber).padStart(4, '0')}</span>
					{/if}
				</div>

				<dl style="display:grid; grid-template-columns:1fr 1fr; gap:16px 24px; font-size:0.875rem; margin-bottom:16px;">
					{#if lure.brand}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.brand}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.brand}</dd>
						</div>
					{/if}
					{#if lure.type}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.type}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.type}</dd>
						</div>
					{/if}
					{#if lure.color}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.color}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.color}</dd>
						</div>
					{/if}
					{#if lure.weight}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.weightG}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.weight}g</dd>
						</div>
					{/if}
					{#if lure.size}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.size}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.size}</dd>
						</div>
					{/if}
					{#if lure.runningDepth}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.runningDepth}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{runningDepthLabels[lure.runningDepth] ?? lure.runningDepth}</dd>
						</div>
					{/if}
					{#if lure.waterType}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.waterType}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{waterTypeLabels[lure.waterType] ?? lure.waterType}</dd>
						</div>
					{/if}
					{#if lure.lightConditions != null}
						<div>
							<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.lightConditions}</dt>
							<dd style="font-weight:600; color:#e0eaf8; margin:0;">{t[`lightConditions_${lure.lightConditions}` as keyof typeof t] ?? lure.lightConditions}</dd>
						</div>
					{/if}
				</dl>

				{#if lure.species || lure.tags.length > 0}
					<div style="height:1px; background:#172f4a; margin:0 0 16px;"></div>
				{/if}

				{#if lure.species}
					<div style="margin-bottom:14px;">
						<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 8px;">{t.fishSpecies}</p>
						<div style="display:flex; flex-wrap:wrap; gap:6px;">
							{#each lure.species.split(/\s+/).filter(Boolean) as s}
								<span style="font-size:0.78rem; padding:3px 10px; border-radius:20px; background:rgba(6,182,212,0.1); color:#22d3ee; border:1px solid rgba(6,182,212,0.2); font-weight:500;">{s}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if lure.tags.length > 0}
					<div style="margin-bottom:14px;">
						<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 8px;">{t.tags}</p>
						<div style="display:flex; flex-wrap:wrap; gap:6px;">
							{#each lure.tags as tag (tag.id)}
								<span style="font-size:0.78rem; padding:3px 10px; border-radius:20px; background:rgba(74,222,128,0.08); color:#4ade80; border:1px solid rgba(74,222,128,0.15); font-weight:500;">{tag.name}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if lure.notes}
					<div>
						<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 6px;">{t.notes}</p>
						<p style="font-size:0.875rem; color:#8ab8cc; white-space:pre-wrap; margin:0; line-height:1.6;">{lure.notes}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
