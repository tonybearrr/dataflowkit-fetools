<script lang="ts">
	interface Props {
		color?: string;
		show?: boolean;
		onchange?: (color: string) => void;
	}
	
	let { color = $bindable('#000000'), show = $bindable(false), onchange }: Props = $props();
	
	let hue = $state(0);
	let saturation = $state(100);
	let brightness = $state(100);
	let alpha = $state(1);
	
	let pickerArea: HTMLDivElement;
	let spectrumSlider: HTMLDivElement;
	let isDragging = $state(false);
	let isDraggingSpectrum = $state(false);
	
	// Parse hex to HSV
	function hexToHsv(hex: string): { h: number; s: number; v: number; a: number } {
		hex = hex.replace('#', '');
		if (hex.length === 3) {
			hex = hex.split('').map(c => c + c).join('');
		}
		const r = parseInt(hex.substring(0, 2), 16) / 255;
		const g = parseInt(hex.substring(2, 4), 16) / 255;
		const b = parseInt(hex.substring(4, 6), 16) / 255;
		const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
		
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const d = max - min;
		let h = 0;
		const s = max === 0 ? 0 : d / max;
		const v = max;
		
		if (max !== min) {
			switch (max) {
				case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
				case g: h = ((b - r) / d + 2) / 6; break;
				case b: h = ((r - g) / d + 4) / 6; break;
			}
		}
		
		return { h: h * 360, s: s * 100, v: v * 100, a };
	}
	
	// HSV to Hex
	function hsvToHex(h: number, s: number, v: number, a: number = 1): string {
		s /= 100;
		v /= 100;
		const c = v * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = v - c;
		let r = 0, g = 0, b = 0;
		
		if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
		else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
		else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
		else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
		else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
		else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
		
		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b = Math.round((b + m) * 255);
		
		const hex = [r, g, b].map(x => {
			const hex = x.toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		}).join('');
		
		if (a < 1) {
			const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
			return `#${hex}${alphaHex}`;
		}
		
		return `#${hex}`;
	}
	
	// Update HSV from color prop
	$effect(() => {
		if (color && color !== hsvToHex(hue, saturation, brightness, alpha)) {
			const hsv = hexToHsv(color);
			hue = hsv.h;
			saturation = hsv.s;
			brightness = hsv.v;
			alpha = hsv.a;
		}
	});
	
	// Update color from HSV
	function updateColor() {
		const newColor = hsvToHex(hue, saturation, brightness, alpha);
		if (newColor !== color) {
			color = newColor;
			onchange?.(newColor);
		}
	}
	
	$effect(() => {
		updateColor();
	});
	
	function handlePickerMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;
		updatePickerPosition(e);
	}
	
	function handlePickerMouseMove(e: MouseEvent) {
		if (isDragging) {
			e.preventDefault();
			updatePickerPosition(e);
		}
	}
	
	function handlePickerMouseUp() {
		isDragging = false;
	}
	
	// Global mouse events for dragging
	$effect(() => {
		if (isDragging) {
			const handleMove = (e: MouseEvent) => handlePickerMouseMove(e);
			const handleUp = () => handlePickerMouseUp();
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleUp);
			return () => {
				window.removeEventListener('mousemove', handleMove);
				window.removeEventListener('mouseup', handleUp);
			};
		}
	});
	
	$effect(() => {
		if (isDraggingSpectrum) {
			const handleMove = (e: MouseEvent) => handleSpectrumMouseMove(e);
			const handleUp = () => handleSpectrumMouseUp();
			window.addEventListener('mousemove', handleMove);
			window.addEventListener('mouseup', handleUp);
			return () => {
				window.removeEventListener('mousemove', handleMove);
				window.removeEventListener('mouseup', handleUp);
			};
		}
	});
	
	function updatePickerPosition(e: MouseEvent) {
		if (!pickerArea) return;
		const rect = pickerArea.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
		saturation = x * 100;
		brightness = (1 - y) * 100;
		updateColor();
	}
	
	function handleSpectrumMouseDown(e: MouseEvent) {
		e.preventDefault();
		isDraggingSpectrum = true;
		updateSpectrumPosition(e);
	}
	
	function handleSpectrumMouseMove(e: MouseEvent) {
		if (isDraggingSpectrum) {
			e.preventDefault();
			updateSpectrumPosition(e);
		}
	}
	
	function handleSpectrumMouseUp() {
		isDraggingSpectrum = false;
	}
	
	function updateSpectrumPosition(e: MouseEvent) {
		if (!spectrumSlider) return;
		const rect = spectrumSlider.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		hue = x * 360;
		updateColor();
	}
	
	function handleHexInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		if (/^#?[0-9A-Fa-f]{0,8}$/.test(value)) {
			const hex = value.startsWith('#') ? value : `#${value}`;
			if (hex.length === 4 || hex.length === 7 || hex.length === 9) {
				color = hex;
				onchange?.(hex);
			}
		}
	}
	
	function handleRgbInput(component: 'r' | 'g' | 'b', val: string) {
		const num = parseInt(val);
		if (!isNaN(num) && num >= 0 && num <= 255) {
			const hsv = hexToHsv(color);
			const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
			rgb[component === 'r' ? 0 : component === 'g' ? 1 : 2] = num;
			const newHsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
			hue = newHsv.h;
			saturation = newHsv.s;
			brightness = newHsv.v;
			updateColor();
		}
	}
	
	function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
		s /= 100;
		v /= 100;
		const c = v * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = v - c;
		let r = 0, g = 0, b = 0;
		
		if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
		else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
		else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
		else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
		else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
		else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
		
		return [
			Math.round((r + m) * 255),
			Math.round((g + m) * 255),
			Math.round((b + m) * 255)
		];
	}
	
	function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const d = max - min;
		let h = 0;
		const s = max === 0 ? 0 : d / max;
		const v = max;
		
		if (max !== min) {
			switch (max) {
				case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
				case g: h = ((b - r) / d + 2) / 6; break;
				case b: h = ((r - g) / d + 4) / 6; break;
			}
		}
		
		return { h: h * 360, s: s * 100, v: v * 100 };
	}
	
	const rgb = $derived(hsvToRgb(hue, saturation, brightness));
</script>

{#if show}
	<div class="color-picker">
		<div class="picker-container">
			<!-- Main Picker Area -->
			<div
				bind:this={pickerArea}
				class="picker-area"
				style="background: 
					linear-gradient(180deg, transparent, #000),
					linear-gradient(90deg, #fff, hsl({hue}, 100%, 50%));"
				onmousedown={handlePickerMouseDown}
			>
				<div
					class="picker-handle"
					style="left: {saturation}%; top: {100 - brightness}%;"
				></div>
			</div>
			
			<!-- Spectrum Slider -->
			<div
				bind:this={spectrumSlider}
				class="spectrum-slider"
				onmousedown={handleSpectrumMouseDown}
			>
				<div
					class="spectrum-handle"
					style="left: {hue / 360 * 100}%;"
				></div>
			</div>
			
			<!-- Color Value Inputs -->
			<div class="color-inputs">
				<div class="input-group hex-row">
					<label>Hex</label>
					<input
						type="text"
						value={color.toUpperCase()}
						oninput={handleHexInput}
						class="hex-input"
					/>
				</div>
				<div class="rgb-row">
					<div class="input-group">
						<label>R</label>
						<input
							type="number"
							min="0"
							max="255"
							value={rgb[0]}
							oninput={(e) => handleRgbInput('r', (e.target as HTMLInputElement).value)}
							class="rgb-input"
						/>
					</div>
					<div class="input-group">
						<label>G</label>
						<input
							type="number"
							min="0"
							max="255"
							value={rgb[1]}
							oninput={(e) => handleRgbInput('g', (e.target as HTMLInputElement).value)}
							class="rgb-input"
						/>
					</div>
					<div class="input-group">
						<label>B</label>
						<input
							type="number"
							min="0"
							max="255"
							value={rgb[2]}
							oninput={(e) => handleRgbInput('b', (e.target as HTMLInputElement).value)}
							class="rgb-input"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.color-picker {
		position: absolute;
		z-index: 1000;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 16px;
	}
	
	.picker-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.picker-area {
		position: relative;
		width: 200px;
		height: 200px;
		border-radius: 4px;
		cursor: crosshair;
		border: 1px solid var(--color-border);
	}
	
	.picker-handle {
		position: absolute;
		width: 12px;
		height: 12px;
		border: 2px solid white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
		pointer-events: none;
	}
	
	.spectrum-slider {
		position: relative;
		width: 200px;
		height: 20px;
		border-radius: 4px;
		background: linear-gradient(to right, 
			hsl(0, 100%, 50%), 
			hsl(60, 100%, 50%), 
			hsl(120, 100%, 50%), 
			hsl(180, 100%, 50%), 
			hsl(240, 100%, 50%), 
			hsl(300, 100%, 50%), 
			hsl(360, 100%, 50%)
		);
		cursor: pointer;
		border: 1px solid var(--color-border);
	}
	
	.spectrum-handle {
		position: absolute;
		width: 4px;
		height: 100%;
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.3);
		transform: translateX(-50%);
		pointer-events: none;
	}
	
	.color-inputs {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.hex-row {
		width: 100%;
	}
	
	.rgb-row {
		display: grid;
		grid-template-columns: repeat(3, 60px);
		gap: 8px;
	}
	
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.input-group label {
		font-size: 11px;
		color: var(--color-text-muted);
		text-transform: uppercase;
		font-weight: 500;
	}
	
	.hex-input,
	.rgb-input {
		width: 100%;
		padding: 4px 8px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 12px;
	}
	
	.hex-input {
		font-family: monospace;
	}
</style>

