<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { locale, tStringReactive, type Locale } from '$lib/i18n';
	import { Copy, Check, Type } from 'lucide-svelte';
	import type { ClampTypographyState } from '$lib/fetools/clamp-typography/types';
	import { 
		generateClampCSS, 
		generateClampVariable,
		generateFullScaleCSS,
		generateFullScaleVariables,
		calculateTypographyLevels,
		generateClampForLevel,
		generateSpacingToken,
		generateSpacingTokenWithUsage
	} from '$lib/fetools/clamp-typography/cssBuilders/clamp';
	import { loadState, saveState } from '$lib/fetools/clamp-typography/storage';
	import ClampPreview from '$lib/fetools/clamp-typography/components/ClampPreview.svelte';
	import ClampControls from '$lib/fetools/clamp-typography/components/ClampControls.svelte';

	const lang = $derived(($page.params.lang || 'en') as Locale);
	const baseUrl = 'https://fetools.dataflowkit.dev';
	const currentUrl = $derived(`${baseUrl}/${lang}/clamp-typography-generator`);
	
	const tonylabLang = $derived(lang === 'ru' ? 'en' : lang);

	const defaultState: ClampTypographyState = {
		viewport: {
			min: 320,
			max: 1440
		},
		typography: {
			min: 16,
			max: 18,
			base: 16
		},
		unit: 'px',
		preset: null,
		mode: 'typography',
		showScaleTable: false,
		scaleRatio: 1.25,
		customRatio: 1.25,
		includeSmall: false,
		spacingApplyTo: 'gap'
	};

	// @ts-expect-error - Svelte 5 runes $state type inference issue
	let state = $state(defaultState);
	let copiedId = $state(null as string | null);
	let previewWidth = $state(800);
	const remBase = 16;

	// Computed values
	const clampCSS = $derived(() => generateClampCSS(state, remBase));
	const clampVariable = $derived(() => generateClampVariable(state, '--fluid-size', remBase));
	
	// Full scale values
	const fullScaleCSS = $derived(() => {
		if (state.mode === 'typography') {
			return generateFullScaleCSS(state, remBase);
		}
		// For spacing mode, return just the clamp value
		return `--space-fluid: ${clampCSS()};`;
	});
	
	const fullScaleVariables = $derived(() => {
		if (state.mode === 'typography') {
			return generateFullScaleVariables(state, remBase);
		}
		// For spacing mode, return token with usage
		return generateSpacingTokenWithUsage(state, remBase);
	});
	
	const typographyLevels = $derived.by(() => {
		if (state.mode === 'typography') {
			return calculateTypographyLevels(state);
		}
		return [];
	});

	// Load saved state on mount
	onMount(() => {
		if (browser) {
			const saved = loadState();
			if (saved) {
				// Ensure spacingApplyTo exists for backward compatibility
				if (!saved.spacingApplyTo) {
					saved.spacingApplyTo = 'gap';
				}
				state = { ...defaultState, ...saved };
			}
		}
	});

	// Save state on change
	$effect(() => {
		if (browser) {
			saveState(state);
		}
	});

	function updateState(updates: Partial<ClampTypographyState>) {
		state = { ...state, ...updates };
	}

	async function copyCSS(type: 'css' | 'variable') {
		let text = '';
		if (type === 'css') {
			if (state.mode === 'typography') {
				text = fullScaleCSS();
			} else {
				text = generateSpacingToken(state, remBase);
			}
		} else {
			if (state.mode === 'typography') {
				text = fullScaleVariables();
			} else {
				text = generateSpacingTokenWithUsage(state, remBase);
			}
		}
		try {
			await navigator.clipboard.writeText(text);
			copiedId = type;
			setTimeout(() => {
				copiedId = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}
</script>

<svelte:head>
	<title>{tStringReactive('clampTypography.title', $locale)}</title>
	<meta
		name="description"
		content={tStringReactive('clampTypography.description', $locale)}
	/>
	<meta property="og:title" content={tStringReactive('clampTypography.title', $locale)} />
	<meta
		property="og:description"
		content={tStringReactive('clampTypography.description', $locale)}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={currentUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={tStringReactive('clampTypography.title', $locale)} />
	<meta
		name="twitter:description"
		content={tStringReactive('clampTypography.description', $locale)}
	/>
	<link rel="canonical" href={currentUrl} />
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "${tStringReactive('clampTypography.heading', $locale)}",
			"description": "${tStringReactive('clampTypography.description', $locale)}",
			"url": "${currentUrl}",
			"applicationCategory": "DeveloperApplication",
			"operatingSystem": "Web Browser",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"creator": {
				"@type": "Person",
				"name": "Anton Bulavenko",
				"url": "https://tonylab.dev/${tonylabLang}"
			}
		}
		</script>
	`}
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
	<div class="flex gap-3 mb-4">
		<div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
			<Type class="w-6 h-6 text-emerald-400" />
		</div>
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold mb-3">
					{tStringReactive('clampTypography.heading', $locale)}
				</h1>
				<p class="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl">
					{tStringReactive('clampTypography.subtitle', $locale)}
				</p>
			</div>
		</div>
	</div>

	<!-- Main Layout -->
	<div class="layout-container mb-8">
		<!-- Preview Column -->
		<div class="preview-column">
			<div class="mb-4">
				<h2 class="text-lg font-semibold mb-2">{tStringReactive('clampTypography.preview', $locale)}</h2>
				<div class="flex items-center gap-4">
					<label class="text-sm text-[var(--color-text-muted)]">
						{tStringReactive('clampTypography.viewportWidth', $locale)}:
					</label>
					<input
						type="range"
						min={state.viewport.min}
						max={state.viewport.max}
						value={previewWidth}
						oninput={(e) => previewWidth = Number((e.target as HTMLInputElement).value)}
						class="flex-1"
					/>
					<span class="text-sm font-mono w-20 text-right">{previewWidth}px</span>
				</div>
			</div>
			<ClampPreview state={state} previewWidth={previewWidth} remBase={remBase} />
			
			{#if state.showScaleTable && state.mode === 'typography'}
				<div class="mt-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
					<h3 class="text-sm font-semibold mb-3">{tStringReactive('clampTypography.scaleTable', $locale)}</h3>
					<div class="space-y-2 text-sm">
						{#each typographyLevels as level}
							{@const isSelected = state.preset === level.level}
							<div 
								class="flex justify-between scale-table-row"
								class:selected={isSelected}
							>
								<span class="font-medium">{level.level.toUpperCase()}:</span>
								<span class="font-mono text-xs">
									{generateClampForLevel(level, state.viewport, state.unit, remBase)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Controls Column -->
		<div class="controls-column">
			<ClampControls state={state} onUpdate={updateState} />
		</div>
	</div>

	<!-- CSS Output -->
	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{tStringReactive('clampTypography.cssOutput', $locale)}</h2>
			<div class="flex gap-2">
				<button
					onclick={() => copyCSS('css')}
					class="px-4 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2 text-sm"
				>
					{#if copiedId === 'css'}
						<Check class="w-4 h-4" />
						{tStringReactive('clampTypography.copied', $locale)}
					{:else}
						<Copy class="w-4 h-4" />
						{state.mode === 'typography' 
							? tStringReactive('clampTypography.copyCss', $locale)
							: tStringReactive('clampTypography.copyToken', $locale)}
					{/if}
				</button>
				<button
					onclick={() => copyCSS('variable')}
					class="px-4 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2 text-sm"
				>
					{#if copiedId === 'variable'}
						<Check class="w-4 h-4" />
						{tStringReactive('clampTypography.copied', $locale)}
					{:else}
						<Copy class="w-4 h-4" />
						{state.mode === 'typography' 
							? tStringReactive('clampTypography.copyVariable', $locale)
							: tStringReactive('clampTypography.copyUsage', $locale)}
					{/if}
				</button>
			</div>
		</div>
		
		<div class="space-y-4">
			{#if state.mode === 'typography'}
				<div>
					<label class="block text-sm font-medium mb-2">{tStringReactive('clampTypography.fullScale', $locale)}</label>
					<pre class="code-block"><code>{fullScaleCSS()}</code></pre>
				</div>
				
				<div>
					<label class="block text-sm font-medium mb-2">{tStringReactive('clampTypography.cssVariable', $locale)}</label>
					<pre class="code-block"><code>{fullScaleVariables()}</code></pre>
				</div>
			{:else}
				<div>
					<label class="block text-sm font-medium mb-2">{tStringReactive('clampTypography.spacingToken', $locale)}</label>
					<pre class="code-block"><code>{generateSpacingToken(state, remBase)}</code></pre>
				</div>
				
				<div>
					<label class="block text-sm font-medium mb-2">{tStringReactive('clampTypography.spacingUsage', $locale)}</label>
					<pre class="code-block"><code>{generateSpacingTokenWithUsage(state, remBase)}</code></pre>
				</div>
			{/if}
		</div>
	</div>

	<!-- Explanation / SEO Blocks -->
	<div class="mt-12 space-y-8">
		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.whatIs', $locale)}</h2>
			<p class="text-[var(--color-text-muted)] leading-relaxed mb-4">
				{tStringReactive('clampTypography.whatIsDescription', $locale)}
			</p>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.parameters', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('clampTypography.parameters1', $locale)}
					<li>{tStringReactive('clampTypography.parameters1', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters2', $locale)}
					<li>{tStringReactive('clampTypography.parameters2', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters3', $locale)}
					<li>{tStringReactive('clampTypography.parameters3', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters4', $locale)}
					<li>{tStringReactive('clampTypography.parameters4', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters5', $locale)}
					<li>{tStringReactive('clampTypography.parameters5', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters6', $locale)}
					<li>{tStringReactive('clampTypography.parameters6', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.parameters7', $locale)}
					<li>{tStringReactive('clampTypography.parameters7', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.whenToUse', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('clampTypography.whenToUse1', $locale)}
					<li>{tStringReactive('clampTypography.whenToUse1', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.whenToUse2', $locale)}
					<li>{tStringReactive('clampTypography.whenToUse2', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.whenToUse3', $locale)}
					<li>{tStringReactive('clampTypography.whenToUse3', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.whenToUse4', $locale)}
					<li>{tStringReactive('clampTypography.whenToUse4', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.commonMistakes', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('clampTypography.commonMistakes1', $locale)}
					<li>{tStringReactive('clampTypography.commonMistakes1', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.commonMistakes2', $locale)}
					<li>{tStringReactive('clampTypography.commonMistakes2', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.commonMistakes3', $locale)}
					<li>{tStringReactive('clampTypography.commonMistakes3', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.notes', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('clampTypography.notes1', $locale)}
					<li>{tStringReactive('clampTypography.notes1', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.notes2', $locale)}
					<li>{tStringReactive('clampTypography.notes2', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.notes3', $locale)}
					<li>{tStringReactive('clampTypography.notes3', $locale)}</li>
				{/if}
				{#if tStringReactive('clampTypography.notes4', $locale)}
					<li>{tStringReactive('clampTypography.notes4', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('clampTypography.privacy', $locale)}</h2>
			<p class="text-[var(--color-text-muted)] leading-relaxed">
				{tStringReactive('clampTypography.privacyText', $locale)}
			</p>
		</section>
	</div>
</div>

<style>
	.layout-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.layout-container {
			grid-template-columns: 2fr 1fr;
			align-items: start;
		}
	}

	.preview-column {
		display: flex;
		flex-direction: column;
		/* Prevent column from growing beyond grid cell */
		min-width: 0;
		width: 100%;
	}

	.controls-column {
		display: flex;
		flex-direction: column;
		/* Prevent settings column from shrinking */
		min-width: 0;
	}

	@media (min-width: 1024px) {
		.controls-column {
			position: sticky;
			top: 24px;
			max-height: calc(100vh - 48px);
			overflow-y: auto;
		}
	}

	.scale-table-row {
		padding: 0.5rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.scale-table-row.selected {
		background-color: rgba(139, 111, 71, 0.1);
		border-left: 3px solid var(--color-accent);
		padding-left: calc(0.5rem - 3px);
	}

	.code-block {
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow-x: auto;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.code-block code {
		color: var(--color-text);
	}
</style>

