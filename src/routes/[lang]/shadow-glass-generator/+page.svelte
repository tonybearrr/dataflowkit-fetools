<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { locale, tStringReactive, type Locale } from '$lib/i18n';
	import { Layers, Copy, Check } from 'lucide-svelte';
	import type { ShadowGlassState, ShadowState, GlassState, ShadowLayer } from '$lib/fetools/shadow-glass/types';
	import { generateShadowCSS, generateTailwindValues } from '$lib/fetools/shadow-glass/cssBuilders/shadow';
	import { generateGlassCSS, getGlassPreviewStyle } from '$lib/fetools/shadow-glass/cssBuilders/glass';
	import { loadState, saveState } from '$lib/fetools/shadow-glass/storage';
	import { applyPreset } from '$lib/fetools/shadow-glass/cssBuilders/shadow';
	import ShadowControls from '$lib/fetools/shadow-glass/components/ShadowControls.svelte';
	import GlassControls from '$lib/fetools/shadow-glass/components/GlassControls.svelte';
	import PreviewCard from '$lib/fetools/shadow-glass/components/PreviewCard.svelte';

	const lang = $derived(($page.params.lang || 'en') as Locale);
	const baseUrl = 'https://fetools.dataflowkit.dev';
	const currentUrl = $derived(`${baseUrl}/${lang}/shadow-glass-generator`);
	
	const tonylabLang = $derived(lang === 'ru' ? 'en' : lang);

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function createShadowLayer(overrides: Partial<ShadowLayer> = {}): ShadowLayer {
		return {
			id: generateId(),
			x: 0,
			y: 4,
			blur: 12,
			spread: 0,
			opacity: 15,
			color: '#000000',
			inset: false,
			...overrides
		};
	}

	const defaultShadowState: ShadowState = {
		type: 'box-shadow',
		layers: [createShadowLayer(), createShadowLayer({ y: 8, blur: 24, opacity: 10 })],
		useAngleMode: false,
		angle: 135,
		distance: 10,
		preset: null,
		previewBackground: 'light',
		showGrid: false
	};

	const defaultGlassState: GlassState = {
		blur: 10,
		tintColor: '#ffffff',
		tintOpacity: 20,
		backgroundBrightness: 50,
		borderWidth: 1,
		borderColor: '#ffffff',
		borderOpacity: 30,
		shadow: {
			x: 0,
			y: 4,
			blur: 12,
			opacity: 10
		},
		noiseEnabled: false,
		customBackground: '',
		customTextColor: '#000000'
	};

	const defaultState: ShadowGlassState = {
		activeTab: 'shadow',
		shadow: defaultShadowState,
		glass: defaultGlassState
	};

	// @ts-expect-error - Svelte 5 runes $state type inference issue
	let state = $state(defaultState);
	let copiedId = $state(null as string | null);
	let outputMode = $state('standard' as 'standard' | 'css-variable');

	// Computed styles
	const shadowStyle = $derived(() => {
		if (state.shadow.layers.length === 0) return '';
		if (state.shadow.type === 'box-shadow') {
			const layers = state.shadow.layers.map((layer: ShadowLayer) => {
				const color = layer.color.startsWith('#')
					? `${layer.color}${Math.round((layer.opacity / 100) * 255)
							.toString(16)
							.padStart(2, '0')}`
					: layer.color;
				const inset = layer.inset ? 'inset ' : '';
				return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`;
			});
			return `box-shadow: ${layers.join(', ')};`;
		} else {
			const layers = state.shadow.layers.map((layer: ShadowLayer) => {
				const color = layer.color.startsWith('#')
					? `${layer.color}${Math.round((layer.opacity / 100) * 255)
							.toString(16)
							.padStart(2, '0')}`
					: layer.color;
				return `drop-shadow(${layer.x}px ${layer.y}px ${layer.blur}px ${color})`;
			});
			return `filter: ${layers.join(' ')};`;
		}
	});

	const glassStyle = $derived(() => getGlassPreviewStyle(state.glass));

	const shadowCSS = $derived(() => generateShadowCSS(state.shadow, outputMode));
	const shadowTailwindValues = $derived(() => generateTailwindValues(state.shadow));
	const glassCSS = $derived(() => generateGlassCSS(state.glass));

	onMount(() => {
		if (browser) {
			const saved = loadState();
			if (saved) {
				state = {
					...defaultState,
					...saved,
					shadow: {
						...defaultShadowState,
						...(saved.shadow || {}),
						layers: (saved.shadow?.layers || defaultShadowState.layers).map((layer) => ({
							...createShadowLayer(),
							...layer,
							id: layer.id || generateId()
						}))
					},
					glass: {
						...defaultGlassState,
						...(saved.glass || {})
					}
				};
			}
		}
	});

	// Save state on changes
	$effect(() => {
		if (browser) {
			const timeoutId = setTimeout(() => {
				saveState(state);
			}, 300);
			return () => clearTimeout(timeoutId);
		}
	});

	function updateShadowState(updates: Partial<ShadowState>) {
		state.shadow = { ...state.shadow, ...updates };
		if (updates.preset) {
			state.shadow = applyPreset(state.shadow, updates.preset);
		}
	}

	function updateGlassState(updates: Partial<GlassState>) {
		state.glass = { ...state.glass, ...updates };
	}

	function updateShadowLayer(layerId: string, updates: Partial<ShadowLayer>) {
		state.shadow.layers = state.shadow.layers.map((layer: ShadowLayer) =>
			layer.id === layerId ? { ...layer, ...updates } : layer
		);
	}

	function addShadowLayer() {
		if (state.shadow.layers.length >= 5) return;
		state.shadow.layers = [...state.shadow.layers, createShadowLayer()];
	}

	function removeShadowLayer(layerId: string) {
		if (state.shadow.layers.length <= 1) return;
		state.shadow.layers = state.shadow.layers.filter((layer: ShadowLayer) => layer.id !== layerId);
	}

	function resetShadow() {
		state.shadow = { ...defaultShadowState };
	}

	function updateGlassShadow(updates: Partial<GlassState['shadow']>) {
		state.glass.shadow = { ...state.glass.shadow, ...updates };
	}

	async function copyCSS(type: 'shadow' | 'glass', format: 'css' | 'tailwind' = 'css') {
		const text = type === 'shadow' 
			? (format === 'tailwind' ? shadowTailwindValues() : shadowCSS())
			: glassCSS();
		try {
			await navigator.clipboard.writeText(text);
			copiedId = `${type}-${format}`;
			setTimeout(() => {
				copiedId = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

</script>

<svelte:head>
	<title>{tStringReactive('shadowGlassGenerator.title', $locale)}</title>
	<meta
		name="description"
		content={tStringReactive('shadowGlassGenerator.description', $locale)}
	/>
	<meta property="og:title" content={tStringReactive('shadowGlassGenerator.title', $locale)} />
	<meta
		property="og:description"
		content={tStringReactive('shadowGlassGenerator.description', $locale)}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={currentUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={tStringReactive('shadowGlassGenerator.title', $locale)} />
	<meta
		name="twitter:description"
		content={tStringReactive('shadowGlassGenerator.description', $locale)}
	/>
	<link rel="canonical" href={currentUrl} />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<header class="mb-6 sm:mb-8">
		<div class="flex gap-3 mb-4">
			<div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
				<Layers class="w-6 h-6 text-indigo-400" />
			</div>
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold mb-3">
					{tStringReactive('shadowGlassGenerator.heading', $locale)}
				</h1>
				<p class="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl">
					{tStringReactive('shadowGlassGenerator.subtitle', $locale)}
				</p>
			</div>
		</div>
	</header>

	<!-- Tabs -->
	<div class="mb-6">
		<div class="tabs">
			<button
				class="tab"
				class:active={state.activeTab === 'shadow'}
				onclick={() => (state.activeTab = 'shadow')}
			>
				{tStringReactive('shadowGlassGenerator.tabShadow', $locale)}
			</button>
			<button
				class="tab"
				class:active={state.activeTab === 'glass'}
				onclick={() => (state.activeTab = 'glass')}
			>
				{tStringReactive('shadowGlassGenerator.tabGlass', $locale)}
			</button>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Preview -->
		<div class="order-1">
			<div class="mb-4">
				<h2 class="text-lg font-semibold">{tStringReactive('shadowGlassGenerator.preview', $locale)}</h2>
			</div>
			{#if state.activeTab === 'shadow'}
				<PreviewCard
					type="shadow"
					shadowState={state.shadow}
					shadowStyle={shadowStyle()}
				/>
			{:else}
				<PreviewCard
					type="glass"
					glassState={state.glass}
					glassStyle={glassStyle()}
				/>
			{/if}
			
			{#if state.activeTab === 'glass'}
				<div class="mt-4 space-y-4">
					<div class="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
						<label class="block text-sm font-medium mb-3">{tStringReactive('shadowGlassGenerator.customBackground', $locale)}</label>
						<div class="space-y-2">
							<label class="text-xs text-[var(--color-text-muted)]">
								{tStringReactive('shadowGlassGenerator.enterCssCode', $locale)} <code class="text-xs">background:</code>)
							</label>
							<input
								type="text"
								value={state.glass.customBackground}
								oninput={(e) => updateGlassState({ customBackground: (e.target as HTMLInputElement).value })}
								placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
								class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-mono"
							/>
						</div>
					</div>
					<div class="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
						<label class="block text-sm font-medium mb-3">{tStringReactive('shadowGlassGenerator.textColor', $locale)}</label>
						<div class="space-y-2">
							<label class="text-xs text-[var(--color-text-muted)]">
								{tStringReactive('shadowGlassGenerator.enterCssCode', $locale)} <code class="text-xs">color:</code>)
							</label>
							<input
								type="text"
								value={state.glass.customTextColor}
								oninput={(e) => updateGlassState({ customTextColor: (e.target as HTMLInputElement).value })}
								placeholder="#000000"
								class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-mono"
							/>
						</div>
					</div>
				</div>
			{/if}
			
			{#if state.activeTab === 'shadow'}
				<div class="mt-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
					<label class="block text-sm font-medium mb-3">{tStringReactive('shadowGlassGenerator.previewOptions', $locale)}</label>
					<div class="space-y-3">
						<label class="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={state.shadow.showGrid}
								onchange={(e) => updateShadowState({ showGrid: (e.target as HTMLInputElement).checked })}
								class="rounded border-[var(--color-border)]"
								style="accent-color: var(--color-accent);"
							/>
							<span>{tStringReactive('shadowGlassGenerator.showGridBackground', $locale)}</span>
						</label>
						<div class="flex items-center gap-2">
							<label class="text-sm">{tStringReactive('shadowGlassGenerator.background', $locale)}:</label>
							<select
								value={state.shadow.previewBackground}
								onchange={(e) => updateShadowState({ previewBackground: (e.target as HTMLSelectElement).value as 'light' | 'dark' })}
								class="px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
							>
								<option value="light">{tStringReactive('shadowGlassGenerator.light', $locale)}</option>
								<option value="dark">{tStringReactive('shadowGlassGenerator.dark', $locale)}</option>
							</select>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Controls -->
		<div class="order-2">
			{#if state.activeTab === 'shadow'}
				<ShadowControls
					state={state.shadow}
					onUpdate={updateShadowState}
					onLayerUpdate={updateShadowLayer}
					onAddLayer={addShadowLayer}
					onRemoveLayer={removeShadowLayer}
					onReset={resetShadow}
				/>
			{:else}
				<GlassControls
					state={state.glass}
					onUpdate={updateGlassState}
					onShadowUpdate={updateGlassShadow}
				/>
			{/if}
		</div>
	</div>

	<!-- Output -->
	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{tStringReactive('shadowGlassGenerator.cssOutput', $locale)}</h2>
			{#if state.activeTab === 'shadow'}
				<div class="flex gap-2">
					<select
						value={outputMode}
						onchange={(e) => (outputMode = (e.target as HTMLSelectElement).value as 'standard' | 'css-variable')}
						class="px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
					>
						<option value="standard">Standard</option>
						<option value="css-variable">CSS Variable</option>
					</select>
					<button
						onclick={() => copyCSS('shadow', 'css')}
						class="px-4 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2 text-sm"
					>
						{#if copiedId === 'shadow-css'}
							<Check class="w-4 h-4" />
							{tStringReactive('shadowGlassGenerator.copied', $locale)}
						{:else}
							<Copy class="w-4 h-4" />
							{tStringReactive('shadowGlassGenerator.copyCss', $locale)}
						{/if}
					</button>
					<button
						onclick={() => copyCSS('shadow', 'tailwind')}
						class="px-4 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2 text-sm"
						title={tStringReactive('shadowGlassGenerator.copyAsTailwind', $locale)}
					>
						{#if copiedId === 'shadow-tailwind'}
							<Check class="w-4 h-4" />
							{tStringReactive('shadowGlassGenerator.copied', $locale)}
						{:else}
							<Copy class="w-4 h-4" />
							{tStringReactive('shadowGlassGenerator.copyValues', $locale)}
						{/if}
					</button>
				</div>
			{:else}
				<button
					onclick={() => copyCSS('glass')}
					class="px-4 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-2 text-sm"
				>
					{#if copiedId === 'glass'}
						<Check class="w-4 h-4" />
						{tStringReactive('shadowGlassGenerator.copied', $locale)}
					{:else}
						<Copy class="w-4 h-4" />
						{tStringReactive('shadowGlassGenerator.copy', $locale)}
					{/if}
				</button>
			{/if}
		</div>
		<pre class="code-block"><code>{state.activeTab === 'shadow' ? shadowCSS() : glassCSS()}</code></pre>
		{#if state.activeTab === 'shadow' && outputMode === 'standard'}
			<div class="mt-4">
				<details class="text-sm">
					<summary class="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
						{tStringReactive('shadowGlassGenerator.tailwindValues', $locale)}
					</summary>
					<pre class="code-block mt-2"><code>{shadowTailwindValues()}</code></pre>
				</details>
			</div>
		{/if}
	</div>

	<!-- Explanation / SEO Blocks -->
	<div class="mt-12 space-y-8">
		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.whatIs', $locale)}</h2>
			<p class="text-[var(--color-text-muted)] leading-relaxed mb-4">
				{tStringReactive('shadowGlassGenerator.whatIsDescription', $locale)}
			</p>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.parameters', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('shadowGlassGenerator.parameters1', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters1', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters2', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters2', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters3', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters3', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters4', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters4', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters5', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters5', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters6', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters6', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters7', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters7', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters8', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters8', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters9', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters9', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters10', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters10', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters11', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters11', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters12', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters12', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters13', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters13', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.parameters14', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.parameters14', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.whenToUse', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('shadowGlassGenerator.whenToUse1', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.whenToUse1', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.whenToUse2', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.whenToUse2', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.whenToUse3', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.whenToUse3', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.whenToUse4', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.whenToUse4', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.commonMistakes', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('shadowGlassGenerator.commonMistakes1', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.commonMistakes1', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.commonMistakes2', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.commonMistakes2', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.commonMistakes3', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.commonMistakes3', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.notes', $locale)}</h2>
			<ul class="text-[var(--color-text-muted)] leading-relaxed space-y-1 list-disc list-inside">
				{#if tStringReactive('shadowGlassGenerator.notes1', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.notes1', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.notes2', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.notes2', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.notes3', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.notes3', $locale)}</li>
				{/if}
				{#if tStringReactive('shadowGlassGenerator.notes4', $locale)}
					<li>{tStringReactive('shadowGlassGenerator.notes4', $locale)}</li>
				{/if}
			</ul>
		</section>

		<section>
			<h2 class="text-2xl font-semibold mb-4">{tStringReactive('shadowGlassGenerator.privacy', $locale)}</h2>
			<p class="text-[var(--color-text-muted)] leading-relaxed">
				{tStringReactive('shadowGlassGenerator.privacyText', $locale)}
			</p>
		</section>
	</div>
</div>

<style>
	.tabs {
		display: flex;
		gap: 0.5rem;
		background: var(--color-bg-secondary);
		border-radius: 8px;
		padding: 4px;
	}

	.tab {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.code-block {
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-text);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.code-block code {
		white-space: pre;
	}
</style>

