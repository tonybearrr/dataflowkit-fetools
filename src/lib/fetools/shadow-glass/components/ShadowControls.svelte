<script lang="ts">
	import { Plus, X, RotateCcw } from 'lucide-svelte';
	import type { ShadowState, ShadowLayer } from '../types';
	import ColorPicker from '../../gradient/components/ColorPicker.svelte';
	import { locale, tStringReactive } from '$lib/i18n';

	interface Props {
		state: ShadowState;
		onUpdate: (updates: Partial<ShadowState>) => void;
		onLayerUpdate: (layerId: string, updates: Partial<ShadowLayer>) => void;
		onAddLayer: () => void;
		onRemoveLayer: (layerId: string) => void;
		onReset: () => void;
	}

	// @ts-expect-error - Svelte 5 runes $props type inference issue
	let props = $props<Props>();

	let colorPickerOpen = $state(null as string | null);

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function handleAngleModeChange(angle?: number, distance?: number) {
		if (!props.state.useAngleMode) return;
		
		const currentAngle = angle ?? props.state.angle;
		const currentDistance = distance ?? props.state.distance;
		
		// Calculate x, y from angle and distance
		const angleRad = (currentAngle * Math.PI) / 180;
		const x = Math.round(Math.sin(angleRad) * currentDistance);
		const y = Math.round(-Math.cos(angleRad) * currentDistance);
		
		props.state.layers.forEach((layer: ShadowLayer) => {
			props.onLayerUpdate(layer.id, { x, y });
		});
	}

	function applyPreset(preset: 'subtle' | 'medium' | 'strong' | 'neon') {
		props.onUpdate({ preset });
		// Preset will be applied in parent component
	}
</script>

<div class="controls-panel">
	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.shadowType', $locale)}</label>
		<div class="segmented-control">
			<button
				class="segment"
				class:active={props.state.type === 'box-shadow'}
				onclick={() => props.onUpdate({ type: 'box-shadow' })}
			>
				Box Shadow
			</button>
			<button
				class="segment"
				class:active={props.state.type === 'drop-shadow'}
				onclick={() => props.onUpdate({ type: 'drop-shadow' })}
			>
				Drop Shadow
			</button>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">{tStringReactive('shadowGlassGenerator.presets', $locale)}</label>
		<div class="preset-buttons">
			<button class="preset-btn" onclick={() => applyPreset('subtle')}>Subtle</button>
			<button class="preset-btn" onclick={() => applyPreset('medium')}>Medium</button>
			<button class="preset-btn" onclick={() => applyPreset('strong')}>Strong</button>
			<button class="preset-btn" onclick={() => applyPreset('neon')}>Neon</button>
		</div>
	</div>

	<div class="control-group">
		<label class="control-label">
					<input
						type="checkbox"
						checked={props.state.useAngleMode}
						onchange={(e) => {
							const checked = (e.target as HTMLInputElement).checked;
							props.onUpdate({ useAngleMode: checked });
							if (checked) {
								handleAngleModeChange();
							}
						}}
					/>
			Angle + Distance Mode
		</label>
		{#if props.state.useAngleMode}
			<div class="control-row">
				<div class="control-item">
					<label>Angle</label>
					<input
						type="range"
						min="0"
						max="360"
						value={props.state.angle}
						oninput={(e) => {
							const newAngle = Number((e.target as HTMLInputElement).value);
							props.onUpdate({ angle: newAngle });
							if (props.state.useAngleMode) {
								handleAngleModeChange(newAngle, props.state.distance);
							}
						}}
					/>
					<input
						type="number"
						value={props.state.angle}
						oninput={(e) => {
							const newAngle = Number((e.target as HTMLInputElement).value);
							props.onUpdate({ angle: newAngle });
							if (props.state.useAngleMode) {
								handleAngleModeChange(newAngle, props.state.distance);
							}
						}}
						class="number-input"
					/>
				</div>
				<div class="control-item">
					<label>Distance</label>
					<input
						type="range"
						min="0"
						max="50"
						value={props.state.distance}
						oninput={(e) => {
							const newDistance = Number((e.target as HTMLInputElement).value);
							props.onUpdate({ distance: newDistance });
							if (props.state.useAngleMode) {
								handleAngleModeChange(props.state.angle, newDistance);
							}
						}}
					/>
					<input
						type="number"
						value={props.state.distance}
						oninput={(e) => {
							const newDistance = Number((e.target as HTMLInputElement).value);
							props.onUpdate({ distance: newDistance });
							if (props.state.useAngleMode) {
								handleAngleModeChange(props.state.angle, newDistance);
							}
						}}
						class="number-input"
					/>
				</div>
			</div>
		{/if}
	</div>

	<div class="control-group">
		<div class="control-header">
			<label class="control-label">{tStringReactive('shadowGlassGenerator.layers', $locale)} ({props.state.layers.length}/5)</label>
			{#if props.state.layers.length < 5}
				<button class="icon-btn" onclick={props.onAddLayer} title="Add Layer">
					<Plus class="w-4 h-4" />
				</button>
			{/if}
		</div>

		{#each props.state.layers as layer, i}
			<div class="layer-card">
				<div class="layer-header">
					<span class="layer-number">Layer {i + 1}</span>
					{#if props.state.layers.length > 1}
						<button
							class="icon-btn small"
							onclick={() => props.onRemoveLayer(layer.id)}
							title="Remove Layer"
						>
							<X class="w-3 h-3" />
						</button>
					{/if}
				</div>

				{#if !props.state.useAngleMode}
					<div class="control-row">
						<div class="control-item">
							<label>X</label>
							<input
								type="range"
								min="-50"
								max="50"
								value={layer.x}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { x: Number((e.target as HTMLInputElement).value) })}
							/>
							<input
								type="number"
								value={layer.x}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { x: Number((e.target as HTMLInputElement).value) })}
								class="number-input"
							/>
						</div>
						<div class="control-item">
							<label>Y</label>
							<input
								type="range"
								min="-50"
								max="50"
								value={layer.y}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { y: Number((e.target as HTMLInputElement).value) })}
							/>
							<input
								type="number"
								value={layer.y}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { y: Number((e.target as HTMLInputElement).value) })}
								class="number-input"
							/>
						</div>
					</div>
				{/if}

				<div class="control-row">
					<div class="control-item">
						<label>Blur</label>
						<input
							type="range"
							min="0"
							max="50"
							value={layer.blur}
							oninput={(e) =>
								props.onLayerUpdate(layer.id, { blur: Number((e.target as HTMLInputElement).value) })}
						/>
						<input
							type="number"
							value={layer.blur}
							oninput={(e) =>
								props.onLayerUpdate(layer.id, { blur: Number((e.target as HTMLInputElement).value) })}
							class="number-input"
						/>
					</div>
					{#if props.state.type === 'box-shadow'}
						<div class="control-item">
							<label>Spread</label>
							<input
								type="range"
								min="-20"
								max="20"
								value={layer.spread}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { spread: Number((e.target as HTMLInputElement).value) })}
							/>
							<input
								type="number"
								value={layer.spread}
								oninput={(e) =>
									props.onLayerUpdate(layer.id, { spread: Number((e.target as HTMLInputElement).value) })}
								class="number-input"
							/>
						</div>
					{/if}
				</div>

				<div class="control-row">
					<div class="control-item">
						<label>Opacity</label>
						<input
							type="range"
							min="0"
							max="100"
							value={layer.opacity}
							oninput={(e) =>
								props.onLayerUpdate(layer.id, { opacity: Number((e.target as HTMLInputElement).value) })}
						/>
						<input
							type="number"
							value={layer.opacity}
							oninput={(e) =>
								props.onLayerUpdate(layer.id, { opacity: Number((e.target as HTMLInputElement).value) })}
							class="number-input"
						/>
					</div>
					<div class="control-item">
						<label>Color</label>
						<div class="color-picker-wrapper">
							<button
								class="color-btn"
								style="background-color: {layer.color};"
								onclick={() => colorPickerOpen = colorPickerOpen === layer.id ? null : layer.id}
							></button>
							{#if colorPickerOpen === layer.id}
								<div
									class="color-picker-container"
									onclick={(e) => e.stopPropagation()}
								>
								<ColorPicker
									color={layer.color}
									show={true}
									onchange={(color) => {
											props.onLayerUpdate(layer.id, { color });
									}}
								/>
								</div>
							{/if}
						</div>
					</div>
				</div>

				{#if props.state.type === 'box-shadow'}
					<div class="control-row">
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={layer.inset}
								onchange={(e) =>
									props.onLayerUpdate(layer.id, { inset: (e.target as HTMLInputElement).checked })}
							/>
							Inset
						</label>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="control-group">
		<button class="reset-btn" onclick={props.onReset}>
			<RotateCcw class="w-4 h-4" />
			{tStringReactive('shadowGlassGenerator.reset', $locale)}
		</button>
	</div>
</div>

<!-- Click outside to close color picker -->
{#if colorPickerOpen}
	<div
		class="color-picker-overlay"
		onclick={() => colorPickerOpen = null}
		ontouchstart={() => colorPickerOpen = null}
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

	.segmented-control {
		display: flex;
		gap: 0.5rem;
		background: var(--color-bg-secondary);
		border-radius: 8px;
		padding: 4px;
	}

	.segment {
		flex: 1;
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		transition: all 0.2s;
	}

	.segment.active {
		background: var(--color-bg);
		color: var(--color-text);
		font-weight: 500;
	}

	.preset-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.preset-btn {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.preset-btn:hover {
		border-color: var(--color-accent);
		background: var(--color-bg);
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

	.control-item input[type="range"] {
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

	.layer-card {
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.layer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.layer-number {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.icon-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--color-text-muted);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.icon-btn:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		width: 40px;
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

	.reset-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-accent);
	}

	.color-picker-overlay {
		position: fixed;
		inset: 0;
		z-index: 999;
	}
</style>

