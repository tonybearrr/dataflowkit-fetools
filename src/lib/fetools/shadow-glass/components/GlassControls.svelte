<script lang="ts">
	import type { GlassState } from '../types';
	import ColorPicker from '../../gradient/components/ColorPicker.svelte';
	import { locale, tStringReactive } from '$lib/i18n';

	interface Props {
		state: GlassState;
		onUpdate: (updates: Partial<GlassState>) => void;
		onShadowUpdate: (updates: Partial<GlassState['shadow']>) => void;
	}

	// @ts-expect-error - Svelte 5 runes $props type inference issue
	let props = $props<Props>();

	let tintColorPickerOpen = $state(false);
	let borderColorPickerOpen = $state(false);
</script>

<div class="controls-panel">
	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.blurStrength', $locale)}</label>
		<div class="control-row">
			<input
				type="range"
				min="0"
				max="40"
				value={props.state.blur}
				oninput={(e) => props.onUpdate({ blur: Number((e.target as HTMLInputElement).value) })}
				class="slider"
			/>
			<input
				type="number"
				value={props.state.blur}
				oninput={(e) => props.onUpdate({ blur: Number((e.target as HTMLInputElement).value) })}
				class="number-input"
			/>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.glassTint', $locale)}</label>
		<div class="control-row">
			<div class="control-item">
				<label>Color</label>
				<div class="color-picker-wrapper">
					<button
						class="color-btn"
						style="background-color: {props.state.tintColor};"
						onclick={() => tintColorPickerOpen = !tintColorPickerOpen}
					></button>
					{#if tintColorPickerOpen}
						<div
							class="color-picker-container"
							onclick={(e) => e.stopPropagation()}
						>
						<ColorPicker
								color={props.state.tintColor}
							show={true}
							onchange={(color) => {
									props.onUpdate({ tintColor: color });
							}}
						/>
						</div>
					{/if}
				</div>
			</div>
			<div class="control-item">
				<label>Opacity</label>
				<input
					type="range"
					min="0"
					max="100"
					value={props.state.tintOpacity}
					oninput={(e) => props.onUpdate({ tintOpacity: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.tintOpacity}
					oninput={(e) => props.onUpdate({ tintOpacity: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.backgroundBrightness', $locale)}</label>
		<div class="control-row">
			<input
				type="range"
				min="0"
				max="100"
				value={props.state.backgroundBrightness}
				oninput={(e) => props.onUpdate({ backgroundBrightness: Number((e.target as HTMLInputElement).value) })}
				class="slider"
			/>
			<input
				type="number"
				value={props.state.backgroundBrightness}
				oninput={(e) => props.onUpdate({ backgroundBrightness: Number((e.target as HTMLInputElement).value) })}
				class="number-input"
			/>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.border', $locale)}</label>
		<div class="control-row">
			<div class="control-item">
				<label>Width</label>
				<input
					type="range"
					min="0"
					max="2"
					step="0.1"
					value={props.state.borderWidth}
					oninput={(e) => props.onUpdate({ borderWidth: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.borderWidth}
					step="0.1"
					oninput={(e) => props.onUpdate({ borderWidth: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
			<div class="control-item">
				<label>Color</label>
				<div class="color-picker-wrapper">
					<button
						class="color-btn"
						style="background-color: {props.state.borderColor};"
						onclick={() => borderColorPickerOpen = !borderColorPickerOpen}
					></button>
					{#if borderColorPickerOpen}
						<div
							class="color-picker-container"
							onclick={(e) => e.stopPropagation()}
						>
						<ColorPicker
								color={props.state.borderColor}
							show={true}
							onchange={(color) => {
									props.onUpdate({ borderColor: color });
							}}
						/>
						</div>
					{/if}
				</div>
			</div>
			<div class="control-item">
				<label>Opacity</label>
				<input
					type="range"
					min="0"
					max="100"
					value={props.state.borderOpacity}
					oninput={(e) => props.onUpdate({ borderOpacity: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.borderOpacity}
					oninput={(e) => props.onUpdate({ borderOpacity: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.shadow', $locale)}</label>
		<div class="control-row">
			<div class="control-item">
				<label>X</label>
				<input
					type="range"
					min="-20"
					max="20"
					value={props.state.shadow.x}
					oninput={(e) => props.onShadowUpdate({ x: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.shadow.x}
					oninput={(e) => props.onShadowUpdate({ x: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
			<div class="control-item">
				<label>Y</label>
				<input
					type="range"
					min="-20"
					max="20"
					value={props.state.shadow.y}
					oninput={(e) => props.onShadowUpdate({ y: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.shadow.y}
					oninput={(e) => props.onShadowUpdate({ y: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
		</div>
		<div class="control-row">
			<div class="control-item">
				<label>Blur</label>
				<input
					type="range"
					min="0"
					max="30"
					value={props.state.shadow.blur}
					oninput={(e) => props.onShadowUpdate({ blur: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.shadow.blur}
					oninput={(e) => props.onShadowUpdate({ blur: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
			<div class="control-item">
				<label>Opacity</label>
				<input
					type="range"
					min="0"
					max="100"
					value={props.state.shadow.opacity}
					oninput={(e) => props.onShadowUpdate({ opacity: Number((e.target as HTMLInputElement).value) })}
					class="slider"
				/>
				<input
					type="number"
					value={props.state.shadow.opacity}
					oninput={(e) => props.onShadowUpdate({ opacity: Number((e.target as HTMLInputElement).value) })}
					class="number-input"
				/>
			</div>
		</div>
	</div>

	<div class="control-group">
		<label class="checkbox-label">
			<input
				type="checkbox"
				checked={props.state.noiseEnabled}
				onchange={(e) => props.onUpdate({ noiseEnabled: (e.target as HTMLInputElement).checked })}
			/>
			Noise Overlay
		</label>
	</div>

	<div class="browser-support-note">
		<small>Browser support: backdrop-filter required (Chrome 76+, Safari 9+, Firefox 103+)</small>
	</div>
</div>

<!-- Click outside to close color picker -->
{#if tintColorPickerOpen || borderColorPickerOpen}
	<div
		class="color-picker-overlay"
		onclick={() => {
			tintColorPickerOpen = false;
			borderColorPickerOpen = false;
		}}
		ontouchstart={() => {
			tintColorPickerOpen = false;
			borderColorPickerOpen = false;
		}}
	></div>
{/if}

<style>
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.control-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.control-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.control-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-item label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.slider {
		width: 100%;
	}

	.number-input {
		width: 100%;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.color-picker-wrapper {
		position: relative;
	}

	.color-picker-container {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 1000;
	}

	.color-btn {
		width: 100%;
		height: 32px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text);
		cursor: pointer;
	}

	.browser-support-note {
		padding: 0.75rem;
		background: var(--color-bg-secondary);
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.browser-support-note small {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.color-picker-overlay {
		position: fixed;
		inset: 0;
		z-index: 999;
	}
</style>

