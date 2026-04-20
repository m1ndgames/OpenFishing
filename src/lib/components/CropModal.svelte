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
			toggleDragModeOnDblClick: false,
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
	<div style="background:#0b1a2c; border:1px solid #172f4a; border-radius:16px; width:100%; max-width:600px; overflow:hidden; display:flex; flex-direction:column;">

		<!-- Header -->
		<div style="padding:14px 18px; border-bottom:1px solid #172f4a; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
			<span style="font-family:'Carter One',sans-serif; font-size:1.05rem; color:#e0eaf8;">Crop Photo</span>
			<div style="display:flex; gap:6px;">
				<button onclick={rotateCCW} title="Rotate left"
					style="width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:#0f2238; border:1px solid #243f5e; border-radius:8px; color:#8ab8cc; cursor:pointer; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#8ab8cc';(e.currentTarget as HTMLElement).style.borderColor='#243f5e';}}
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<path d="M3.5 7.5a4 4 0 1 0 1.2-2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
						<path d="M3.5 10.5v-3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<button onclick={rotateCW} title="Rotate right"
					style="width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:#0f2238; border:1px solid #243f5e; border-radius:8px; color:#8ab8cc; cursor:pointer; transition:all 0.15s;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.color='#22d3ee';(e.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.4)';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.color='#8ab8cc';(e.currentTarget as HTMLElement).style.borderColor='#243f5e';}}
				>
					<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
						<path d="M11.5 7.5a4 4 0 1 0-1.2-2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
						<path d="M11.5 10.5v-3h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Cropper area -->
		<div style="background:#060d17; max-height:70vh; overflow:hidden;">
			<img bind:this={imgEl} {src} alt="Crop" style="display:block; max-width:100%;" />
		</div>

		<!-- Footer -->
		<div style="padding:12px 18px; border-top:1px solid #172f4a; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
			<span style="font-size:0.75rem; color:#3d6a84;">Drag to reposition · Scroll to zoom · Drag corners to resize</span>
			<div style="display:flex; gap:8px;">
				<button onclick={onCancel}
					style="padding:8px 18px; background:#0f2238; color:#8ab8cc; font-size:0.875rem; font-weight:500; border:1px solid #243f5e; border-radius:9px; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#132841';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#0f2238';}}
				>
					Cancel
				</button>
				<button onclick={confirm}
					style="padding:8px 18px; background:#06b6d4; color:#030a12; font-size:0.875rem; font-weight:700; border:none; border-radius:9px; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;"
					onmouseenter={function(e){(e.currentTarget as HTMLElement).style.background='#22d3ee';}}
					onmouseleave={function(e){(e.currentTarget as HTMLElement).style.background='#06b6d4';}}
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
		outline-color: #22d3ee;
	}
	:global(.cropper-point) {
		background-color: #22d3ee;
	}
	:global(.cropper-line) {
		background-color: #22d3ee;
	}
	:global(.cropper-dashed) {
		border-color: rgba(34, 211, 238, 0.4);
	}
	:global(.cropper-center::before),
	:global(.cropper-center::after) {
		background-color: #22d3ee;
	}
	:global(.cropper-face) {
		background-color: rgba(34, 211, 238, 0.03);
	}
	:global(.cropper-modal) {
		background-color: #030a12;
		opacity: 0.7;
	}
</style>
