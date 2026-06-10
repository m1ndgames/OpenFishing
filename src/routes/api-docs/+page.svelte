<script lang="ts">
	import { onMount } from 'svelte';
	import 'swagger-ui-dist/swagger-ui.css';

	onMount(async () => {
		const { default: SwaggerUIBundle } = await import('swagger-ui-dist/swagger-ui-es-bundle');
		SwaggerUIBundle({
			url: '/api/openapi',
			dom_id: '#swagger-ui',
			presets: [SwaggerUIBundle.presets.apis],
			layout: 'BaseLayout',
			deepLinking: true
		});
	});
</script>

<div id="swagger-ui"></div>

<style>
	/* ── Layout ──────────────────────────────────────────────────────────── */
	:global(#swagger-ui) {
		font-family: 'DM Sans', sans-serif;
		color: #c2dce8;
	}
	:global(.swagger-ui) {
		font-family: 'DM Sans', sans-serif;
		color: #c2dce8;
	}
	:global(.swagger-ui .wrapper) {
		padding: 0;
		max-width: none;
	}

	/* ── Info header ─────────────────────────────────────────────────────── */
	:global(.swagger-ui .info) {
		margin: 24px 0 16px;
	}
	:global(.swagger-ui .info .title) {
		font-family: 'Carter One', sans-serif;
		color: #c2dce8;
	}
	:global(.swagger-ui .info .title small) {
		background: #0f2238;
		border: 1px solid #243f5e;
		color: #8ab8cc;
		border-radius: 6px;
	}
	:global(.swagger-ui .info .title small pre) {
		color: #8ab8cc;
	}
	:global(.swagger-ui .info p),
	:global(.swagger-ui .info li) {
		color: #8ab8cc;
	}
	:global(.swagger-ui .info a) {
		color: #22d3ee;
	}

	/* ── Servers + Authorize bar ─────────────────────────────────────────── */
	:global(.swagger-ui .scheme-container) {
		background: #0b1a2c;
		border: 1px solid #243f5e;
		border-radius: 10px;
		padding: 16px 20px;
		box-shadow: none;
		margin-bottom: 16px;
	}
	:global(.swagger-ui .scheme-container .schemes > label) {
		color: #8ab8cc;
		font-family: 'DM Sans', sans-serif;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	:global(.swagger-ui .scheme-container select) {
		background: #0f2238;
		border: 1px solid #243f5e;
		color: #c2dce8;
		border-radius: 8px;
		font-size: 14px;
		padding: 7px 28px 7px 10px;
		appearance: none;
	}
	:global(.swagger-ui .btn.authorize) {
		background: transparent;
		border: 1.5px solid #22d3ee;
		color: #22d3ee;
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
		font-weight: 600;
		transition: background 0.15s;
	}
	:global(.swagger-ui .btn.authorize:hover) {
		background: rgba(34, 211, 238, 0.1);
	}
	:global(.swagger-ui .btn.authorize svg) {
		fill: #22d3ee;
	}
	:global(.swagger-ui .btn.authorize.locked svg) {
		fill: #22d3ee;
	}

	/* ── Section tags (Lures / Spots / Catches) ──────────────────────────── */
	:global(.swagger-ui .opblock-tag) {
		color: #c2dce8 !important;
		border-bottom: 1px solid #243f5e;
		font-family: 'Carter One', sans-serif !important;
		font-size: 18px;
		padding: 12px 4px;
	}
	:global(.swagger-ui .opblock-tag:hover) {
		background: rgba(34, 211, 238, 0.04);
		border-radius: 6px;
	}
	:global(.swagger-ui .opblock-tag small) {
		color: #5d8fa8;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
	}
	:global(.swagger-ui .opblock-tag-section) {
		margin-bottom: 8px;
	}

	/* ── Operation blocks ────────────────────────────────────────────────── */
	:global(.swagger-ui .opblock) {
		border-radius: 8px !important;
		border: 1px solid #243f5e !important;
		background: #0b1a2c !important;
		box-shadow: none !important;
		margin-bottom: 6px;
	}
	:global(.swagger-ui .opblock.opblock-get) {
		border-color: rgba(34, 211, 238, 0.25) !important;
		background: rgba(34, 211, 238, 0.03) !important;
	}
	:global(.swagger-ui .opblock.opblock-get .opblock-summary) {
		border-color: rgba(34, 211, 238, 0.25);
	}
	:global(.swagger-ui .opblock.opblock-get .opblock-summary-method) {
		background: #22d3ee !important;
		color: #030a12 !important;
		font-weight: 700;
		border-radius: 5px;
		min-width: 54px;
	}
	:global(.swagger-ui .opblock-summary) {
		padding: 10px 16px;
	}
	:global(.swagger-ui .opblock-summary-path),
	:global(.swagger-ui .opblock-summary-path__deprecated) {
		color: #c2dce8 !important;
		font-family: 'JetBrains Mono', monospace !important;
		font-size: 14px;
	}
	:global(.swagger-ui .opblock-summary-description) {
		color: #5d8fa8 !important;
		font-size: 13px;
	}
	:global(.swagger-ui .opblock-summary-control:focus) {
		outline: none;
	}

	/* expanded body */
	:global(.swagger-ui .opblock-body) {
		background: transparent;
	}
	:global(.swagger-ui .opblock-section-header) {
		background: #0d1f35 !important;
		border-bottom: 1px solid #243f5e;
		padding: 8px 16px;
	}
	:global(.swagger-ui .opblock-section-header h4) {
		color: #8ab8cc !important;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	:global(.swagger-ui .opblock-section-header label) {
		color: #8ab8cc;
	}

	/* ── Parameters table ────────────────────────────────────────────────── */
	:global(.swagger-ui .parameters-container),
	:global(.swagger-ui .table-container) {
		background: transparent;
		padding: 0 16px 12px;
	}
	:global(.swagger-ui table) {
		border-collapse: collapse;
		width: 100%;
	}
	:global(.swagger-ui table thead tr th) {
		color: #5d8fa8 !important;
		border-bottom: 1px solid #243f5e;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px 10px;
		background: transparent;
	}
	:global(.swagger-ui table tbody tr td) {
		color: #c2dce8;
		border-bottom: 1px solid rgba(36, 63, 94, 0.4);
		padding: 8px 10px;
		vertical-align: top;
		background: transparent;
	}
	:global(.swagger-ui table tbody tr:last-child td) {
		border-bottom: none;
	}
	:global(.swagger-ui .parameter__name) {
		color: #c2dce8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	:global(.swagger-ui .parameter__name.required::after) {
		color: #f59e0b;
	}
	:global(.swagger-ui .parameter__type) {
		color: #22d3ee;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .parameter__in) {
		color: #5d8fa8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .parameter__deprecated) {
		color: #f59e0b;
	}
	:global(.swagger-ui .markdown p) {
		color: #8ab8cc;
		font-size: 13px;
	}

	/* ── Try it out ──────────────────────────────────────────────────────── */
	:global(.swagger-ui .try-out) {
		padding: 0;
	}
	:global(.swagger-ui .try-out__btn) {
		background: transparent;
		border: 1.5px solid rgba(34, 211, 238, 0.4);
		color: #22d3ee;
		border-radius: 6px;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 600;
		transition: background 0.15s;
	}
	:global(.swagger-ui .try-out__btn:hover) {
		background: rgba(34, 211, 238, 0.08);
	}
	:global(.swagger-ui .try-out__btn.cancel) {
		border-color: rgba(93, 143, 168, 0.4);
		color: #8ab8cc;
	}
	:global(.swagger-ui input[type='text']),
	:global(.swagger-ui input[type='password']),
	:global(.swagger-ui textarea.curl) {
		background: #0f2238 !important;
		border: 1px solid #243f5e !important;
		color: #c2dce8 !important;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		padding: 7px 10px;
	}
	:global(.swagger-ui input:focus),
	:global(.swagger-ui textarea:focus) {
		border-color: #06b6d4 !important;
		outline: none !important;
		box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15) !important;
	}
	:global(.swagger-ui .btn.execute) {
		background: #22d3ee;
		color: #030a12;
		border: none;
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
		font-weight: 700;
	}
	:global(.swagger-ui .btn.execute:hover) {
		background: #06b6d4;
	}
	:global(.swagger-ui .btn.cancel) {
		background: transparent;
		border: 1px solid #243f5e;
		color: #8ab8cc;
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .execute-wrapper) {
		padding: 12px 16px;
		border-top: 1px solid #243f5e;
	}

	/* ── Responses ───────────────────────────────────────────────────────── */
	:global(.swagger-ui .responses-wrapper) {
		padding: 0 16px 12px;
	}
	:global(.swagger-ui .responses-inner) {
		padding: 0;
		background: transparent;
	}
	:global(.swagger-ui .response-col_status) {
		color: #c2dce8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 600;
	}
	:global(.swagger-ui .response-col_description) {
		color: #8ab8cc;
		font-size: 13px;
	}
	:global(.swagger-ui .response-col_links) {
		color: #5d8fa8;
	}
	:global(.swagger-ui .live-responses-table .response-col_status) {
		color: #22d3ee;
	}

	/* code / curl output */
	:global(.swagger-ui .microlight) {
		background: #060d17 !important;
		color: #c2dce8 !important;
		border-radius: 6px;
		padding: 12px 14px;
		font-family: 'JetBrains Mono', monospace !important;
		font-size: 13px;
		line-height: 1.6;
	}
	:global(.swagger-ui .highlight-code) {
		background: #060d17;
		border-radius: 6px;
	}
	:global(.swagger-ui .response-control-media-type__accept-message) {
		color: #5d8fa8;
		font-size: 12px;
	}
	:global(.swagger-ui .curl-command) {
		background: #060d17;
		border-radius: 6px;
		padding: 0;
	}
	:global(.swagger-ui .copy-to-clipboard) {
		background: #0f2238;
		border-left: 1px solid #243f5e;
		border-radius: 0 6px 0 0;
	}
	:global(.swagger-ui .copy-to-clipboard button) {
		background: none;
		color: #8ab8cc;
	}
	:global(.swagger-ui .copy-to-clipboard button:hover) {
		color: #22d3ee;
	}

	/* ── Models / Schemas ────────────────────────────────────────────────── */
	:global(.swagger-ui section.models) {
		border: 1px solid #243f5e;
		border-radius: 10px;
		background: #0b1a2c;
		margin-top: 24px;
	}
	:global(.swagger-ui section.models h4) {
		color: #c2dce8 !important;
		font-family: 'Carter One', sans-serif;
		font-size: 18px;
		padding: 12px 16px;
		margin: 0;
	}
	:global(.swagger-ui section.models.is-open h4) {
		border-bottom: 1px solid #243f5e;
	}
	:global(.swagger-ui section.models .models-control) {
		fill: #5d8fa8;
	}
	:global(.swagger-ui .model-container) {
		background: #0d1f35;
		border-radius: 6px;
		margin: 8px 16px;
		border: 1px solid #243f5e;
	}
	:global(.swagger-ui .model-container:last-of-type) {
		margin-bottom: 16px;
	}
	:global(.swagger-ui .model-title__text) {
		color: #c2dce8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
	}
	:global(.swagger-ui .model-toggle) {
		fill: #5d8fa8;
	}
	:global(.swagger-ui .model) {
		color: #c2dce8;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	:global(.swagger-ui .prop-type) {
		color: #22d3ee;
	}
	:global(.swagger-ui .prop-format) {
		color: #5d8fa8;
	}
	:global(.swagger-ui .prop.primitive) {
		color: #c2dce8;
	}
	:global(.swagger-ui span.model .prop-name) {
		color: #c2dce8;
	}
	:global(.swagger-ui .model span[style*='font-weight:bold']) {
		color: #8ab8cc !important;
	}
	:global(.swagger-ui .model-box) {
		background: #060d17;
		border-radius: 4px;
		padding: 8px;
	}

	/* ── Authorize modal ─────────────────────────────────────────────────── */
	:global(.swagger-ui .dialog-ux .backdrop-ux) {
		background: rgba(3, 10, 18, 0.7);
		backdrop-filter: blur(4px);
	}
	:global(.swagger-ui .dialog-ux .modal-ux) {
		background: #0b1a2c;
		border: 1px solid #243f5e;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header) {
		background: #0f2238;
		border-bottom: 1px solid #243f5e;
		border-radius: 12px 12px 0 0;
		padding: 16px 20px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header h3) {
		color: #c2dce8;
		font-family: 'Carter One', sans-serif;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header .close-modal) {
		background: none;
		border: none;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header .close-modal svg) {
		fill: #5d8fa8;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content) {
		background: #0b1a2c;
		border-radius: 0 0 12px 12px;
		padding: 20px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content p) {
		color: #8ab8cc;
		font-size: 13px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content label) {
		color: #8ab8cc;
		font-size: 13px;
		font-weight: 600;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content code) {
		background: #0f2238;
		color: #22d3ee;
		border-radius: 4px;
		padding: 1px 5px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .auth-container) {
		border-bottom: 1px solid #243f5e;
		padding-bottom: 16px;
		margin-bottom: 16px;
	}
	:global(.swagger-ui .auth-container:last-of-type) {
		border-bottom: none;
	}
	:global(.swagger-ui .auth-container h4) {
		color: #c2dce8;
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .auth-container .scopes h2) {
		color: #8ab8cc;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
	}
	:global(.swagger-ui .authorize__btn) {
		color: #22d3ee;
	}

	/* ── SVG icons / arrows ──────────────────────────────────────────────── */
	:global(.swagger-ui .arrow) {
		fill: #5d8fa8;
	}
	:global(.swagger-ui svg.arrow) {
		fill: #5d8fa8;
	}
	:global(.swagger-ui .expand-methods svg),
	:global(.swagger-ui .expand-operation svg) {
		fill: #5d8fa8;
	}

	/* ── Misc ────────────────────────────────────────────────────────────── */
	:global(.swagger-ui .loading-container) {
		background: #0b1a2c;
	}
	:global(.swagger-ui .loading-container .loading::after) {
		color: #8ab8cc;
	}
	:global(.swagger-ui select) {
		background: #0f2238;
		border: 1px solid #243f5e;
		color: #c2dce8;
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .response-control-media-type--accept-controller select),
	:global(.swagger-ui .content-type select) {
		background: #0f2238;
		border: 1px solid #243f5e;
		color: #c2dce8;
		border-radius: 6px;
		font-size: 13px;
		padding: 5px 10px;
	}
	:global(.swagger-ui .errors-wrapper) {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		padding: 12px;
	}
	:global(.swagger-ui .errors-wrapper .errors h4) {
		color: #ef4444;
	}

	/* scrollbar */
	:global(.swagger-ui *::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	:global(.swagger-ui *::-webkit-scrollbar-track) {
		background: #0b1a2c;
	}
	:global(.swagger-ui *::-webkit-scrollbar-thumb) {
		background: #243f5e;
		border-radius: 3px;
	}
	:global(.swagger-ui *::-webkit-scrollbar-thumb:hover) {
		background: #3d6a84;
	}
</style>
