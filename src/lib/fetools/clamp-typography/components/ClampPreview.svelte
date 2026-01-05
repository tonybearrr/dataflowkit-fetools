<script lang="ts">
	import type { ClampTypographyState } from '../types';
	import { 
		calculateTypographyLevels, 
		calculateLevelSizeForViewport,
		formatValue
	} from '../cssBuilders/clamp';

	interface Props {
		state: ClampTypographyState;
		previewWidth: number;
		remBase: number;
	}

	let { state, previewWidth, remBase }: Props = $props();

	const levels = $derived(() => {
		if (state.mode === 'spacing') {
			const size = calculateLevelSizeForViewport(
				previewWidth,
				{ level: 'body', min: state.typography.min, max: state.typography.max },
				state.viewport
			);
			return [{ level: 'body' as const, size }];
		}
		
		const typographyLevels = calculateTypographyLevels(state);
		return typographyLevels.map(level => ({
			level: level.level,
			size: calculateLevelSizeForViewport(previewWidth, level, state.viewport)
		}));
	});

	function getSizeForLevel(level: string): string {
		const levelData = levels().find(l => l.level === level);
		if (!levelData) return '1rem';
		return formatValue(levelData.size, state.unit, remBase);
	}
</script>

<div class="preview-frame">
	<div class="preview-sheet" style="--preview-vw: {previewWidth}px; width: {previewWidth}px;">
		{#if state.mode === 'typography'}
			<h1 class="preview-h1" style="font-size: {getSizeForLevel('h1')};">
				Heading 1
			</h1>
			<h2 class="preview-h2" style="font-size: {getSizeForLevel('h2')};">
				Heading 2
			</h2>
			<h3 class="preview-h3" style="font-size: {getSizeForLevel('h3')};">
				Heading 3
			</h3>
			<h4 class="preview-h4" style="font-size: {getSizeForLevel('h4')};">
				Heading 4
			</h4>
			<h5 class="preview-h5" style="font-size: {getSizeForLevel('h5')};">
				Heading 5
			</h5>
			<h6 class="preview-h6" style="font-size: {getSizeForLevel('h6')};">
				Heading 6
			</h6>
			<p class="preview-body" style="font-size: {getSizeForLevel('body')};">
				This is body text that scales fluidly between the minimum and maximum viewport widths. The text remains readable at all screen sizes.
			</p>
			{#if state.includeSmall}
				<small class="preview-small" style="font-size: {getSizeForLevel('small')};">
					Small text example
				</small>
			{/if}
		{:else}
			<div class="spacing-preview">
				<h3 class="spacing-title">Spacing Preview</h3>
				<p class="spacing-helper">
					{state.spacingApplyTo === 'gap' 
						? 'Spacing token is applied as vertical gap between items'
						: 'Spacing token is applied as padding inside items'}
				</p>
				<div class="spacing-items-container">
					<div 
						class="spacing-item" 
						style={state.spacingApplyTo === 'gap' 
							? `margin-bottom: ${getSizeForLevel('body')};`
							: `padding: ${getSizeForLevel('body')}; margin-bottom: ${getSizeForLevel('body')};`}
					>
						<div class="spacing-item-content">Card 1</div>
					</div>
					<div 
						class="spacing-item" 
						style={state.spacingApplyTo === 'gap' 
							? `margin-bottom: ${getSizeForLevel('body')};`
							: `padding: ${getSizeForLevel('body')}; margin-bottom: ${getSizeForLevel('body')};`}
					>
						<div class="spacing-item-content">Card 2</div>
					</div>
					<div 
						class="spacing-item" 
						style={state.spacingApplyTo === 'gap' 
							? `margin-bottom: ${getSizeForLevel('body')};`
							: `padding: ${getSizeForLevel('body')}; margin-bottom: ${getSizeForLevel('body')};`}
					>
						<div class="spacing-item-content">Card 3</div>
					</div>
					<div 
						class="spacing-item" 
						style={state.spacingApplyTo === 'gap' 
							? `margin-bottom: ${getSizeForLevel('body')};`
							: `padding: ${getSizeForLevel('body')}; margin-bottom: ${getSizeForLevel('body')};`}
					>
						<div class="spacing-item-content">Card 4</div>
					</div>
					<div 
						class="spacing-item" 
						style={state.spacingApplyTo === 'gap' 
							? ''
							: `padding: ${getSizeForLevel('body')};`}
					>
						<div class="spacing-item-content">Card 5</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.preview-frame {
		height: min(70vh, 640px);
		width: 100%;
		padding: 2rem;
		border: 1px solid var(--color-border);
		border-radius: 12px;
		background: var(--color-bg);
		overflow-x: auto;
		overflow-y: auto;
		box-sizing: border-box;
		min-width: 0;
	}

	.preview-sheet {
		min-width: min-content;
		box-sizing: border-box;
	}


	.preview-h1,
	.preview-h2,
	.preview-h3,
	.preview-h4,
	.preview-h5,
	.preview-h6 {
		margin: 0.5em 0;
		font-weight: 600;
		line-height: 1.2;
		color: var(--color-text);
	}

	.preview-body {
		margin: 1em 0;
		line-height: 1.6;
		color: var(--color-text);
	}

	.preview-small {
		display: block;
		margin-top: 1em;
		color: var(--color-text-muted);
	}

	.spacing-preview {
		display: flex;
		flex-direction: column;
	}

	.spacing-items-container {
		display: flex;
		flex-direction: column;
	}

	.spacing-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.spacing-helper {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.spacing-item {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.spacing-item:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.spacing-item-content {
		color: var(--color-text);
		font-weight: 500;
	}
</style>

