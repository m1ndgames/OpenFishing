<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lure, qrSvg, t } = data;

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

<div style="max-width:580px;">
	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; overflow:hidden;">

		<!-- Photo -->
		{#if lure.photoPath}
			<div style="aspect-ratio:4/3; background:#0d1f35; position:relative;">
				<img src="/uploads/{lure.photoPath}" alt={lure.name}
					style="width:100%; height:100%; object-fit:cover; display:block;" />
				<!-- gradient overlay at bottom -->
				<div style="position:absolute; bottom:0; left:0; right:0; height:60px; background:linear-gradient(to top, rgba(11,26,44,0.7), transparent); pointer-events:none;"></div>
			</div>
		{/if}

		<div style="position:relative; padding:20px 20px 20px;">

			<!-- QR code — top right -->
			<div style="position:absolute; top:20px; right:20px; display:flex; flex-direction:column; align-items:center; gap:4px;">
				<div style="position:relative; width:64px; height:64px; background:#e8f0f7; border-radius:10px; padding:4px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
					{@html qrSvg}
					{#if !lure.qrCoded}
						<div style="position:absolute; bottom:2px; right:2px; width:18px; height:18px; background:#f59e0b; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.4);">
							<svg width="8" height="8" viewBox="0 0 10 10" fill="none">
								<path d="M5 2.5v3" stroke="#EDF5FA" stroke-width="1.5" stroke-linecap="round"/>
								<circle cx="5" cy="7.5" r="0.9" fill="#EDF5FA"/>
							</svg>
						</div>
					{/if}
				</div>
				{#if lure.lureNumber}
					<span style="font-family:'JetBrains Mono',monospace; font-size:0.68rem; color:#7dd3fc; letter-spacing:0.05em;">#{String(lure.lureNumber).padStart(4, '0')}</span>
				{/if}
			</div>

			<!-- Lure name -->
			<h1 style="font-family:'Carter One',sans-serif; font-weight:800; font-size:1.4rem; color:#e0eaf8; margin:0 0 16px; padding-right:88px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{lure.name}</h1>

			<!-- Core details grid -->
			<dl style="display:grid; grid-template-columns:1fr 1fr; gap:16px 24px; font-size:0.875rem; padding-right:88px; margin-bottom:16px;">
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
				{#if lure.lightConditions}
					<div>
						<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.lightConditions}</dt>
						<dd style="font-weight:600; color:#e0eaf8; margin:0;">{lure.lightConditions}</dd>
					</div>
				{/if}
			</dl>

			<!-- Divider -->
			<div style="height:1px; background:#172f4a; margin:0 0 16px;"></div>

			<!-- Species -->
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

			<!-- Tags -->
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

			<!-- Notes -->
			{#if lure.notes}
				<div style="margin-bottom:14px;">
					<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 6px;">{t.notes}</p>
					<p style="font-size:0.875rem; color:#8ab8cc; white-space:pre-wrap; margin:0; line-height:1.6;">{lure.notes}</p>
				</div>
			{/if}

			<!-- Labeled status -->
			{#if lure.qrCoded}
				<div style="margin-bottom:14px;">
					<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(74,222,128,0.08); color:#4ade80; font-size:0.78rem; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid rgba(74,222,128,0.2);">
						<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						{t.labeledStatus}
					</span>
				</div>
			{/if}

			<!-- Actions -->
			<div style="display:flex; gap:8px; padding-top:16px; border-top:1px solid #172f4a; margin-top:16px;">
				<a href="/lures/{lure.id}/edit"
					style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
				>
					{t.edit}
				</a>
			</div>
		</div>
	</div>
</div>
