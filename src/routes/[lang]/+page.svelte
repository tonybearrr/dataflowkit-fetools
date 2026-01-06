<script lang="ts">
	import { page } from '$app/stores';
	import { locale, tReactive, tStringReactive, getPath, type Locale } from '$lib/i18n';
	import { Palette, Type, Layers, Wrench } from 'lucide-svelte';

	const lang = $derived(($page.params.lang || 'en') as Locale);
	const baseUrl = 'https://fetools.dataflowkit.dev';
	const currentUrl = $derived(`${baseUrl}/${lang}`);
	
	const tonylabLang = $derived(lang === 'ru' ? 'en' : lang);
</script>

<svelte:head>
	<title>FE Toolbox - Frontend & UI Tools</title>
	<meta
		name="description"
		content={tStringReactive('home.description', $locale)}
	/>
	<meta property="og:title" content="FE Toolbox - Frontend & UI Tools" />
	<meta
		property="og:description"
		content={tStringReactive('home.description', $locale)}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={currentUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="FE Toolbox - Frontend & UI Tools" />
	<meta
		name="twitter:description"
		content={tStringReactive('home.description', $locale)}
	/>
	<link rel="canonical" href={currentUrl} />
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "FE Toolbox",
			"description": "${tStringReactive('home.description', $locale)}",
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
			},
			"featureList": [
				"CSS Gradient Generator",
				"Shadow & Glass Generator",
				"Clamp / Fluid Typography Generator"
			]
		}
		</script>
	`}
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 sm:py-16">
	<div class="text-center mb-8 sm:mb-16">
		<h1 class="text-3xl sm:text-4xl font-bold mb-4">{tStringReactive('home.title', $locale)}</h1>
		<p class="text-lg sm:text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto px-4">
			{tStringReactive('home.description', $locale)}
		</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<a
			href={getPath('/css-gradient-generator', lang)}
			class="group p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-400/10"
		>
			<div
				class="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/15 transition-colors"
			>
				<Palette class="w-6 h-6 text-purple-400" />
			</div>
			<h2 class="text-lg font-semibold mb-2 group-hover:text-purple-400 transition-colors">
				{tStringReactive('home.cssGradientGenerator.title', $locale)}
			</h2>
			<p class="text-sm text-[var(--color-text-muted)]">
				{tStringReactive('home.cssGradientGenerator.description', $locale)}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each (tReactive('home.cssGradientGenerator.tags', $locale) as string[]) as tag}
					<span
						class="text-xs px-2 py-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
					>
						{tag}
					</span>
				{/each}
			</div>
		</a>

		<a
			href={getPath('/shadow-glass-generator', lang)}
			class="group p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-indigo-400 transition-all hover:shadow-lg hover:shadow-indigo-400/10"
		>
			<div
				class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/15 transition-colors"
			>
				<Layers class="w-6 h-6 text-indigo-400" />
			</div>
			<h2 class="text-lg font-semibold mb-2 group-hover:text-indigo-400 transition-colors">
				{tStringReactive('home.shadowGlassGenerator.title', $locale)}
			</h2>
			<p class="text-sm text-[var(--color-text-muted)]">
				{tStringReactive('home.shadowGlassGenerator.description', $locale)}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each (tReactive('home.shadowGlassGenerator.tags', $locale) as string[]) as tag}
					<span
						class="text-xs px-2 py-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
					>
						{tag}
					</span>
				{/each}
			</div>
		</a>

		<a
			href={getPath('/clamp-typography-generator', lang)}
			class="group p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-400/10"
		>
			<div
				class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors"
			>
				<Type class="w-6 h-6 text-emerald-400" />
			</div>
			<h2 class="text-lg font-semibold mb-2 group-hover:text-emerald-400 transition-colors">
				{tStringReactive('home.clampTypography.title', $locale)}
			</h2>
			<p class="text-sm text-[var(--color-text-muted)]">
				{tStringReactive('home.clampTypography.description', $locale)}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each (tReactive('home.clampTypography.tags', $locale) as string[]) as tag}
					<span
						class="text-xs px-2 py-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
					>
						{tag}
					</span>
				{/each}
			</div>
		</a>

		<div
			class="p-6 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 flex flex-col items-center justify-center text-center"
		>
			<div
				class="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4"
			>
				<Wrench class="w-6 h-6 text-[var(--color-text-muted)] opacity-50" />
			</div>
			<p class="text-sm text-[var(--color-text-muted)]">{tStringReactive('common.moreToolsComing', $locale)}</p>
		</div>
	</div>
</div>
