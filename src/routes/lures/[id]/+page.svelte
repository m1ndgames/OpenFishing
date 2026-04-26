<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lure, qrSvg, t, lureCatches, authEnabled } = data;

	let shareUrl = $state(data.shareUrl);
	let copied = $state(false);

	async function createShare() {
		const res = await fetch(`/api/lures/${lure.id}/share`, { method: 'POST' });
		const json = await res.json();
		shareUrl = json.shareUrl;
	}

	async function revokeShare() {
		await fetch(`/api/lures/${lure.id}/share`, { method: 'DELETE' });
		shareUrl = null;
	}

	function copyShare() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

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
				{#if lure.lightConditions != null}
					<div>
						<dt style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin-bottom:3px;">{t.lightConditions}</dt>
						<dd style="font-weight:600; color:#e0eaf8; margin:0;">{t[`lightConditions_${lure.lightConditions}` as keyof typeof t] ?? lure.lightConditions}</dd>
					</div>
				{/if}
			</dl>

			<!-- Divider -->
			<div style="height:1px; background:#172f4a; margin:0 0 16px;"></div>

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

			<!-- Notes -->
			{#if lure.notes}
				<div style="margin-bottom:14px;">
					<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 6px;">{t.notes}</p>
					<p style="font-size:0.875rem; color:#8ab8cc; white-space:pre-wrap; margin:0; line-height:1.6;">{lure.notes}</p>
				</div>
			{/if}

			<!-- Labeled / Lost status -->
			{#if lure.qrCoded || lure.lost}
				<div style="margin-bottom:14px; display:flex; flex-wrap:wrap; gap:8px;">
					{#if lure.qrCoded}
						<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(74,222,128,0.08); color:#4ade80; font-size:0.78rem; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid rgba(74,222,128,0.2);">
							<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{t.labeledStatus}
						</span>
					{/if}
					{#if lure.lost}
						<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.1); color:#fbbf24; font-size:0.78rem; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid rgba(245,158,11,0.25);">
							<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{t.lostStatus}
						</span>
					{/if}
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

			<!-- Share link management -->
			{#if authEnabled}
				<div style="padding-top:16px; border-top:1px solid #172f4a; margin-top:16px;">
					<p style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 10px; display:flex; align-items:center; gap:6px;">
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
						{t.shareLink}
					</p>
					{#if shareUrl}
						<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
							<input type="text" value={shareUrl} readonly
								style="flex:1; min-width:0; background:#060d17; border:1px solid #172f4a; border-radius:8px; color:#8ab8cc; font-family:'JetBrains Mono',monospace; font-size:0.72rem; padding:7px 10px; outline:none;" />
							<button onclick={copyShare}
								style="background:{copied ? 'rgba(74,222,128,0.12)' : '#0f2238'}; color:{copied ? '#4ade80' : '#8ab8cc'}; border:1px solid {copied ? 'rgba(74,222,128,0.3)' : '#243f5e'}; font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; transition:all 0.15s; font-family:'DM Sans',sans-serif;">
								{copied ? t.shareCopied : t.shareCopy}
							</button>
							<button onclick={revokeShare}
								style="background:#0f2238; color:#f87171; border:1px solid rgba(248,113,113,0.2); font-size:0.8rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
								onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(248,113,113,0.5)';}}
								onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(248,113,113,0.2)';}}>
								{t.shareRevoke}
							</button>
						</div>
						<p style="font-size:0.72rem; color:#3d6a84; margin:0;">{t.sharePublicNote}</p>
					{:else}
						<button onclick={createShare}
							style="display:inline-flex; align-items:center; gap:6px; background:#0f2238; color:#8ab8cc; font-size:0.8rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid #243f5e; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
							{t.shareGenerate}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Catches with this lure -->
<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:14px; padding:20px; margin-top:16px;">
	<p style="font-family:'Carter One',sans-serif; font-size:1rem; color:#e0eaf8; margin:0 0 14px;">{t.navCatches}</p>

	{#if lureCatches.length === 0}
		<p style="font-size:0.875rem; color:#3d6a84; margin:0;">{t.catchNoItems}</p>
	{:else}
		<div style="overflow-x:auto;">
			<table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
				<thead>
					<tr style="border-bottom:1px solid #172f4a;">
						<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;"></th>
						<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchSpeciesLabel}</th>
						<th style="text-align:left; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchDateLabel}</th>
						<th style="text-align:right; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 8px 0;">{t.catchLengthLabel}</th>
						<th style="text-align:right; font-size:0.68rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; padding:0 0 8px 0;">{t.catchWeightLabel}</th>
					</tr>
				</thead>
				<tbody>
					{#each lureCatches as c}
						<tr style="border-bottom:1px solid #0f2238; cursor:pointer;"
							onclick={() => window.location.href = `/catches/${c.id}`}
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='rgba(6,182,212,0.04)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='';}}
						>
							<td style="padding:8px 10px 8px 0; width:40px;">
								{#if c.photos.length > 0}
									<div style="width:36px; height:28px; border-radius:5px; overflow:hidden; flex-shrink:0;">
										<img src="/uploads/{c.photos[0].filename}" alt="" style="width:100%; height:100%; object-fit:cover;" />
									</div>
								{:else}
									<div style="width:36px; height:28px; border-radius:5px; background:#0d1f35; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:#1d3d5c;">
											<path d="M2 12 C4 8 7 6 10 7 C13 8 14 11 17 11 C20 11 22 9 22 9 C22 9 21 14 18 15 C15 16 13 14 10 14 C7 14 4 16 2 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
										</svg>
									</div>
								{/if}
							</td>
							<td style="padding:8px 12px 8px 0; font-weight:600; color:#c2dce8; white-space:nowrap;">{c.species ?? '—'}</td>
							<td style="padding:8px 12px 8px 0; color:#5d8fa8; white-space:nowrap;">{formatDate(c.caughtAt)}</td>
							<td style="padding:8px 12px 8px 0; color:#22d3ee; font-family:'JetBrains Mono',monospace; text-align:right; white-space:nowrap;">{c.lengthCm != null ? `${c.lengthCm}` : '—'}</td>
							<td style="padding:8px 0 8px 0; color:#22d3ee; font-family:'JetBrains Mono',monospace; text-align:right; white-space:nowrap;">{c.weightG != null ? `${c.weightG}` : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
</div>
