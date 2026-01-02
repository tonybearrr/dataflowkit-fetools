<script lang="ts">
	import type { ColorStop } from '../types';
	
	interface Props {
		stops: ColorStop[];
		selectedStopId: string | null;
		onStopClick: (stopId: string) => void;
		onStopDrag: (stopId: string, position: number) => void;
		onBarClick: (position: number) => void;
		onStopRemove: (stopId: string) => void;
	}
	
	let { 
		stops, 
		selectedStopId, 
		onStopClick, 
		onStopDrag, 
		onBarClick,
		onStopRemove 
	}: Props = $props();
	
	let barElement: HTMLDivElement;
	let draggingStopId: string | null = $state(null);
	let dragStartX = $state(0);
	let dragStartPosition = $state(0);
	
	function handleBarClick(e: MouseEvent) {
		if (!barElement || draggingStopId) return;
		const rect = barElement.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
		onBarClick(position);
	}
	
	function handleStopMouseDown(e: MouseEvent, stopId: string, currentPosition: number) {
		e.stopPropagation();
		draggingStopId = stopId;
		dragStartX = e.clientX;
		dragStartPosition = currentPosition;
	}
	
	function handleMouseMove(e: MouseEvent) {
		if (!draggingStopId || !barElement) return;
		const rect = barElement.getBoundingClientRect();
		const deltaX = e.clientX - dragStartX;
		const deltaPercent = (deltaX / rect.width) * 100;
		const newPosition = Math.max(0, Math.min(100, dragStartPosition + deltaPercent));
		onStopDrag(draggingStopId, newPosition);
	}
	
	function handleMouseUp() {
		draggingStopId = null;
	}
	
	$effect(() => {
		if (draggingStopId) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});
	
	// Sort stops for display
	const sortedStops = $derived([...stops].sort((a, b) => a.position - b.position));
	
	// Generate horizontal gradient string for bar (always 90deg)
	const barGradientString = $derived(() => {
		const stopsStr = sortedStops
			.map(stop => {
				const opacity = stop.opacity / 100;
				return opacity < 1 
					? `${stop.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} ${stop.position}%` 
					: `${stop.color} ${stop.position}%`;
			})
			.join(', ');
		return `linear-gradient(90deg, ${stopsStr})`;
	});
</script>

<div class="gradient-bar-container">
	<div
		bind:this={barElement}
		class="gradient-bar"
		style="background: {barGradientString()};"
		onclick={handleBarClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				const rect = barElement.getBoundingClientRect();
				const position = 50;
				onBarClick(position);
			}
		}}
	>
		{#each sortedStops as stop (stop.id)}
			<button
				type="button"
				class="gradient-stop {selectedStopId === stop.id ? 'selected' : ''}"
				style="left: {stop.position}%; color: {stop.color};"
				onmousedown={(e) => handleStopMouseDown(e, stop.id, stop.position)}
				onclick={(e) => {
					e.stopPropagation();
					onStopClick(stop.id);
				}}
				oncontextmenu={(e) => {
					if (stops.length > 2) {
						e.preventDefault();
						onStopRemove(stop.id);
					}
				}}
				title="Drag to move, right-click to remove"
			>
				<div class="stop-handle"></div>
			</button>
		{/each}
	</div>
</div>

<style>
	.gradient-bar-container {
		width: 100%;
		margin-bottom: 8px;
	}
	
	.gradient-bar {
		position: relative;
		width: 100%;
		height: 32px;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		cursor: crosshair;
		overflow: visible;
	}
	
	.gradient-stop {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		border: none;
		background: transparent;
		cursor: grab;
		padding: 0;
		z-index: 2;
	}
	
	.gradient-stop:active {
		cursor: grabbing;
	}
	
	.gradient-stop.selected {
		z-index: 3;
	}
	
	.stop-handle {
		width: 100%;
		height: 100%;
		border: 2px solid white;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s;
	}
	
	.gradient-stop:hover .stop-handle,
	.gradient-stop.selected .stop-handle {
		transform: scale(1.2);
	}
	
	.gradient-stop.selected .stop-handle {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px var(--color-accent), 0 2px 8px rgba(0, 0, 0, 0.3);
	}
</style>

