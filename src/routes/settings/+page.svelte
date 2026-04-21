<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { t } = data;

	let importing = $state(false);
	let fileName = $state<string | null>(null);
	let confirmed = $state(false);

	function onFileChange(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		fileName = f?.name ?? null;
		confirmed = false;
	}
</script>

<div>
	<!-- Database section -->
	<section style="margin-bottom:32px;">
		<h2 style="font-family:'Carter One',sans-serif; font-weight:700; font-size:1rem; color:#8ab8cc; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 14px;">Database</h2>

		<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; overflow:hidden;">

			<!-- Stats row -->
			<div style="padding:16px 20px; border-bottom:1px solid #172f4a; display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 3px;">Lures</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#e0eaf8; margin:0;">{data.lureCount}</p>
				</div>
				<div style="height:32px; width:1px; background:#172f4a;"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 3px;">Spots</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#e0eaf8; margin:0;">{data.spotCount}</p>
				</div>
				<div style="height:32px; width:1px; background:#172f4a;"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 3px;">Catches</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:#e0eaf8; margin:0;">{data.catchCount}</p>
				</div>
				<div style="height:32px; width:1px; background:#172f4a;"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:#3d6a84; margin:0 0 3px;">Schema hash</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:#5d8fa8; margin:0; word-break:break-all;">{data.schemaHash.slice(0, 16)}…</p>
				</div>
			</div>

			<!-- Export -->
			<div style="padding:18px 20px; border-bottom:1px solid #172f4a;">
				<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;">
					<div>
						<p style="font-weight:600; color:#c2dce8; margin:0 0 4px; font-size:0.925rem;">Export backup</p>
						<p style="font-size:0.8rem; color:#3d6a84; margin:0;">Downloads all lures, spots, catches and photos as a ZIP archive.</p>
					</div>
					<a
						href="/api/settings/export"
						download
						style="flex-shrink:0; display:inline-flex; align-items:center; gap:7px; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif; white-space:nowrap;"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
					>
						<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
							<path d="M7.5 1.5v9M4.5 8l3 3 3-3M2.5 12.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						Export
					</a>
				</div>
			</div>

			<!-- Import -->
			<div style="padding:18px 20px;">
				<p style="font-weight:600; color:#c2dce8; margin:0 0 4px; font-size:0.925rem;">Import backup</p>
				<p style="font-size:0.8rem; color:#3d6a84; margin:0 0 14px;">Replaces all existing data and photos with the backup contents. Schema version is verified automatically before anything is changed.</p>

				{#if form?.error}
					<div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; font-size:0.82rem; padding:10px 14px; border-radius:9px; margin-bottom:12px; line-height:1.5;">
						{form.error}
					</div>
				{/if}

				{#if form?.success}
					<div style="background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.2); color:#4ade80; font-size:0.82rem; padding:10px 14px; border-radius:9px; margin-bottom:12px;">
						Import successful — {form.lureCount} lures, {form.spotCount} spots, {form.catchCount} catches restored.
					</div>
				{/if}

				<form
					method="POST"
					action="?/import"
					enctype="multipart/form-data"
					style="display:flex; flex-direction:column; gap:10px;"
					use:enhance={() => {
						importing = true;
						return async ({ update }) => {
							await update();
							importing = false;
							confirmed = false;
							fileName = null;
						};
					}}
					onsubmit={(e) => {
						if (!confirmed) { e.preventDefault(); return; }
					}}
				>
					<!-- File picker -->
					<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
						<input
							type="file"
							name="backup"
							accept=".zip"
							class="hidden"
							onchange={onFileChange}
						/>
						<span style="display:inline-flex; align-items:center; gap:7px; background:#0f2238; color:#8ab8cc; font-size:0.82rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid #243f5e; cursor:pointer; transition:all 0.15s; white-space:nowrap;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='#06b6d4'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
						>
							<svg width="13" height="13" viewBox="0 0 15 15" fill="none">
								<path d="M3 12.5h9M7.5 9V1.5M4.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							Choose file
						</span>
						{#if fileName}
							<span style="font-size:0.8rem; color:#5d8fa8; font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{fileName}</span>
						{:else}
							<span style="font-size:0.8rem; color:#3d6a84;">No file chosen</span>
						{/if}
					</label>

					<!-- Confirmation checkbox — only shown once a file is picked -->
					{#if fileName}
						<label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; user-select:none; margin-top:2px;">
							<input type="checkbox" bind:checked={confirmed}
								style="margin-top:2px; width:15px; height:15px; flex-shrink:0; accent-color:#f59e0b; cursor:pointer;" />
							<span style="font-size:0.8rem; color:#8ab8cc; line-height:1.5;">
								I understand this will <strong style="color:#fbbf24;">permanently replace all current data</strong> with the contents of this backup. This cannot be undone.
							</span>
						</label>

						<div>
							<button
								type="submit"
								disabled={!confirmed || importing}
								style="display:inline-flex; align-items:center; gap:7px; background:rgba(245,158,11,0.12); color:#fbbf24; font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; border:1px solid rgba(245,158,11,0.3); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {(!confirmed || importing) ? 'opacity:0.45; cursor:not-allowed;' : ''}"
								onmouseenter={function(e){ if (confirmed && !importing) { (e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.2)'; }}}
								onmouseleave={function(e){ (e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.12)'; }}
							>
								{#if importing}
									Importing…
								{:else}
									<svg width="13" height="13" viewBox="0 0 15 15" fill="none">
										<path d="M7.5 13.5v-9M4.5 7.5l3 3 3-3M2.5 2.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									Import &amp; Replace
								{/if}
							</button>
						</div>
					{/if}
				</form>
			</div>
		</div>
	</section>
</div>
