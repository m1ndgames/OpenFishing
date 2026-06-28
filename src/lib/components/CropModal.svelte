<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Cropper from 'cropperjs';
	import 'cropperjs/dist/cropper.css';

	interface Props {
		src: string;
		onConfirm: (blob: Blob) => void;
		onCancel: () => void;
	}
	let { src, onConfirm, onCancel }: Props = $props();

	let imgEl: HTMLImageElement;
	let cropper: Cropper;

	onMount(() => {
		cropper = new Cropper(imgEl, {
			aspectRatio: 4 / 3,
			viewMode: 1,
			autoCropArea: 0.95,
			background: false,
			movable: true,
			zoomable: true,
			rotatable: true,
			scalable: false,
			guides: true,
			center: true,
			highlight: false,
			cropBoxMovable: true,
			cropBoxResizable: true,
			toggleDragModeOnDblclick: false,
		});
	});

	onDestroy(() => {
		cropper?.destroy();
	});

	function rotateCCW() { cropper.rotate(-90); }
	function rotateCW() { cropper.rotate(90); }

	function confirm() {
		const canvas = cropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1440, imageSmoothingQuality: 'high' });
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

		<!-- Cropper area -->
		<div style="background:var(--of-bg-base); max-height:70vh; overflow:hidden;">
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
				<button onclick={confirm}
					style="padding:8px 18px; background:var(--of-accent-solid); color:var(--of-ink); font-size:0.875rem; font-weight:700; border:none; border-radius:9px; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
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
	/* Dark-theme overrides for cropperjs */
	:global(.cropper-view-box) {
		outline-color: var(--of-accent);
	}
	:global(.cropper-point) {
		background-color: var(--of-accent);
	}
	:global(.cropper-line) {
		background-color: var(--of-accent);
	}
	:global(.cropper-dashed) {
		border-color: var(--of-accent-border);
	}
	:global(.cropper-center::before),
	:global(.cropper-center::after) {
		background-color: var(--of-accent);
	}
	:global(.cropper-face) {
		background-color: var(--of-accent-bg);
	}
	:global(.cropper-modal) {
		background-color: var(--of-ink);
		opacity: 0.7;
	}
</style>
