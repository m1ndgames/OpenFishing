<script lang="ts">
	import type { LayoutData } from '../$types';

	let { data }: { data: LayoutData } = $props();
	const { t } = data;

	const year = new Date().getFullYear();
	let from = $state(`${year}-01-01`);
	let to = $state(`${year}-12-31`);

	const exportUrl = $derived(`/api/catches/export?from=${from}&to=${to}`);
</script>

<div>
	<section>
		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">

			<div style="padding:18px 20px; border-bottom:1px solid var(--of-border-subtle);">
				<p style="font-weight:600; color:var(--of-text); margin:0 0 4px; font-size:0.925rem;">{t.catchExportTitle}</p>
				<p style="font-size:0.8rem; color:var(--of-text-4); margin:0;">{t.catchExportDesc}</p>
			</div>

			<div style="padding:20px;">
				<div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end; margin-bottom:20px;">
					<div>
						<label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.07em; color:var(--of-text-4); margin-bottom:6px;">{t.catchExportFrom}</label>
						<input
							type="date"
							bind:value={from}
							style="background:var(--of-bg-elevated); color:var(--of-text); border:1px solid var(--of-border); border-radius:9px; padding:7px 12px; font-size:0.875rem; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer;"
							onfocus={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
							onblur={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
						/>
					</div>

					<div>
						<label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.07em; color:var(--of-text-4); margin-bottom:6px;">{t.catchExportTo}</label>
						<input
							type="date"
							bind:value={to}
							style="background:var(--of-bg-elevated); color:var(--of-text); border:1px solid var(--of-border); border-radius:9px; padding:7px 12px; font-size:0.875rem; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer;"
							onfocus={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
							onblur={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
						/>
					</div>
				</div>

				<a
					href={exportUrl}
					download
					style="display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif; white-space:nowrap;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
				>
					<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
						<path d="M7.5 1.5v9M4.5 8l3 3 3-3M2.5 12.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t.catchExportBtn}
				</a>
			</div>
		</div>
	</section>
</div>
