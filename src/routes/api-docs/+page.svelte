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
		color: var(--of-text);
	}
	:global(.swagger-ui) {
		font-family: 'DM Sans', sans-serif;
		color: var(--of-text);
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
		color: var(--of-text);
	}
	:global(.swagger-ui .info .title small) {
		background: var(--of-bg-elevated);
		border: 1px solid var(--of-border);
		color: var(--of-text-2);
		border-radius: 6px;
	}
	:global(.swagger-ui .info .title small pre) {
		color: var(--of-text-2);
	}
	:global(.swagger-ui .info p),
	:global(.swagger-ui .info li) {
		color: var(--of-text-2);
	}
	:global(.swagger-ui .info a) {
		color: var(--of-accent);
	}

	/* ── Servers + Authorize bar ─────────────────────────────────────────── */
	:global(.swagger-ui .scheme-container) {
		background: var(--of-bg-surface);
		border: 1px solid var(--of-border);
		border-radius: 10px;
		padding: 16px 20px;
		box-shadow: none;
		margin-bottom: 16px;
	}
	:global(.swagger-ui .scheme-container .schemes > label) {
		color: var(--of-text-2);
		font-family: 'DM Sans', sans-serif;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	:global(.swagger-ui .scheme-container select) {
		background: var(--of-bg-elevated);
		border: 1px solid var(--of-border);
		color: var(--of-text);
		border-radius: 8px;
		font-size: 14px;
		padding: 7px 28px 7px 10px;
		appearance: none;
	}
	:global(.swagger-ui .btn.authorize) {
		background: transparent;
		border: 1.5px solid var(--of-accent);
		color: var(--of-accent);
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
		font-weight: 600;
		transition: background 0.15s;
	}
	:global(.swagger-ui .btn.authorize:hover) {
		background: var(--of-accent-bg);
	}
	:global(.swagger-ui .btn.authorize svg) {
		fill: var(--of-accent);
	}
	:global(.swagger-ui .btn.authorize.locked svg) {
		fill: var(--of-accent);
	}

	/* ── Section tags (Lures / Spots / Catches) ──────────────────────────── */
	:global(.swagger-ui .opblock-tag) {
		color: var(--of-text) !important;
		border-bottom: 1px solid var(--of-border);
		font-family: 'Carter One', sans-serif !important;
		font-size: 18px;
		padding: 12px 4px;
	}
	:global(.swagger-ui .opblock-tag:hover) {
		background: var(--of-accent-bg);
		border-radius: 6px;
	}
	:global(.swagger-ui .opblock-tag small) {
		color: var(--of-text-3);
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
	}
	:global(.swagger-ui .opblock-tag-section) {
		margin-bottom: 8px;
	}

	/* ── Operation blocks ────────────────────────────────────────────────── */
	:global(.swagger-ui .opblock) {
		border-radius: 8px !important;
		border: 1px solid var(--of-border) !important;
		background: var(--of-bg-surface) !important;
		box-shadow: none !important;
		margin-bottom: 6px;
	}
	:global(.swagger-ui .opblock.opblock-get) {
		border-color: var(--of-accent-border) !important;
		background: var(--of-accent-bg) !important;
	}
	:global(.swagger-ui .opblock.opblock-get .opblock-summary) {
		border-color: var(--of-accent-border);
	}
	:global(.swagger-ui .opblock.opblock-get .opblock-summary-method) {
		background: var(--of-accent) !important;
		color: var(--of-ink) !important;
		font-weight: 700;
		border-radius: 5px;
		min-width: 54px;
	}
	:global(.swagger-ui .opblock-summary) {
		padding: 10px 16px;
	}
	:global(.swagger-ui .opblock-summary-path),
	:global(.swagger-ui .opblock-summary-path__deprecated) {
		color: var(--of-text) !important;
		font-family: 'JetBrains Mono', monospace !important;
		font-size: 14px;
	}
	:global(.swagger-ui .opblock-summary-description) {
		color: var(--of-text-3) !important;
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
		background: var(--of-bg-overlay) !important;
		border-bottom: 1px solid var(--of-border);
		padding: 8px 16px;
	}
	:global(.swagger-ui .opblock-section-header h4) {
		color: var(--of-text-2) !important;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	:global(.swagger-ui .opblock-section-header label) {
		color: var(--of-text-2);
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
		color: var(--of-text-3) !important;
		border-bottom: 1px solid var(--of-border);
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px 10px;
		background: transparent;
	}
	:global(.swagger-ui table tbody tr td) {
		color: var(--of-text);
		border-bottom: 1px solid var(--of-border-subtle);
		padding: 8px 10px;
		vertical-align: top;
		background: transparent;
	}
	:global(.swagger-ui table tbody tr:last-child td) {
		border-bottom: none;
	}
	:global(.swagger-ui .parameter__name) {
		color: var(--of-text);
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	:global(.swagger-ui .parameter__name.required::after) {
		color: var(--of-warning-solid);
	}
	:global(.swagger-ui .parameter__type) {
		color: var(--of-accent);
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .parameter__in) {
		color: var(--of-text-3);
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .parameter__deprecated) {
		color: var(--of-warning-solid);
	}
	:global(.swagger-ui .markdown p) {
		color: var(--of-text-2);
		font-size: 13px;
	}

	/* ── Try it out ──────────────────────────────────────────────────────── */
	:global(.swagger-ui .try-out) {
		padding: 0;
	}
	:global(.swagger-ui .try-out__btn) {
		background: transparent;
		border: 1.5px solid rgba(34, 211, 238, 0.4);
		color: var(--of-accent);
		border-radius: 6px;
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 600;
		transition: background 0.15s;
	}
	:global(.swagger-ui .try-out__btn:hover) {
		background: var(--of-accent-bg);
	}
	:global(.swagger-ui .try-out__btn.cancel) {
		border-color: var(--of-border-strong);
		color: var(--of-text-2);
	}
	:global(.swagger-ui input[type='text']),
	:global(.swagger-ui input[type='password']),
	:global(.swagger-ui textarea.curl) {
		background: var(--of-bg-elevated) !important;
		border: 1px solid var(--of-border) !important;
		color: var(--of-text) !important;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		padding: 7px 10px;
	}
	:global(.swagger-ui input:focus),
	:global(.swagger-ui textarea:focus) {
		border-color: var(--of-accent-solid) !important;
		outline: none !important;
		box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15) !important;
	}
	:global(.swagger-ui .btn.execute) {
		background: var(--of-accent);
		color: var(--of-ink);
		border: none;
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
		font-weight: 700;
	}
	:global(.swagger-ui .btn.execute:hover) {
		background: var(--of-accent-solid);
	}
	:global(.swagger-ui .btn.cancel) {
		background: transparent;
		border: 1px solid var(--of-border);
		color: var(--of-text-2);
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .execute-wrapper) {
		padding: 12px 16px;
		border-top: 1px solid var(--of-border);
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
		color: var(--of-text);
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 600;
	}
	:global(.swagger-ui .response-col_description) {
		color: var(--of-text-2);
		font-size: 13px;
	}
	:global(.swagger-ui .response-col_links) {
		color: var(--of-text-3);
	}
	:global(.swagger-ui .live-responses-table .response-col_status) {
		color: var(--of-accent);
	}

	/* code / curl output */
	:global(.swagger-ui .microlight) {
		background: var(--of-bg-base) !important;
		color: var(--of-text) !important;
		border-radius: 6px;
		padding: 12px 14px;
		font-family: 'JetBrains Mono', monospace !important;
		font-size: 13px;
		line-height: 1.6;
	}
	:global(.swagger-ui .highlight-code) {
		background: var(--of-bg-base);
		border-radius: 6px;
	}
	:global(.swagger-ui .response-control-media-type__accept-message) {
		color: var(--of-text-3);
		font-size: 12px;
	}
	:global(.swagger-ui .curl-command) {
		background: var(--of-bg-base);
		border-radius: 6px;
		padding: 0;
	}
	:global(.swagger-ui .copy-to-clipboard) {
		background: var(--of-bg-elevated);
		border-left: 1px solid var(--of-border);
		border-radius: 0 6px 0 0;
	}
	:global(.swagger-ui .copy-to-clipboard button) {
		background: none;
		color: var(--of-text-2);
	}
	:global(.swagger-ui .copy-to-clipboard button:hover) {
		color: var(--of-accent);
	}

	/* ── Models / Schemas ────────────────────────────────────────────────── */
	:global(.swagger-ui section.models) {
		border: 1px solid var(--of-border);
		border-radius: 10px;
		background: var(--of-bg-surface);
		margin-top: 24px;
	}
	:global(.swagger-ui section.models h4) {
		color: var(--of-text) !important;
		font-family: 'Carter One', sans-serif;
		font-size: 18px;
		padding: 12px 16px;
		margin: 0;
	}
	:global(.swagger-ui section.models.is-open h4) {
		border-bottom: 1px solid var(--of-border);
	}
	:global(.swagger-ui section.models .models-control) {
		fill: var(--of-text-3);
	}
	:global(.swagger-ui .model-container) {
		background: var(--of-bg-overlay);
		border-radius: 6px;
		margin: 8px 16px;
		border: 1px solid var(--of-border);
	}
	:global(.swagger-ui .model-container:last-of-type) {
		margin-bottom: 16px;
	}
	:global(.swagger-ui .model-title__text) {
		color: var(--of-text);
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
	}
	:global(.swagger-ui .model-toggle) {
		fill: var(--of-text-3);
	}
	:global(.swagger-ui .model) {
		color: var(--of-text);
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	:global(.swagger-ui .prop-type) {
		color: var(--of-accent);
	}
	:global(.swagger-ui .prop-format) {
		color: var(--of-text-3);
	}
	:global(.swagger-ui .prop.primitive) {
		color: var(--of-text);
	}
	:global(.swagger-ui span.model .prop-name) {
		color: var(--of-text);
	}
	:global(.swagger-ui .model span[style*='font-weight:bold']) {
		color: var(--of-text-2) !important;
	}
	:global(.swagger-ui .model-box) {
		background: var(--of-bg-base);
		border-radius: 4px;
		padding: 8px;
	}

	/* ── Authorize modal ─────────────────────────────────────────────────── */
	:global(.swagger-ui .dialog-ux .backdrop-ux) {
		background: rgba(3, 10, 18, 0.7);
		backdrop-filter: blur(4px);
	}
	:global(.swagger-ui .dialog-ux .modal-ux) {
		background: var(--of-bg-surface);
		border: 1px solid var(--of-border);
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header) {
		background: var(--of-bg-elevated);
		border-bottom: 1px solid var(--of-border);
		border-radius: 12px 12px 0 0;
		padding: 16px 20px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header h3) {
		color: var(--of-text);
		font-family: 'Carter One', sans-serif;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header .close-modal) {
		background: none;
		border: none;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-header .close-modal svg) {
		fill: var(--of-text-3);
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content) {
		background: var(--of-bg-surface);
		border-radius: 0 0 12px 12px;
		padding: 20px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content p) {
		color: var(--of-text-2);
		font-size: 13px;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content label) {
		color: var(--of-text-2);
		font-size: 13px;
		font-weight: 600;
	}
	:global(.swagger-ui .dialog-ux .modal-ux-content code) {
		background: var(--of-bg-elevated);
		color: var(--of-accent);
		border-radius: 4px;
		padding: 1px 5px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
	}
	:global(.swagger-ui .auth-container) {
		border-bottom: 1px solid var(--of-border);
		padding-bottom: 16px;
		margin-bottom: 16px;
	}
	:global(.swagger-ui .auth-container:last-of-type) {
		border-bottom: none;
	}
	:global(.swagger-ui .auth-container h4) {
		color: var(--of-text);
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .auth-container .scopes h2) {
		color: var(--of-text-2);
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
	}
	:global(.swagger-ui .authorize__btn) {
		color: var(--of-accent);
	}

	/* ── SVG icons / arrows ──────────────────────────────────────────────── */
	:global(.swagger-ui .arrow) {
		fill: var(--of-text-3);
	}
	:global(.swagger-ui svg.arrow) {
		fill: var(--of-text-3);
	}
	:global(.swagger-ui .expand-methods svg),
	:global(.swagger-ui .expand-operation svg) {
		fill: var(--of-text-3);
	}

	/* ── Misc ────────────────────────────────────────────────────────────── */
	:global(.swagger-ui .loading-container) {
		background: var(--of-bg-surface);
	}
	:global(.swagger-ui .loading-container .loading::after) {
		color: var(--of-text-2);
	}
	:global(.swagger-ui select) {
		background: var(--of-bg-elevated);
		border: 1px solid var(--of-border);
		color: var(--of-text);
		border-radius: 8px;
		font-family: 'DM Sans', sans-serif;
	}
	:global(.swagger-ui .response-control-media-type--accept-controller select),
	:global(.swagger-ui .content-type select) {
		background: var(--of-bg-elevated);
		border: 1px solid var(--of-border);
		color: var(--of-text);
		border-radius: 6px;
		font-size: 13px;
		padding: 5px 10px;
	}
	:global(.swagger-ui .errors-wrapper) {
		background: var(--of-danger-bg);
		border: 1px solid var(--of-danger-border);
		border-radius: 8px;
		padding: 12px;
	}
	:global(.swagger-ui .errors-wrapper .errors h4) {
		color: var(--of-danger);
	}

	/* scrollbar */
	:global(.swagger-ui *::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	:global(.swagger-ui *::-webkit-scrollbar-track) {
		background: var(--of-bg-surface);
	}
	:global(.swagger-ui *::-webkit-scrollbar-thumb) {
		background: var(--of-border);
		border-radius: 3px;
	}
	:global(.swagger-ui *::-webkit-scrollbar-thumb:hover) {
		background: var(--of-text-4);
	}
</style>
