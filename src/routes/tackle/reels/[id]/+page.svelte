<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const { t, reel: r, lineLogs, lines, combos } = data;

	let showAddForm = $state(false);

	const inputStyle = "width:100%; padding:9px 12px; background:#0f2238; border:1px solid #243f5e; border-radius:9px; color:#c2dce8; font-size:0.875rem; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color 0.15s;";
	const labelStyle = "display:block; font-size:0.72rem; font-weight:500; color:#5d8fa8; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.06em;";
	function focusInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='#06b6d4'; el.style.boxShadow='0 0 0 3px rgba(6,182,212,0.1)'; }
	function blurInput(e: FocusEvent) { const el = e.target as HTMLElement; el.style.borderColor='#243f5e'; el.style.boxShadow='none'; }

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function daysSince(d: Date) {
		return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
	}

	const today = new Date().toISOString().slice(0, 10);
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
				{#if r.size}
					<span style="font-size:0.75rem; color:#5d8fa8;">Size {r.size}</span>
				{/if}
			</div>
		</div>

		{#if r.notes}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 6px;">{t.reelNotes}</p>
				<p style="font-size:0.875rem; color:#8ab8cc; margin:0; line-height:1.6; white-space:pre-wrap;">{r.notes}</p>
			</div>
		{/if}

		<!-- Current Line -->
		<div>
			<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 10px;">{t.reelCurrentLine}</p>

			{#if form?.error}
				<div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:8px 12px; margin-bottom:10px; color:#f87171; font-size:0.8rem;">{t[form.error as keyof typeof t] ?? form.error}</div>
			{/if}

			{#if !showAddForm}
				{#if lineLogs.length > 0}
					<div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(34,211,238,0.06); border:1px solid rgba(34,211,238,0.25); border-radius:10px;">
						<div style="width:8px; height:8px; border-radius:50%; background:#22d3ee; flex-shrink:0;"></div>
						<div style="flex:1; min-width:0;">
							<div style="font-size:0.9rem; font-weight:600; color:#22d3ee;">
								{lineLogs[0].line ? `${lineLogs[0].line.brand ?? ''} ${lineLogs[0].line.model}`.trim() : '—'}
								{#if lineLogs[0].line?.type}
									<span style="font-size:0.72rem; color:#5d8fa8; font-weight:400; margin-left:6px;">({lineLogs[0].line.type})</span>
								{/if}
							</div>
							<div style="font-size:0.72rem; color:#5d8fa8; margin-top:2px;">
								{t.reelSpooledAt} {formatDate(lineLogs[0].spooledAt)} · {daysSince(lineLogs[0].spooledAt)}d ago
							</div>
						</div>
						<button
							onclick={() => showAddForm = true}
							style="display:inline-flex; align-items:center; gap:5px; background:#0f2238; color:#8ab8cc; border:1px solid #243f5e; font-size:0.75rem; font-weight:600; padding:5px 10px; border-radius:7px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; flex-shrink:0;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.borderColor='rgba(34,211,238,0.4)'; (e.currentTarget as HTMLElement).style.color='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.borderColor='#243f5e'; (e.currentTarget as HTMLElement).style.color='#8ab8cc';}}
						>{t.reelAddSpooling}</button>
					</div>
				{:else}
					<div style="background:#060d17; border:1px dashed #243f5e; border-radius:10px; padding:20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px;">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="opacity:0.3;"><circle cx="12" cy="12" r="8" stroke="#22d3ee" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="#22d3ee" stroke-width="1.3"/></svg>
						<p style="font-size:0.8rem; color:#3d6a84; margin:0;">{t.reelNoLineLogs}</p>
						<button
							onclick={() => showAddForm = true}
							style="display:inline-flex; align-items:center; gap:6px; background:#06b6d4; color:#030a12; font-size:0.8rem; font-weight:700; padding:8px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
						>
							<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
							{t.reelAddSpooling}
						</button>
					</div>
				{/if}
			{/if}

			{#if showAddForm}
				<form method="POST" action="?/addLine" use:enhance style="background:#060d17; border:1px solid rgba(34,211,238,0.2); border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:12px;">
					<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
						<div>
							<label style={labelStyle}>{t.reelLineSelect}</label>
							<select name="line_id" style="{inputStyle} appearance:none;">
								<option value="">{t.reelLineSelectNone}</option>
								{#each lines as l}
									<option value={l.id}>{l.brand ? `${l.brand} ${l.model}` : l.model}{l.type ? ` (${l.type})` : ''}</option>
								{/each}
							</select>
						</div>
						<div>
							<label style={labelStyle}>{t.reelSpooledAt} *</label>
							<input name="spooled_at" type="date" value={today} required style={inputStyle} onfocus={focusInput} onblur={blurInput} />
						</div>
					</div>
					<div>
						<label style={labelStyle}>{t.reelLineLogNotes}</label>
						<input name="notes" type="text" style={inputStyle} onfocus={focusInput} onblur={blurInput} />
					</div>
					<div style="display:flex; gap:8px;">
						<button type="submit"
							style="background:#06b6d4; color:#030a12; font-size:0.8rem; font-weight:700; padding:8px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
							onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
							onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
						>{t.reelLineLogSave}</button>
						<button type="button" onclick={() => showAddForm = false}
							style="background:#0f2238; color:#5d8fa8; border:1px solid #243f5e; font-size:0.8rem; font-weight:500; padding:8px 18px; border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif;"
						>{t.cancel}</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- Line history -->
		{#if lineLogs.length > 1}
			<div>
				<p style="font-size:0.72rem; font-weight:500; color:#3d6a84; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">{t.reelLineLog}</p>
				<div style="display:flex; flex-direction:column; gap:6px;">
					{#each lineLogs.slice(1) as log}
						<div style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:#060d17; border:1px solid #172f4a; border-radius:9px;">
							<div style="width:5px; height:5px; border-radius:50%; background:#243f5e; flex-shrink:0;"></div>
							<div style="flex:1; min-width:0;">
								<div style="font-size:0.78rem; font-weight:600; color:#8ab8cc;">
									{log.line ? `${log.line.brand ?? ''} ${log.line.model}`.trim() : '—'}
									{#if log.line?.type}
										<span style="font-size:0.68rem; color:#5d8fa8; font-weight:400; margin-left:6px;">({log.line.type})</span>
									{/if}
								</div>
								<div style="font-size:0.72rem; color:#3d6a84; margin-top:2px;">
									{formatDate(log.spooledAt)}
									{#if log.notes}<span style="margin-left:6px;">· {log.notes}</span>{/if}
								</div>
							</div>
							<form method="POST" action="?/deleteLine" use:enhance>
								<input type="hidden" name="log_id" value={log.id} />
								<button type="submit"
									style="background:transparent; border:none; color:#3d6a84; cursor:pointer; padding:4px; border-radius:5px; transition:color 0.15s;"
									onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#f87171';}}
									onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#3d6a84';}}
									title={t.reelLineLogDelete}
								>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</button>
							</form>
						</div>
					{/each}
				</div>
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
			<a href="/tackle/reels/{r.id}/edit"
				style="display:inline-block; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:600; padding:9px 20px; border-radius:9px; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background 0.15s;"
				onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
				onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
			>{t.edit}</a>
		</div>
	</div>
</div>
