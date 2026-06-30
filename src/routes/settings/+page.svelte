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

	function importSuccessMsg(lures: number, spots: number, catches: number) {
		return t.backupImportSuccess
			.replace('{lures}', String(lures))
			.replace('{spots}', String(spots))
			.replace('{catches}', String(catches));
	}
</script>

<div>
	<!-- Database section -->
	<section style="margin-bottom:32px;">

		<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; overflow:hidden;">

			<!-- Stats row -->
			<div style="padding:16px 20px; border-bottom:1px solid var(--of-border-subtle); display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--of-text-4); margin:0 0 3px;">{t.navLures}</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-text-bright); margin:0;">{data.lureCount}</p>
				</div>
				<div style="height:32px; width:1px; background:var(--of-border-subtle);"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--of-text-4); margin:0 0 3px;">{t.navSpots}</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-text-bright); margin:0;">{data.spotCount}</p>
				</div>
				<div style="height:32px; width:1px; background:var(--of-border-subtle);"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--of-text-4); margin:0 0 3px;">{t.navCatches}</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:600; color:var(--of-text-bright); margin:0;">{data.catchCount}</p>
				</div>
				<div style="height:32px; width:1px; background:var(--of-border-subtle);"></div>
				<div>
					<p style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--of-text-4); margin:0 0 3px;">{t.backupSchemaHash}</p>
					<p style="font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--of-text-3); margin:0; word-break:break-all;">{data.schemaHash.slice(0, 16)}…</p>
				</div>
			</div>

			<!-- Export -->
			<div style="padding:18px 20px; border-bottom:1px solid var(--of-border-subtle);">
				<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;">
					<div>
						<p style="font-weight:600; color:var(--of-text); margin:0 0 4px; font-size:0.925rem;">{t.backupExportTitle}</p>
						<p style="font-size:0.8rem; color:var(--of-text-4); margin:0;">{t.backupExportDesc}</p>
					</div>
					<a
						href="/api/settings/export"
						download
						style="flex-shrink:0; display:inline-flex; align-items:center; gap:7px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; text-decoration:none; transition:background 0.15s; font-family:'DM Sans',sans-serif; white-space:nowrap;"
						onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
						onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
					>
						<svg width="14" height="14" viewBox="0 0 15 15" fill="none">
							<path d="M7.5 1.5v9M4.5 8l3 3 3-3M2.5 12.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						{t.backupExportBtn}
					</a>
				</div>
			</div>

			<!-- Import -->
			<div style="padding:18px 20px;">
				<p style="font-weight:600; color:var(--of-text); margin:0 0 4px; font-size:0.925rem;">{t.backupImportTitle}</p>
				<p style="font-size:0.8rem; color:var(--of-text-4); margin:0 0 14px;">{t.backupImportDesc}</p>

				{#if form?.error}
					<div style="background:var(--of-danger-bg); border:1px solid var(--of-danger-border); color:var(--of-danger); font-size:0.82rem; padding:10px 14px; border-radius:9px; margin-bottom:12px; line-height:1.5;">
						{(t as unknown as Record<string,string>)[form.error] ?? form.error}
					</div>
				{/if}

				{#if form?.success}
					<div style="background:var(--of-success-bg); border:1px solid var(--of-success-border); color:var(--of-success); font-size:0.82rem; padding:10px 14px; border-radius:9px; margin-bottom:12px;">
						{importSuccessMsg(form.lureCount, form.spotCount, form.catchCount)}
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
						<span style="display:inline-flex; align-items:center; gap:7px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.82rem; font-weight:500; padding:8px 14px; border-radius:8px; border:1px solid var(--of-border); cursor:pointer; transition:all 0.15s; white-space:nowrap;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-solid)'; (e.currentTarget as HTMLElement).style.color='var(--of-accent)';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)'; (e.currentTarget as HTMLElement).style.color='var(--of-text-2)';}}
						>
							<svg width="13" height="13" viewBox="0 0 15 15" fill="none">
								<path d="M3 12.5h9M7.5 9V1.5M4.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{t.backupChooseFile}
						</span>
						{#if fileName}
							<span style="font-size:0.8rem; color:var(--of-text-3); font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{fileName}</span>
						{:else}
							<span style="font-size:0.8rem; color:var(--of-text-4);">{t.backupNoFile}</span>
						{/if}
					</label>

					<!-- Confirmation checkbox — only shown once a file is picked -->
					{#if fileName}
						<label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; user-select:none; margin-top:2px;">
							<input type="checkbox" bind:checked={confirmed}
								style="margin-top:2px; width:15px; height:15px; flex-shrink:0; accent-color:var(--of-warning-solid); cursor:pointer;" />
							<span style="font-size:0.8rem; color:var(--of-text-2); line-height:1.5;">
								{t.backupConfirmBefore} <strong style="color:var(--of-warning);">{t.backupConfirmBold}</strong> {t.backupConfirmAfter}
							</span>
						</label>

						<div>
							<button
								type="submit"
								disabled={!confirmed || importing}
								style="display:inline-flex; align-items:center; gap:7px; background:var(--of-warning-bg); color:var(--of-warning); font-size:0.875rem; font-weight:700; padding:9px 18px; border-radius:9px; border:1px solid var(--of-warning-border); cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif; {(!confirmed || importing) ? 'opacity:0.45; cursor:not-allowed;' : ''}"
								onmouseenter={function(e){ if (confirmed && !importing) { (e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.18)'; }}}
								onmouseleave={function(e){ (e.currentTarget as HTMLElement).style.background='var(--of-warning-bg)'; }}
							>
								{#if importing}
									{t.backupImporting}
								{:else}
									<svg width="13" height="13" viewBox="0 0 15 15" fill="none">
										<path d="M7.5 13.5v-9M4.5 7.5l3 3 3-3M2.5 2.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									{t.backupImportBtn}
								{/if}
							</button>
						</div>
					{/if}
				</form>
			</div>
		</div>
	</section>
</div>
