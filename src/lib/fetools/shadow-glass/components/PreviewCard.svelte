<script lang="ts">
	import type { ShadowState, GlassState } from '../types';
    import { Rocket } from 'lucide-svelte';
	interface Props {
		type: 'shadow' | 'glass';
		shadowState?: ShadowState;
		glassState?: GlassState;
		shadowStyle?: string;
		glassStyle?: string;
	}

	let { type, shadowState, glassState, shadowStyle = '', glassStyle = '' }: Props = $props();

</script>

<div class="preview-container">
	{#if type === 'shadow' && shadowState}
		<div
			class="preview-card shadow-preview"
			class:grid-background={shadowState.showGrid}
			class:dark-bg={shadowState.previewBackground === 'dark'}
			style={shadowStyle || ''}
		>
			<div class="preview-content" class:dark-text={shadowState.previewBackground === 'dark'}>
				<div class="preview-text">Preview Card</div>
			</div>
		</div>
	{:else if type === 'glass' && glassState}
    <div class="glass-preview-container">
		<div class="glass-preview-wrapper">
			<div
				class="glass-background"
				style={glassState.customBackground ? `background: ${glassState.customBackground};` : ''}
			>
				<div class="glass-pattern"></div>
			</div>
			<div
				class="preview-card glass-preview"
				style={glassStyle || ''}
			>
				{#if glassState.noiseEnabled}
					<div class="noise-overlay"></div>
				{/if}
				<div class="preview-content">
					<div class="preview-text">Glass Panel</div>
					<div class="preview-subtext">Backdrop blur effect</div>
				</div>
			</div>
		</div>
        <div class="glass-preview-wrapper">
			<div
				class="glass-background"
				style={glassState.customBackground ? `background: ${glassState.customBackground};` : ''}
			>
                <div class="w-full h-full flex flex-col items-center justify-center text-[3rem] font-bold" style="color: {glassState.customTextColor || '#000000'};">
                    <p class="uppercase">Some text here</p>
                    <Rocket class="w-10 h-10" style="color: {glassState.customTextColor || '#ffffff'};" />
                </div>
				<div class="glass-pattern"></div>
			</div>
            
			<div
				class="preview-card glass-preview"
				style={glassStyle || ''}
			>
				{#if glassState.noiseEnabled}
					<div class="noise-overlay"></div>
				{/if}
                
				<div class="preview-content">
				</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
    .glass-preview-container{
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        height: 100%;
        min-height: 300px;
        padding: 2rem;
        border-radius: 12px;
        background: var(--color-bg);
    }
	.preview-container {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
		padding: 2rem;
	}

	.preview-card {
		width: 300px;
		height: 300px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.shadow-preview {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.shadow-preview.dark-bg {
		background: #1a1a1a;
		border-color: #333;
	}

	.shadow-preview.grid-background {
		background-image: 
			linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	}

	.shadow-preview.dark-bg.grid-background {
		background-image: 
			linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%);
	}

	.glass-preview-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.glass-background {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		overflow: hidden;
	}

	.glass-pattern {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
	}

	.glass-preview {
		position: relative;
		z-index: 1;
		width: 280px;
		height: 200px;
		border-radius: 12px;
	}

	.noise-overlay {
		position: absolute;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%270.05%27/%3E%3C/svg%3E");
		pointer-events: none;
		border-radius: inherit;
	}

	.preview-content {
		text-align: center;
		padding: 1.5rem;
	}

	.preview-text {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.preview-content.dark-text .preview-text {
		color: #ffffff;
	}

	.preview-subtext {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>

