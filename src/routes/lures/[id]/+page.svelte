<script lang="ts">
	import type { PageData } from './$types';
	import { photoUrl, THUMB_SMALL, detailSrcset, DETAIL_SIZES } from '#lib/photo.js';

	let { data }: { data: PageData } = $props();
	let lure = $derived(data.lure);
	let qrSvg = $derived(data.qrSvg);
	let t = $derived(data.t);
	let lureCatches = $derived(data.lureCatches);
	let authEnabled = $derived(data.authEnabled);

	let shareUrl = $derived(data.shareUrl);
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

	let waterTypeLabels = $derived<Record<string, string>>({
		freshwater: t.waterType_freshwater,
		saltwater: t.waterType_saltwater
	});

	let runningDepthLabels = $derived<Record<string, string>>({
		shallow: t.runningDepth_shallow,
		medium: t.runningDepth_medium,
		deep: t.runningDepth_deep
	});
</script>

<div class="of-lure">
	<!-- Header: back + secondary Edit -->
	<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;">
		<a href="/" class="of-tap" style="color:var(--of-text-3); font-size:0.875rem; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-3)';}}
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			{t.navLures}
		</a>
		<a href="/lures/{lure.id}/edit" class="of-touch"
			style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; padding:8px 16px; border-radius:9px; border:1px solid var(--of-border); text-decoration:none; transition:var(--of-transition); font-family:'DM Sans',sans-serif;"
			onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
			onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
		>
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
			{t.edit}
		</a>
	</div>

	<div class="of-lure-grid">
		<!-- Photo well + number plate: the lure's identity in the box -->
		<div class="of-lure-media">
			<div class="of-lure-well">
				{#if lure.photoPath}
					<img src="/uploads/{lure.photoPath}" srcset={detailSrcset(lure.photoPath)} sizes={DETAIL_SIZES} alt={lure.name} />
				{:else}
					<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
						<svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="color:var(--of-border);" aria-hidden="true">
							<ellipse cx="36" cy="32" rx="18" ry="9" fill="currentColor" opacity="0.8"/>
							<circle cx="48" cy="32" r="2.8" stroke="currentColor" stroke-width="1.6" fill="none"/>
							<path d="M12 32 C7 32 5 39 9 43 C13 47 17 44 16 40" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
							<path d="M52 32 L59 23 M52 32 L59 41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
					</div>
				{/if}
				{#if lure.lost}
					<span style="position:absolute; top:10px; left:10px; background:rgba(245,158,11,0.92); border-radius:6px; padding:3px 9px; font-size:0.8125rem; font-weight:700; letter-spacing:0.04em; color:#1a1204; text-transform:uppercase;">{t.lostStatus}</span>
				{/if}
			</div>
		</div>

		<!-- Facts -->
		<div class="of-lure-info of-panel">
			<div style="display:flex; align-items:flex-start; gap:16px;">
				<div style="flex:1; min-width:0;">
					{#if lure.lureNumber}
						<div class="of-lure-plate">#{String(lure.lureNumber).padStart(4, '0')}</div>
					{/if}
					<h1 style="font-family:'DM Sans',sans-serif; font-weight:600; font-size:var(--of-fs-headline); line-height:1.2; color:var(--of-text-bright); margin:2px 0 0; overflow-wrap:anywhere;">{lure.name}</h1>
					{#if lure.brand}
						<p style="font-size:0.9375rem; color:var(--of-text-3); margin:2px 0 0;">{lure.brand}</p>
					{/if}
					<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
						{#if lureCatches.length > 0}
							<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.8125rem; font-weight:600; color:var(--of-text-2); background:var(--of-bg-elevated); border:1px solid var(--of-border); padding:4px 10px; border-radius:20px;">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12c3-4 7-6 11-6 3 0 5 2 7 6-2 4-4 6-7 6-4 0-8-2-11-6z"/><path d="M3 12l-1.5-3M3 12l-1.5 3"/></svg>
								{t.lureCaughtN.replace('{n}', String(lureCatches.length))}
							</span>
						{/if}
						{#if lure.qrCoded}
							<span style="display:inline-flex; align-items:center; gap:6px; background:var(--of-success-bg); color:var(--of-success); font-size:0.8125rem; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid var(--of-success-border);">
								<svg width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
								{t.labeledStatus}
							</span>
						{/if}
					</div>
				</div>

				<!-- QR: scan to open this lure. Orange dot = no label printed yet. -->
				<div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0;">
					<div style="position:relative; width:72px; height:72px; background:#fff; border-radius:10px; padding:4px;">
						{@html qrSvg}
						{#if !lure.qrCoded}
							<span style="position:absolute; bottom:-4px; right:-4px; width:18px; height:18px; background:var(--of-warning-solid); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 2px var(--of-bg-surface);" aria-hidden="true">
								<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M5 2.5v3" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="7.5" r="0.9" fill="#fff"/></svg>
							</span>
						{/if}
					</div>
					{#if !lure.qrCoded}
						<a href="/settings/qr" style="font-size:0.75rem; color:var(--of-warning); text-decoration:none; white-space:nowrap;">{t.notLabeledYet}</a>
					{/if}
				</div>
			</div>

			<!-- Core details -->
			<dl class="of-lure-dl">
				{#if lure.type}
					<div><dt>{t.type}</dt><dd>{lure.type}</dd></div>
				{/if}
				{#if lure.color}
					<div><dt>{t.color}</dt><dd>{lure.color}</dd></div>
				{/if}
				{#if lure.weight}
					<div><dt>{t.weightG}</dt><dd class="num">{lure.weight}</dd></div>
				{/if}
				{#if lure.size}
					<div><dt>{t.size}</dt><dd class="num">{lure.size}</dd></div>
				{/if}
				{#if lure.amount > 1}
					<div><dt>{t.amount}</dt><dd class="num">×{lure.amount}</dd></div>
				{/if}
				{#if lure.runningDepth}
					<div><dt>{t.runningDepth}</dt><dd>{runningDepthLabels[lure.runningDepth] ?? lure.runningDepth}</dd></div>
				{/if}
				{#if lure.waterType}
					<div><dt>{t.waterType}</dt><dd>{waterTypeLabels[lure.waterType] ?? lure.waterType}</dd></div>
				{/if}
				{#if lure.lightConditions != null}
					<div><dt>{t.lightConditions}</dt><dd>{t[`lightConditions_${lure.lightConditions}` as keyof typeof t] ?? lure.lightConditions}</dd></div>
				{/if}
			</dl>

			<!-- Tags -->
			{#if lure.tags.length > 0}
				<div>
					<p class="of-lure-lbl">{t.tags}</p>
					<div style="display:flex; flex-wrap:wrap; gap:6px;">
						{#each lure.tags as tag (tag.id)}
							<span style="font-size:0.8125rem; padding:3px 10px; border-radius:20px; background:var(--of-success-bg); color:var(--of-success); border:1px solid var(--of-success-border); font-weight:500;">{tag.name}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Species -->
			{#if lure.species}
				<div>
					<p class="of-lure-lbl">{t.fishSpecies}</p>
					<div style="display:flex; flex-wrap:wrap; gap:6px;">
						{#each lure.species.split(/\s+/).filter(Boolean) as s}
							<span style="font-size:0.8125rem; padding:3px 10px; border-radius:20px; background:var(--of-accent-bg); color:var(--of-accent); border:1px solid var(--of-accent-border); font-weight:500;">{s}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Notes -->
			{#if lure.notes}
				<div>
					<p class="of-lure-lbl">{t.notes}</p>
					<p style="font-size:0.875rem; color:var(--of-text-2); white-space:pre-wrap; margin:0; line-height:1.6;">{lure.notes}</p>
				</div>
			{/if}

			<!-- Share link management -->
			{#if authEnabled}
				<div style="padding-top:16px; border-top:1px solid var(--of-border-subtle);">
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0 0 10px; display:flex; align-items:center; gap:6px;">
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
						{t.shareLink}
					</p>
					{#if shareUrl}
					<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
						<input type="text" value={shareUrl} readonly
							style="flex:1; min-width:0; background:var(--of-bg-base); border:1px solid var(--of-border-subtle); border-radius:8px; color:var(--of-text-2); font-family:'JetBrains Mono',monospace; font-size:0.75rem; padding:7px 10px; outline:none;" />
						<button onclick={copyShare}
							style="background:{copied ? 'var(--of-success-bg)' : 'var(--of-bg-elevated)'}; color:{copied ? 'var(--of-success)' : 'var(--of-text-2)'}; border:1px solid {copied ? 'var(--of-success-border)' : 'var(--of-border)'}; font-size:0.8125rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; transition:var(--of-transition); font-family:'DM Sans',sans-serif;">
							{copied ? t.shareCopied : t.shareCopy}
						</button>
						<button onclick={revokeShare}
							style="background:var(--of-bg-elevated); color:var(--of-danger); border:1px solid var(--of-danger-border); font-size:0.8125rem; font-weight:500; padding:7px 14px; border-radius:8px; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-danger-border)';}}>
							{t.shareRevoke}
						</button>
					</div>
					<p style="font-size:0.75rem; color:var(--of-text-4); margin:0;">{t.sharePublicNote}</p>
				{:else}
					<button onclick={createShare}
						style="display:inline-flex; align-items:center; gap:6px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.8125rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); cursor:pointer; font-family:'DM Sans',sans-serif; transition:var(--of-transition);"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
						{t.shareGenerate}
					</button>
				{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Catches with this lure -->
	<section class="of-panel" style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:14px; padding:20px; margin-top:16px;">
		<h2 style="font-family:'DM Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--of-text-bright); margin:0 0 12px;">{t.navCatches}</h2>

		{#if lureCatches.length === 0}
			<p style="font-size:0.875rem; color:var(--of-text-4); margin:0;">{t.catchNoItems}</p>
		{:else}
			<ul class="of-lure-catches">
				{#each lureCatches as c (c.id)}
					<li>
						<a href="/catches/{c.id}">
							<span class="thumb">
								{#if c.photos.length > 0}
									<img src={photoUrl(c.photos[0].filename, THUMB_SMALL)} alt="" loading="lazy" decoding="async" />
								{/if}
							</span>
							<span style="flex:1; min-width:0;">
								<span style="display:block; font-weight:600; color:var(--of-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{c.species ?? '—'}</span>
								<span style="display:block; font-size:0.75rem; color:var(--of-text-4);">{formatDate(c.caughtAt)}</span>
							</span>
							<span class="meas">
								{#if c.lengthCm != null}<span>{c.lengthCm}<small>&nbsp;cm</small></span>{/if}
								{#if c.weightG != null}<span>{c.weightG}<small>&nbsp;g</small></span>{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.of-lure { max-width: 580px; }
	.of-lure-grid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
	.of-lure-well {
		position: relative; aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden;
		background: var(--of-bg-base); border: 1px solid var(--of-border-subtle);
	}
	.of-lure-well img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.of-lure-info {
		background: var(--of-bg-surface); border: 1px solid var(--of-border-subtle); border-radius: 14px;
		padding: 20px; display: flex; flex-direction: column; gap: 18px;
	}
	.of-lure-plate {
		font-family: 'JetBrains Mono', monospace; font-size: var(--of-fs-figure); font-weight: 600; line-height: 1;
		letter-spacing: 0.02em; color: var(--of-accent);
	}
	.of-lure-dl {
		display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 24px; margin: 0;
		padding-top: 16px; border-top: 1px solid var(--of-border-subtle); font-size: 0.875rem;
	}
	.of-lure-dl dt { font-size: 0.75rem; color: var(--of-text-4); margin-bottom: 3px; }
	.of-lure-dl dd { font-weight: 600; color: var(--of-text-bright); margin: 0; overflow-wrap: anywhere; }
	.of-lure-dl dd.num { font-family: 'JetBrains Mono', monospace; }
	.of-lure-lbl { font-size: 0.75rem; color: var(--of-text-4); margin: 0 0 8px; }
	.of-lure-catches { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
	.of-lure-catches li + li { border-top: 1px solid var(--of-border-subtle); }
	.of-lure-catches a {
		display: flex; align-items: center; gap: 12px; padding: 8px 6px; margin: 0 -6px;
		border-radius: 8px; text-decoration: none; font-size: 0.875rem; min-height: 44px;
	}
	.of-lure-catches a:hover { background: var(--of-accent-glow); }
	.of-lure-catches a:focus-visible { outline: 2px solid var(--of-accent); outline-offset: -2px; }
	.of-lure-catches .thumb {
		width: 44px; height: 33px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: var(--of-bg-overlay);
	}
	.of-lure-catches .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.of-lure-catches .meas {
		display: flex; gap: 12px; flex-shrink: 0; font-family: 'JetBrains Mono', monospace;
		color: var(--of-text-bright); font-weight: 600;
	}
	.of-lure-catches .meas small { font-family: 'DM Sans', sans-serif; font-weight: 400; color: var(--of-text-4); font-size: 0.75rem; }
	@media (min-width: 960px) {
		.of-lure { max-width: 1040px; }
		.of-lure-grid { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
		/* Beside the photo the facts are the caption, not a second card: one framed object
		   (the photo) next to plain text, so unequal column heights don't read as a misfit.
		   0,2,0 + !important beats the phone .of-panel padding on touch screens >= 960px. */
		.of-lure-info.of-panel { background: none; border: none; border-radius: 0; padding: 4px 0 0 8px !important; }
	}
</style>
