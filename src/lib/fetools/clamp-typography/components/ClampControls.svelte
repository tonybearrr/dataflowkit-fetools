<script lang="ts">
	import type { ClampTypographyState } from '../types';
	import { applyPreset } from '../cssBuilders/clamp';
	import { locale, tStringReactive } from '$lib/i18n';

	interface Props {
		state: ClampTypographyState;
		onUpdate: (updates: Partial<ClampTypographyState>) => void;
	}

	// @ts-expect-error - Svelte 5 runes $props type inference issue
	let props = $props<Props>();

	function handlePreset(preset: 'body' | 'small' | 'h1' | 'h2' | 'h3' | 'spacing') {
		const updates = applyPreset(preset, props.state.mode);
		props.onUpdate(updates);
	}


	function isValidNumberInput(value: string): boolean {
		if (value === '' || value === '-') return true;
		const pattern = /^-?\d*([,.]?\d*)?$/;
		return pattern.test(value);
	}

	function parseNumber(value: string): number | null {
		if (value === '' || value === '-') return null;
		const normalized = value.replace(',', '.');
		const parsed = Number(normalized);
		return isNaN(parsed) ? null : parsed;
	}

	// Normalize typography values: ensure min <= base <= max
	function normalizeTypography(min: number, max: number, base: number) {
		// Ensure min <= max
		if (min > max) {
			max = min;
		}
		base = Math.min(Math.max(base, min), max);
		return { min, max, base };
	}

	// Store last valid values for each input
	let lastValidValues = $state({
		viewportMin: props.state.viewport.min,
		viewportMax: props.state.viewport.max,
		typographyMin: props.state.typography.min,
		typographyMax: props.state.typography.max,
		typographyBase: props.state.typography.base
	});

	// Sync lastValidValues when state changes externally (e.g., presets)
	$effect(() => {
		lastValidValues.viewportMin = props.state.viewport.min;
		lastValidValues.viewportMax = props.state.viewport.max;
		lastValidValues.typographyMin = props.state.typography.min;
		lastValidValues.typographyMax = props.state.typography.max;
		lastValidValues.typographyBase = props.state.typography.base;
	});
</script>

<div class="controls-panel">
	<!-- Mode Toggle -->
	<div class="control-group">
		<label class="control-label">{tStringReactive('clampTypography.mode', $locale)}</label>
		<div class="segmented-control">
			<button
				class="segment"
				class:active={props.state.mode === 'typography'}
				onclick={() => props.onUpdate({ mode: 'typography' })}
			>
				{tStringReactive('clampTypography.typography', $locale)}
			</button>
			<button
				class="segment"
				class:active={props.state.mode === 'spacing'}
				onclick={() => props.onUpdate({ mode: 'spacing' })}
			>
				{tStringReactive('clampTypography.spacing', $locale)}
			</button>
		</div>
	</div>

	<!-- Scale Settings -->
	{#if props.state.mode === 'typography'}
		<div class="control-group">
			<label class="control-label">{tStringReactive('clampTypography.scaleSettings', $locale)}</label>
			
			<div class="control-group">
				<label class="control-label-small">{tStringReactive('clampTypography.scaleRatio', $locale)}</label>
				<select
					value={props.state.scaleRatio === 'custom' ? 'custom' : String(props.state.scaleRatio)}
					onchange={(e) => {
						const value = (e.target as HTMLSelectElement).value;
						if (value === 'custom') {
							props.onUpdate({ scaleRatio: 'custom' });
						} else {
							const numValue = Number(value) as 1.125 | 1.2 | 1.25 | 1.333 | 1.414;
							props.onUpdate({ scaleRatio: numValue, customRatio: numValue });
						}
					}}
					class="select-input"
				>
					<option value="1.125">1.125 (Minor third)</option>
					<option value="1.2">1.2</option>
					<option value="1.25">1.25</option>
					<option value="1.333">1.333 (Perfect fourth)</option>
					<option value="1.414">1.414 (Augmented fourth)</option>
					<option value="custom">Custom</option>
				</select>
			</div>

			{#if props.state.scaleRatio === 'custom'}
				<div class="control-item">
					<label>{tStringReactive('clampTypography.customRatio', $locale)}</label>
					<input
						type="number"
						min="1.05"
						max="2"
						step="0.001"
						value={props.state.customRatio}
						oninput={(e) => props.onUpdate({ customRatio: Number((e.target as HTMLInputElement).value) })}
						class="number-input"
					/>
				</div>
			{/if}

			<label class="checkbox-label">
				<input
					type="checkbox"
					checked={props.state.includeSmall}
					onchange={(e) => props.onUpdate({ includeSmall: (e.target as HTMLInputElement).checked })}
				/>
				{tStringReactive('clampTypography.includeSmall', $locale)}
			</label>

			<p class="help-text">{tStringReactive('clampTypography.scaleNote', $locale)}</p>
		</div>
	{/if}

	<!-- Presets (only for Typography mode) -->
	{#if props.state.mode === 'typography'}
		<div class="control-group">
			<label class="control-label">{tStringReactive('clampTypography.presets', $locale)}</label>
			<div class="preset-buttons">
				<button 
					class="preset-btn" 
					class:active={props.state.preset === 'body'}
					onclick={() => handlePreset('body')}
				>
					{tStringReactive('clampTypography.presetBody', $locale)}
				</button>
				<button 
					class="preset-btn" 
					class:active={props.state.preset === 'small'}
					onclick={() => handlePreset('small')}
				>
					{tStringReactive('clampTypography.presetSmall', $locale)}
				</button>
				<button 
					class="preset-btn" 
					class:active={props.state.preset === 'h1'}
					onclick={() => handlePreset('h1')}
				>
					{tStringReactive('clampTypography.presetH1', $locale)}
				</button>
				<button 
					class="preset-btn" 
					class:active={props.state.preset === 'h2'}
					onclick={() => handlePreset('h2')}
				>
					{tStringReactive('clampTypography.presetH2', $locale)}
				</button>
				<button 
					class="preset-btn" 
					class:active={props.state.preset === 'h3'}
					onclick={() => handlePreset('h3')}
				>
					{tStringReactive('clampTypography.presetH3', $locale)}
				</button>
			</div>
		</div>
	{/if}

	<!-- Viewport Range -->
	<div class="control-group">
		<label class="control-label">{tStringReactive('clampTypography.viewportRange', $locale)}</label>
		<div class="control-row">
			<div class="control-item">
				<label>{tStringReactive('clampTypography.minViewport', $locale)}</label>
				<input
					type="text"
					inputmode="decimal"
					value={props.state.viewport.min}
					oninput={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						
						// Validate input format
						if (!isValidNumberInput(inputValue)) {
							input.value = String(lastValidValues.viewportMin);
							return;
						}
						
						const newMin = parseNumber(inputValue);
						if (newMin === null) return; // Allow empty/minus while typing
						
						if (newMin < 0) {
							input.value = String(lastValidValues.viewportMin);
							return;
						}
						
						lastValidValues.viewportMin = newMin;
						const newMax = Math.max(newMin, props.state.viewport.max);
						props.onUpdate({ 
							viewport: { 
								min: newMin, 
								max: newMax 
							}, 
							preset: null 
						});
					}}
					onblur={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						const parsed = parseNumber(inputValue);
						if (parsed === null || parsed < 0) {
							input.value = String(lastValidValues.viewportMin);
						}
					}}
					class="number-input"
				/>
			</div>
			<div class="control-item">
				<label>{tStringReactive('clampTypography.maxViewport', $locale)}</label>
				<input
					type="text"
					inputmode="decimal"
					value={props.state.viewport.max}
					oninput={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						
						// Validate input format
						if (!isValidNumberInput(inputValue)) {
							input.value = String(lastValidValues.viewportMax);
							return;
						}
						
						const newMax = parseNumber(inputValue);
						if (newMax === null) return; // Allow empty/minus while typing
						
						if (newMax < 0) {
							input.value = String(lastValidValues.viewportMax);
							return;
						}
						
						lastValidValues.viewportMax = newMax;
						const newMin = Math.min(newMax, props.state.viewport.min);
						props.onUpdate({ 
							viewport: { 
								min: newMin, 
								max: newMax 
							}, 
							preset: null 
						});
					}}
					onblur={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						const parsed = parseNumber(inputValue);
						if (parsed === null || parsed < 0) {
							input.value = String(lastValidValues.viewportMax);
						}
					}}
					class="number-input"
				/>
			</div>
		</div>
	</div>

	<!-- Typography/Spacing Values -->
	<div class="control-group">
		<label class="control-label">
			{props.state.mode === 'typography' 
				? tStringReactive('clampTypography.bodyValues', $locale)
				: tStringReactive('clampTypography.spacingValues', $locale)}
		</label>
		<div class="control-row">
			<div class="control-item">
				<label>{tStringReactive('clampTypography.minSize', $locale)}</label>
				<input
					type="text"
					inputmode="decimal"
					value={props.state.typography.min}
					oninput={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						if (!isValidNumberInput(inputValue)) {
							input.value = String(lastValidValues.typographyMin);
							return;
						}
						
						const newMin = parseNumber(inputValue);
						if (newMin === null) return;
						
						if (newMin < 0) {
							input.value = String(lastValidValues.typographyMin);
							return;
						}
						
						lastValidValues.typographyMin = newMin;
						
						if (props.state.mode === 'spacing') {
							const newMax = Math.max(newMin, props.state.typography.max);
							props.onUpdate({
								typography: { ...props.state.typography, min: newMin, max: newMax },
								preset: null
							});
						} else {
							const normalized = normalizeTypography(newMin, props.state.typography.max, props.state.typography.base);
							props.onUpdate({
								typography: { ...props.state.typography, ...normalized },
								preset: null
							});
						}
					}}
					onblur={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						const parsed = parseNumber(inputValue);
						if (parsed === null || parsed < 0) {
							input.value = String(lastValidValues.typographyMin);
						}
					}}
					class="number-input"
				/>
			</div>
			<div class="control-item">
				<label>{tStringReactive('clampTypography.maxSize', $locale)}</label>
				<input
					type="text"
					inputmode="decimal"
					value={props.state.typography.max}
					oninput={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						
						if (!isValidNumberInput(inputValue)) {
							input.value = String(lastValidValues.typographyMax);
							return;
						}
						
						const newMax = parseNumber(inputValue);
						if (newMax === null) return;
						
						if (newMax < 0) {
							input.value = String(lastValidValues.typographyMax);
							return;
						}
						
						lastValidValues.typographyMax = newMax;
						
						if (props.state.mode === 'spacing') {
							const newMin = Math.min(newMax, props.state.typography.min);
							props.onUpdate({
								typography: { ...props.state.typography, min: newMin, max: newMax },
								preset: null
							});
						} else {
							const normalized = normalizeTypography(props.state.typography.min, newMax, props.state.typography.base);
							props.onUpdate({
								typography: { ...props.state.typography, ...normalized },
								preset: null
							});
						}
					}}
					onblur={(e) => {
						const input = e.target as HTMLInputElement;
						const inputValue = input.value;
						const parsed = parseNumber(inputValue);
						if (parsed === null || parsed < 0) {
							input.value = String(lastValidValues.typographyMax);
						}
					}}
					class="number-input"
				/>
			</div>
			{#if props.state.mode === 'typography'}
				<div class="control-item">
					<label>{tStringReactive('clampTypography.baseSize', $locale)}</label>
					<input
						type="text"
						inputmode="decimal"
						value={props.state.typography.base}
						oninput={(e) => {
							const input = e.target as HTMLInputElement;
							const inputValue = input.value;
							
							if (!isValidNumberInput(inputValue)) {
								input.value = String(lastValidValues.typographyBase);
								return;
							}
							
							const newBase = parseNumber(inputValue);
							if (newBase === null) return;
							
							if (newBase < 0) {
								input.value = String(lastValidValues.typographyBase);
								return;
							}
							
							lastValidValues.typographyBase = newBase;
							const normalized = normalizeTypography(props.state.typography.min, props.state.typography.max, newBase);
							props.onUpdate({
								typography: { ...props.state.typography, ...normalized },
								preset: null
							});
						}}
						onblur={(e) => {
							const input = e.target as HTMLInputElement;
							const inputValue = input.value;
							const parsed = parseNumber(inputValue);
							if (parsed === null || parsed < 0) {
								input.value = String(lastValidValues.typographyBase);
							}
						}}
						class="number-input"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Unit Toggle -->
	<div class="control-group">
		<label class="control-label">{tStringReactive('clampTypography.unitOutput', $locale)}</label>
		<div class="segmented-control">
			<button
				class="segment"
				class:active={props.state.unit === 'px'}
				onclick={() => props.onUpdate({ unit: 'px' })}
			>
				px
			</button>
			<button
				class="segment"
				class:active={props.state.unit === 'rem'}
				onclick={() => props.onUpdate({ unit: 'rem' })}
			>
				rem
			</button>
		</div>
	</div>

	<!-- Show Scale Table (only for typography mode) -->
	{#if props.state.mode === 'typography'}
		<div class="control-group">
			<label class="checkbox-label">
				<input
					type="checkbox"
					checked={props.state.showScaleTable}
					onchange={(e) => props.onUpdate({ showScaleTable: (e.target as HTMLInputElement).checked })}
				/>
				{tStringReactive('clampTypography.showScaleTable', $locale)}
			</label>
		</div>
	{/if}

	<!-- Spacing Apply To (only for spacing mode) -->
	{#if props.state.mode === 'spacing'}
		<div class="control-group">
			<label class="control-label">{tStringReactive('clampTypography.spacingApplyTo', $locale)}</label>
			<div class="segmented-control">
				<button
					class="segment"
					class:active={props.state.spacingApplyTo === 'gap'}
					onclick={() => props.onUpdate({ spacingApplyTo: 'gap' })}
				>
					{tStringReactive('clampTypography.applyToGap', $locale)}
				</button>
				<button
					class="segment"
					class:active={props.state.spacingApplyTo === 'padding'}
					onclick={() => props.onUpdate({ spacingApplyTo: 'padding' })}
				>
					{tStringReactive('clampTypography.applyToPadding', $locale)}
				</button>
			</div>
		</div>
	{/if}
</div>

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

	.control-label-small {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.select-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.select-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.5rem;
		margin-bottom: 0;
	}

	.control-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.control-item {
		flex: 1;
		min-width: 120px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-item label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.number-input {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-bg);
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.number-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.segmented-control {
		display: flex;
		gap: 0.5rem;
		background: var(--color-bg-secondary);
		padding: 0.25rem;
		border-radius: 6px;
	}

	.segment {
		flex: 1;
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.segment:hover {
		background: var(--color-bg-tertiary);
	}

	.segment.active {
		background: var(--color-accent);
		color: white;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.preset-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-bg);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.preset-btn:hover {
		background: var(--color-bg-secondary);
		border-color: var(--color-accent);
	}

	.preset-btn.active {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}

	.preset-btn.active:hover {
		background: var(--color-accent);
		opacity: 0.9;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.checkbox-label input[type="checkbox"] {
		accent-color: var(--color-accent);
	}
</style>

