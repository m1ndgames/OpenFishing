<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type Cropper from 'cropperjs';
	import type { CropperCanvas, CropperImage, CropperSelection } from 'cropperjs';

	interface Props {
		src: string;
		onConfirm: (blob: Blob) => void;
		onCancel: () => void;
	}
	let { src, onConfirm, onCancel }: Props = $props();

	const ASPECT = 4 / 3;
	const MAX_WIDTH = 1920; // with the fixed 4:3 ratio this also caps the height at 1440
	const COVERAGE = 0.95; // initial selection size, relative to the photo

	// cropperjs 2 is built from custom elements configured via markup
	const RESIZE = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']
		.map((d) => `<cropper-handle action="${d}-resize" theme-color="var(--of-accent)"></cropper-handle>`)
		.join('');
	const TEMPLATE = `<cropper-canvas theme-color="var(--of-accent)">
		<cropper-image rotatable scalable translatable></cropper-image>
		<cropper-shade theme-color="rgba(3, 10, 18, 0.7)"></cropper-shade>
		<cropper-handle action="move" plain></cropper-handle>
		<cropper-selection aspect-ratio="${ASPECT}" movable resizable>
			<cropper-grid role="grid" bordered covered></cropper-grid>
			<cropper-crosshair centered></cropper-crosshair>
			<cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
			${RESIZE}
		</cropper-selection>
	</cropper-canvas>`;

	let imgEl: HTMLImageElement;
	let cropper: Cropper | null = null;
	let canvasEl: CropperCanvas | null = null;
	let imageEl: CropperImage | null = null;
	let selectionEl: CropperSelection | null = null;
	let ready = $state(false);
	// Set while we reposition things ourselves (initial fit, rotation) so the guards don't block it
	let adjusting = true;

	type Rect = { x: number; y: number; width: number; height: number };

	/** The photo's on-screen bounds, relative to the cropper canvas. */
	function imageBounds(): Rect | null {
		if (!canvasEl || !imageEl) return null;
		const c = canvasEl.getBoundingClientRect();
		const i = imageEl.getBoundingClientRect();
		return { x: i.left - c.left, y: i.top - c.top, width: i.width, height: i.height };
	}

	function inside(s: Rect, b: Rect): boolean {
		const eps = 0.5; // tolerate sub-pixel rounding
		return s.x >= b.x - eps && s.y >= b.y - eps
			&& s.x + s.width <= b.x + b.width + eps && s.y + s.height <= b.y + b.height + eps;
	}

	/** Largest 4:3 box (× COVERAGE) centered on the photo — v1's autoCropArea. */
	function fitSelection() {
		const b = imageBounds();
		if (!b || !selectionEl) return;
		let width = b.width * COVERAGE;
		let height = width / ASPECT;
		if (height > b.height * COVERAGE) {
			height = b.height * COVERAGE;
			width = height * ASPECT;
		}
		selectionEl.$change(b.x + (b.width - width) / 2, b.y + (b.height - height) / 2, width, height);
	}

	onMount(async () => {
		// cropperjs defines its custom elements (extending HTMLElement) at import time,
		// so it can only be loaded in the browser — never during SSR.
		const { default: CropperClass } = await import('cropperjs');
		cropper = new CropperClass(imgEl, { template: TEMPLATE });
		canvasEl = cropper.getCropperCanvas();
		imageEl = cropper.getCropperImage();
		selectionEl = cropper.getCropperSelection();
		if (!imageEl || !selectionEl) return;

		// Keep the crop box on the photo (v1's viewMode: 1) — otherwise the export gets black
		// bars. Both events are cancelable and carry the proposed new rect (canvas-relative).
		selectionEl.addEventListener('change', (e) => {
			const b = imageBounds();
			if (!adjusting && b && !inside((e as CustomEvent<Rect>).detail, b)) e.preventDefault();
		});
		imageEl.addEventListener('change', (e) => {
			if (adjusting || !selectionEl) return;
			const { x, y, width, height } = selectionEl;
			if (!inside({ x, y, width, height }, (e as CustomEvent<Rect>).detail)) e.preventDefault();
		});

		await imageEl.$ready();
		requestAnimationFrame(() => {
			fitSelection();
			adjusting = false;
			ready = true;
		});
	});

	onDestroy(() => {
		cropper?.destroy();
	});

	function rotate(deg: number) {
		if (!imageEl || !ready) return;
		adjusting = true;
		imageEl.$rotate(`${deg}deg`);
		imageEl.$center('contain');
		fitSelection();
		adjusting = false;
	}
	function rotateCCW() { rotate(-90); }
	function rotateCW() { rotate(90); }

	async function confirm() {
		if (!ready || !imageEl || !selectionEl) return;
		// $toCanvas() defaults to the on-screen selection size; ask for the photo's real
		// resolution instead (the image transform maps natural px → canvas px).
		const [a, b] = imageEl.$getTransform();
		const scale = Math.hypot(a, b) || 1;
		const width = Math.min(MAX_WIDTH, Math.round(selectionEl.width / scale));
		const canvas = await selectionEl.$toCanvas({ width });
		canvas.toBlob((blob) => {
			if (blob) onConfirm(blob);
		}, 'image/jpeg', 0.92);
	}
</script>

<!-- Overlay -->
<div
	style="position:fixed; inset:0; z-index:100; background:rgba(3,10,18,0.92); display:flex; align-items:center; justify-content:center; padding:16px;"
	onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
>
	<div style="background:var(--of-bg-surface); border:1px solid var(--of-border-subtle); border-radius:16px; width:100%; max-width:600px; overflow:hidden; display:flex; flex-direction:column;">

		<!-- Header -->
		<div style="padding:14px 18px; border-bottom:1px solid var(--of-border-subtle); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
			<span style="font-family:'Carter One',sans-serif; font-size:1.05rem; color:var(--of-text-bright);">Crop Photo</span>
			<div style="display:flex; gap:6px;">
				<button onclick={rotateCCW} title="Rotate left"
					style="width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:8px; color:var(--of-text-2); cursor:pointer; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-2)';(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<path d="M3.5 7.5a4 4 0 1 0 1.2-2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
						<path d="M3.5 10.5v-3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<button onclick={rotateCW} title="Rotate right"
					style="width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:var(--of-bg-elevated); border:1px solid var(--of-border); border-radius:8px; color:var(--of-text-2); cursor:pointer; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-accent)';(e.currentTarget as HTMLElement).style.borderColor='var(--of-accent-border)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='var(--of-text-2)';(e.currentTarget as HTMLElement).style.borderColor='var(--of-border)';}}
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<path d="M11.5 7.5a4 4 0 1 0-1.2-2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
						<path d="M11.5 10.5v-3h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Cropper area (cropperjs hides the <img> and inserts its <cropper-canvas> after it) -->
		<div class="crop-area" style="background:var(--of-bg-base); overflow:hidden;">
			<img bind:this={imgEl} {src} alt="Crop" style="display:block; max-width:100%;" />
		</div>

		<!-- Footer -->
		<div style="padding:12px 18px; border-top:1px solid var(--of-border-subtle); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
			<span style="font-size:0.75rem; color:var(--of-text-4);">Drag to reposition · Scroll to zoom · Drag corners to resize</span>
			<div style="display:flex; gap:8px;">
				<button onclick={onCancel}
					style="padding:8px 18px; background:var(--of-bg-elevated); color:var(--of-text-2); font-size:0.875rem; font-weight:500; border:1px solid var(--of-border); border-radius:9px; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-hover)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-bg-elevated)';}}
				>
					Cancel
				</button>
				<button onclick={confirm} disabled={!ready}
					style="padding:8px 18px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; border:none; border-radius:9px; cursor:{ready ? 'pointer' : 'wait'}; opacity:{ready ? 1 : 0.6}; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='var(--of-accent-solid)';}}
				>
					Apply
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* cropperjs 2 renders into shadow DOM — colors are set via theme-color in the template.
	   The canvas has no intrinsic height, so give it one that fits the modal. */
	.crop-area :global(cropper-canvas) {
		height: min(60vh, 450px);
	}
</style>
