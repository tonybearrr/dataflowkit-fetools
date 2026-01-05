<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { locale, tStringReactive, type Locale } from '$lib/i18n';
	import { Palette, Copy, Check, Plus, X, RotateCcw } from 'lucide-svelte';
	import type { GradientState, ColorStop, GradientPreset } from '$lib/fetools/gradient';
	import { buildGradientString, generateOutput, sortStops } from '$lib/fetools/gradient/utils';
	import { loadState, saveState } from '$lib/fetools/gradient/storage';
	import { presets } from '$lib/fetools/gradient/presets';
	import ColorPicker from '$lib/fetools/gradient/components/ColorPicker.svelte';
	import GradientBar from '$lib/fetools/gradient/components/GradientBar.svelte';
	import Sheet from '$lib/components/Sheet.svelte';

	const lang = $derived(($page.params.lang || 'en') as Locale);
	const baseUrl = 'https://fetools.dataflowkit.dev';
	const currentUrl = $derived(`${baseUrl}/${lang}/css-gradient-generator`);
	
	const tonylabLang = $derived(lang === 'ru' ? 'en' : lang);

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function createStop(color: string, position: number, opacity: number = 100): ColorStop {
		return { id: generateId(), color, position, opacity };
	}

	const defaultState: GradientState = {
		type: 'linear',
		angle: 135,
		radialShape: 'ellipse',
		radialPosition: 'center',
		radialX: 50,
		radialY: 50,
		conicX: 50,
		conicY: 50,
		stops: [
			createStop('#c6ffdd', 0, 100),
			createStop('#fbd786', 50, 100),
			createStop('#f7797d', 100, 100)
		],
		outputMode: 'background',
		showCheckerboard: false,
		applyToBackground: false,
		animate: false,
		animationSpeed: 50,
		animationEasing: 'ease-in-out',
		selectedStopId: null
	};

	// @ts-expect-error - Svelte 5 runes $state type inference issue
	let state = $state(defaultState);
	let stateVersion = $state(0);
	let copiedId = $state(null);
	let colorPickerOpen = $state(null);
	let presetsSheetOpen = $state(false);

	let gradientString = $derived(buildGradientString(state));
	let outputCss = $derived(generateOutput(state));
	
	// Calculate actual animation speed in seconds (3-60s range)
	const animationSpeedSeconds = $derived(() => {
		return Math.max(3, Math.min(60, (100 - (state.animationSpeed ?? 50)) / 1.75 + 3));
	});
	
	// Preview style - simple, no animation (animation is handled by rAF for background)
	const previewStyle = $derived(() => {
		const baseStyle = state.showCheckerboard
			? `background-image: ${gradientString}, linear-gradient(45deg, #f5f1eb 25%, transparent 25%), linear-gradient(-45deg, #f5f1eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f1eb 75%), linear-gradient(-45deg, transparent 75%, #f5f1eb 75%); background-size: auto, 20px 20px, 20px 20px, 20px 20px, 20px 20px; background-position: center, 0 0, 0 10px, 10px -10px, -10px 0px;`
			: `background: ${gradientString};`;
		
		return baseStyle;
	});
	
	const previewClass = $derived(state.animate ? 'gradient-preview-animated' : '');

	onMount(() => {
		if (browser) {
			const saved = loadState();
			if (saved) {
				state = {
					...defaultState,
					...saved,
					stops: (saved.stops || defaultState.stops).map(stop => ({
						...stop,
						id: stop.id || generateId()
					}))
				};
			}
			
			// Add keyboard event listener
			document.addEventListener('keydown', handleKeydown);
			
			return () => {
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});

	function updateState(updates: Partial<GradientState>) {
		// Mutate state object properties instead of replacing the whole object
		Object.assign(state, updates);
		stateVersion++; // Increment to trigger $effect re-run
	}
	
	$effect(() => {
		if (!browser) return;
		const timer = setTimeout(() => {
			saveState(state);
		}, 100);
		return () => clearTimeout(timer);
	});

	function addStop() {
		if (state.stops.length >= 6) return;
		const sorted = sortStops(state.stops);
		const lastStop = sorted[sorted.length - 1];
		const newPosition = Math.min(100, lastStop.position + 10);
		const newStop = createStop('#ffffff', newPosition, 100);
		state.stops.push(newStop);
		stateVersion++;
	}

	function removeStop(id: string) {
		if (state.stops.length <= 2) return;
		const index = state.stops.findIndex((s: ColorStop) => s.id === id);
		if (index !== -1) {
			state.stops.splice(index, 1);
			stateVersion++;
		}
	}

	function updateStop(id: string, updates: Partial<ColorStop>) {
		const stop = state.stops.find((s: ColorStop) => s.id === id);
		if (stop) {
			Object.assign(stop, updates);
			stateVersion++;
		}
	}

	function resetStops() {
		state.stops.length = 0;
		state.stops.push(...defaultState.stops);
		stateVersion++;
	}

	function applyPreset(preset: GradientPreset) {
		const newStops: ColorStop[] = preset.stops.map(stop => createStop(stop.color, stop.position, stop.opacity));
		// Clear and refill array
		state.stops.length = 0;
		state.stops.push(...newStops);
		updateState({
			type: preset.type,
			angle: preset.angle ?? defaultState.angle,
			radialShape: preset.radialShape ?? defaultState.radialShape,
			radialPosition: preset.radialPosition ?? defaultState.radialPosition,
			radialX: preset.radialX ?? defaultState.radialX,
			radialY: preset.radialY ?? defaultState.radialY,
			conicX: preset.conicX ?? defaultState.conicX,
			conicY: preset.conicY ?? defaultState.conicY,
			animate: false
		});
	}

	function copyToClipboard(text: string, id: string) {
		navigator.clipboard.writeText(text).then(() => {
			copiedId = id;
			setTimeout(() => {
				copiedId = null;
			}, 2000);
		});
	}

	function handlePositionChange(id: string, newPosition: number) {
		const clamped = Math.max(0, Math.min(100, newPosition));
		updateStop(id, { position: clamped });
		// Auto-sort after a short delay to allow user to finish typing
		setTimeout(() => {
			updateState({ stops: sortStops(state.stops) });
		}, 300);
	}
	
	// GradientBar handlers
	function handleStopClick(stopId: string) {
		updateState({ selectedStopId: stopId });
	}
	
	function handleStopDrag(stopId: string, position: number) {
		updateStop(stopId, { position: Math.round(position) });
	}
	
	function handleBarClick(position: number) {
		if (state.stops.length >= 6) return;
		const newStop = createStop('#ffffff', Math.round(position), 100);
		state.stops.push(newStop);
		stateVersion++; // Trigger effect re-run
		updateState({ selectedStopId: newStop.id });
		// Sort after delay
		setTimeout(() => {
			updateState({ stops: sortStops(state.stops) });
		}, 300);
	}
	
	function handleStopRemoveFromBar(stopId: string) {
		if (state.stops.length <= 2) return;
		updateState({ 
			stops: state.stops.filter((s: ColorStop) => s.id !== stopId),
			selectedStopId: state.selectedStopId === stopId ? null : state.selectedStopId
		});
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (!state.selectedStopId) return;
		const selectedStop = state.stops.find((s: ColorStop) => s.id === state.selectedStopId);
		if (!selectedStop) return;
		
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			const delta = e.shiftKey ? 5 : 1;
			const direction = e.key === 'ArrowLeft' ? -delta : delta;
			const newPosition = Math.max(0, Math.min(100, selectedStop.position + direction));
			updateStop(selectedStop.id, { position: newPosition });
		} else if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			handleStopRemoveFromBar(selectedStop.id);
		}
	}
	
	// Apply gradient to background with animation
	let animationFrameId: number | null = null;
	
	$effect(() => {
		if (typeof document === 'undefined' || !browser) return;
		
		// Track state version to force reactivity
		const _ = stateVersion;
		
		const root = document.documentElement;
		
		// Cancel previous animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		
		if (state.applyToBackground) {
			root.classList.add('gradient-background');
			
			if (state.animate) {
				// Start animation - rebuild gradient string on every frame with current state
				let startTime = performance.now();
				const animationSpeed = state.animationSpeed ?? 50;
				const speed = Math.max(3, Math.min(60, (100 - animationSpeed) / 1.75 + 3));
				const duration = speed * 1000;
				
				const animateGradient = (currentTime: number) => {
					const elapsed = currentTime - startTime;
					const progress = (elapsed % duration) / duration;
					let animatedGradient = '';
					
					if (state.type === 'linear') {
						// For linear: animate background-position with large background-size
						const stopsStr = state.stops
							.map((s: ColorStop) => {
								const opacity = s.opacity / 100;
								return opacity < 1 ? `${s.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} ${s.position}%` : `${s.color} ${s.position}%`;
							})
							.join(', ');
						
						animatedGradient = `linear-gradient(${state.angle}deg, ${stopsStr})`;
						
						// Animate position: 0% -> 100% -> 0% (back and forth)
						const xPos = progress < 0.5 ? progress * 200 : (1 - progress) * 200;
						
						// Set gradient on body to avoid affecting header/footer
						const body = document.body;
						body.style.setProperty('background', `linear-gradient(${state.angle}deg, ${stopsStr})`, 'important');
						body.style.setProperty('background-size', '400% 400%', 'important');
						body.style.setProperty('background-position', `${xPos}% 50%`, 'important');
						body.classList.add('has-linear-gradient');
						
						// Don't set via CSS variable for linear
						root.style.removeProperty('--app-gradient');

					} else if (state.type === 'radial') {
						// Reset direct background properties for radial
						document.body.style.removeProperty('background');
						document.body.style.removeProperty('background-size');
						document.body.style.removeProperty('background-position');
						document.body.classList.remove('has-linear-gradient');
						
						// For radial, animate position
						const x = state.radialPosition === 'custom' ? state.radialX : 50;
						const y = state.radialPosition === 'custom' ? state.radialY : 50;
						const animatedX = x + Math.sin(progress * Math.PI * 2) * 20;
						const animatedY = y + Math.cos(progress * Math.PI * 2) * 20;
						const stopsStr = state.stops
							.map((s: ColorStop) => {
								const opacity = s.opacity / 100;
								return opacity < 1 ? `${s.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} ${s.position}%` : `${s.color} ${s.position}%`;
							})
							.join(', ');
						animatedGradient = `radial-gradient(${state.radialShape} at ${animatedX}% ${animatedY}%, ${stopsStr})`;
					} else if (state.type === 'conic') {
						// Reset direct background properties for conic
						document.body.style.removeProperty('background');
						document.body.style.removeProperty('background-size');
						document.body.style.removeProperty('background-position');
						document.body.classList.remove('has-linear-gradient');
						
						// Animate angle for conic gradient
						const animatedAngle = state.angle + (progress * 360);
						const stopsStr = state.stops
							.map((s: ColorStop) => {
								const opacity = s.opacity / 100;
								return opacity < 1 ? `${s.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} ${s.position}%` : `${s.color} ${s.position}%`;
							})
							.join(', ');
						animatedGradient = `conic-gradient(from ${animatedAngle}deg at ${state.conicX}% ${state.conicY}%, ${stopsStr})`;
					}
					
					if (state.type !== 'linear') {
						root.style.setProperty('--app-gradient', animatedGradient);
					}
					
					animationFrameId = requestAnimationFrame(animateGradient);
				};
				
				animationFrameId = requestAnimationFrame(animateGradient);
			} else {
				// Static gradient (no animation)
				const gradient = buildGradientString(state);
				
				if (state.type === 'linear') {
					// For linear, set on body with !important
					document.body.style.setProperty('background', gradient, 'important');
					document.body.style.setProperty('background-size', 'cover', 'important');
					document.body.classList.add('has-linear-gradient');
					root.style.removeProperty('--app-gradient');
				} else {
					// For radial/conic, use CSS variable
					document.body.style.removeProperty('background');
					document.body.style.removeProperty('background-size');
					document.body.classList.remove('has-linear-gradient');
					root.style.setProperty('--app-gradient', gradient);
				}
			}
		} else {
			root.style.removeProperty('--app-gradient');
			root.classList.remove('gradient-background');
			document.body.style.removeProperty('background');
			document.body.style.removeProperty('background-size');
			document.body.style.removeProperty('background-position');
			document.body.classList.remove('has-linear-gradient');
		}
		
		// Cleanup on unmount or when effect re-runs
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
			document.body.style.removeProperty('background');
			document.body.style.removeProperty('background-size');
			document.body.style.removeProperty('background-position');
			document.body.classList.remove('has-linear-gradient');
		};
	});
</script>

<svelte:head>
	<title>{tStringReactive('cssGradientGenerator.title', $locale)}</title>
	<meta name="description" content={tStringReactive('cssGradientGenerator.description', $locale)} />
	<meta property="og:title" content={tStringReactive('cssGradientGenerator.title', $locale)} />
	<meta property="og:description" content={tStringReactive('cssGradientGenerator.description', $locale)} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={currentUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={tStringReactive('cssGradientGenerator.title', $locale)} />
	<meta name="twitter:description" content={tStringReactive('cssGradientGenerator.description', $locale)} />
	<link rel="canonical" href={currentUrl} />
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "CSS Gradient Generator",
			"description": "${tStringReactive('cssGradientGenerator.description', $locale)}",
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
	<header class="mb-6 sm:mb-8">
		<div class="flex gap-3 mb-4">
			<div
				class="w-12 h-12 rounded-lg flex items-center justify-center"
				style="background-color: rgba(139, 111, 71, 0.1);"
			>
				<Palette class="w-6 h-6" style="color: var(--color-accent);" />
			</div>
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold mb-3">
					{tStringReactive('cssGradientGenerator.heading', $locale)}
				</h1>
				<p class="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl">
					{tStringReactive('cssGradientGenerator.subtitle', $locale)}
				</p>
			</div>
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Preview -->
		<div class="order-1">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">{tStringReactive('cssGradientGenerator.preview', $locale)}</h2>
				<label class="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
					<input
						type="checkbox"
						bind:checked={state.showCheckerboard}
						onchange={() => updateState({ showCheckerboard: state.showCheckerboard })}
						class="rounded border-[var(--color-border)]"
						style="accent-color: var(--color-accent);"
					/>
					<span>{tStringReactive('cssGradientGenerator.checkerboard', $locale)}</span>
				</label>
			</div>
			<div
				class="w-full h-64 rounded-lg border border-[var(--color-border)] {previewClass}"
				style={previewStyle()}
			></div>
		</div>

		<!-- Controls -->
		<div class="order-2">
			<div class="space-y-6">
				<!-- Presets Button -->
				<div>
					<button
						type="button"
						onclick={() => presetsSheetOpen = true}
						class="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-center gap-2 font-medium"
					>
						<Palette size={18} />
						{tStringReactive('cssGradientGenerator.presets', $locale)}
					</button>
				</div>

				<!-- Gradient Type -->
				<div>
					<label class="block text-sm font-medium mb-2">
						{tStringReactive('cssGradientGenerator.gradientType', $locale)}
					</label>
					<div class="flex gap-2">
						<button
							onclick={() => updateState({ type: 'linear' })}
							class="flex-1 px-3 py-2 rounded border transition-colors {state.type === 'linear' ? 'border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)]'}"
						>
							{tStringReactive('cssGradientGenerator.linear', $locale)}
						</button>
						<button
							onclick={() => updateState({ type: 'radial' })}
							class="flex-1 px-3 py-2 rounded border transition-colors {state.type === 'radial' ? 'border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)]'}"
						>
							{tStringReactive('cssGradientGenerator.radial', $locale)}
						</button>
						<button
							onclick={() => updateState({ type: 'conic' })}
							class="flex-1 px-3 py-2 rounded border transition-colors {state.type === 'conic' ? 'border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)]'}"
						>
							{tStringReactive('cssGradientGenerator.conic', $locale)}
						</button>
					</div>
				</div>

				<!-- Linear/Conic Angle -->
				{#if state.type === 'linear' || state.type === 'conic'}
					<div>
						<label class="block text-sm font-medium mb-2">
							{tStringReactive('cssGradientGenerator.angle', $locale)}
						</label>
						<div class="flex items-center gap-4">
							<input
								type="range"
								min="0"
								max="360"
								bind:value={state.angle}
								oninput={(e) => updateState({ angle: Number(e.currentTarget.value) })}
								class="flex-1"
								style="accent-color: var(--color-accent);"
							/>
							<input
								type="number"
								min="0"
								max="360"
								bind:value={state.angle}
								oninput={(e) => updateState({ angle: Number(e.currentTarget.value) })}
								class="w-20 px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
							/>
						</div>
					</div>
				{/if}

				<!-- Radial Controls -->
				{#if state.type === 'radial'}
					<div>
						<label class="block text-sm font-medium mb-2">
							{tStringReactive('cssGradientGenerator.radialShape', $locale)}
						</label>
						<div class="flex gap-2">
							<button
								onclick={() => updateState({ radialShape: 'circle' })}
								class="flex-1 px-3 py-2 rounded border transition-colors {state.radialShape === 'circle' ? 'border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)]'}"
							>
								{tStringReactive('cssGradientGenerator.circle', $locale)}
							</button>
							<button
								onclick={() => updateState({ radialShape: 'ellipse' })}
								class="flex-1 px-3 py-2 rounded border transition-colors {state.radialShape === 'ellipse' ? 'border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)]'}"
							>
								{tStringReactive('cssGradientGenerator.ellipse', $locale)}
							</button>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium mb-2">
							{tStringReactive('cssGradientGenerator.radialPosition', $locale)}
						</label>
						<select
							bind:value={state.radialPosition}
							onchange={(e) => updateState({ radialPosition: e.currentTarget.value as any })}
							class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
						>
							<option value="center">center</option>
							<option value="top">top</option>
							<option value="bottom">bottom</option>
							<option value="left">left</option>
							<option value="right">right</option>
							<option value="custom">{tStringReactive('cssGradientGenerator.custom', $locale)}</option>
						</select>
					</div>
					{#if state.radialPosition === 'custom'}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">X (%)</label>
								<input
									type="number"
									min="0"
									max="100"
									bind:value={state.radialX}
									oninput={(e) => updateState({ radialX: Number(e.currentTarget.value) })}
									class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
								/>
							</div>
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">Y (%)</label>
								<input
									type="number"
									min="0"
									max="100"
									bind:value={state.radialY}
									oninput={(e) => updateState({ radialY: Number(e.currentTarget.value) })}
									class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
								/>
							</div>
						</div>
					{/if}
				{/if}

				<!-- Conic Position -->
				{#if state.type === 'conic'}
					<div>
						<label class="block text-sm font-medium mb-2">
							{tStringReactive('cssGradientGenerator.conicPosition', $locale)}
						</label>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">X (%)</label>
								<input
									type="number"
									min="0"
									max="100"
									bind:value={state.conicX}
									oninput={(e) => updateState({ conicX: Number(e.currentTarget.value) })}
									class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
								/>
							</div>
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">Y (%)</label>
								<input
									type="number"
									min="0"
									max="100"
									bind:value={state.conicY}
									oninput={(e) => updateState({ conicY: Number(e.currentTarget.value) })}
									class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- Color Stops -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="block text-sm font-medium">
							{tStringReactive('cssGradientGenerator.colorStops', $locale)}
						</label>
						<div class="flex gap-2">
							<button
								onclick={resetStops}
								class="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-1"
								title="Reset"
							>
								<RotateCcw class="w-3 h-3" />
							</button>
							<button
								onclick={addStop}
								disabled={state.stops.length >= 6}
								class="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
							>
								<Plus class="w-3 h-3" />
								{tStringReactive('cssGradientGenerator.addStop', $locale)}
							</button>
						</div>
					</div>
					
					<!-- Gradient Bar -->
					<div class="mb-4">
						<GradientBar
							stops={state.stops}
							selectedStopId={state.selectedStopId || null}
							onStopClick={handleStopClick}
							onStopDrag={handleStopDrag}
							onBarClick={handleBarClick}
							onStopRemove={handleStopRemoveFromBar}
						/>
					</div>
					
					<div class="space-y-3">
						{#if state.selectedStopId}
							{#each sortStops(state.stops) as stop (stop.id)}
								{#if state.selectedStopId === stop.id}
									<div class="p-3 rounded border-2 border-[var(--color-accent)] bg-[var(--color-bg-secondary)]">
										<div class="flex items-start gap-3 mb-2">
											<div class="flex-1">
												<label class="block text-xs text-[var(--color-text-muted)] mb-1">
													{tStringReactive('cssGradientGenerator.color', $locale)}
												</label>
												<div class="flex items-center gap-2 relative">
													<button
														type="button"
														onclick={(e) => {
															e.stopPropagation();
															const rect = e.currentTarget.getBoundingClientRect();
															colorPickerOpen = {
																stopId: stop.id,
																position: { x: rect.left, y: rect.bottom + 8 }
															};
														}}
														class="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] cursor-pointer shadow-sm hover:shadow-md transition-shadow"
														style="background-color: {stop.color};"
														title={tStringReactive('cssGradientGenerator.color', $locale)}
													></button>
													<input
														type="text"
														value={stop.color}
														oninput={(e) => updateStop(stop.id, { color: e.currentTarget.value })}
														class="flex-1 px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] font-mono"
														placeholder="#000000"
													/>
													{#if colorPickerOpen?.stopId === stop.id}
														<div
															class="absolute z-50"
															style="left: 0; top: calc(100% + 8px);"
															onclick={(e) => e.stopPropagation()}
														>
															<ColorPicker
																color={stop.color}
																show={true}
																onchange={(newColor: string) => {
																	updateStop(stop.id, { color: newColor });
																}}
															/>
														</div>
													{/if}
												</div>
											</div>
											{#if state.stops.length > 2}
												<button
													onclick={() => handleStopRemoveFromBar(stop.id)}
													class="p-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors"
													title={tStringReactive('cssGradientGenerator.removeStop', $locale)}
												>
													<X class="w-4 h-4 text-[var(--color-text-muted)]" />
												</button>
											{/if}
										</div>
										<div class="grid grid-cols-2 gap-3">
											<div>
												<label class="block text-xs text-[var(--color-text-muted)] mb-1">
													{tStringReactive('cssGradientGenerator.position', $locale)} (%)
												</label>
												<input
													type="number"
													min="0"
													max="100"
													value={stop.position}
													oninput={(e) => handlePositionChange(stop.id, Number(e.currentTarget.value))}
													class="w-full px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
												/>
											</div>
											<div>
												<label class="block text-xs text-[var(--color-text-muted)] mb-1">
													{tStringReactive('cssGradientGenerator.opacity', $locale)} (%)
												</label>
												<input
													type="number"
													min="0"
													max="100"
													value={stop.opacity}
													oninput={(e) => updateStop(stop.id, { opacity: Number(e.currentTarget.value) })}
													class="w-full px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
												/>
											</div>
										</div>
									</div>
								{/if}
							{/each}
						{:else}
							<div class="p-4 text-center text-sm text-[var(--color-text-muted)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)]">
								Click on a color stop in the gradient bar above to edit it
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Background & Animation Controls -->
		<div class="order-3 lg:col-span-2">
			<div class="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-4">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={state.applyToBackground}
						onchange={() => updateState({ applyToBackground: state.applyToBackground })}
						class="rounded border-[var(--color-border)]"
						style="accent-color: var(--color-accent);"
					/>
					<span class="text-sm font-medium">Apply to app background</span>
				</label>
				
				{#if state.applyToBackground}
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={state.animate}
							onchange={() => updateState({ animate: state.animate })}
							class="rounded border-[var(--color-border)]"
							style="accent-color: var(--color-accent);"
						/>
						<span class="text-sm font-medium">Animate</span>
					</label>
					
					{#if state.animate}
						<div class="pl-6 space-y-3 border-l-2 border-[var(--color-border)]">
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">
									Speed: {Math.round(animationSpeedSeconds())}s per cycle
								</label>
								<input
									type="range"
									min="0"
									max="100"
									bind:value={state.animationSpeed}
									oninput={(e) => updateState({ animationSpeed: Number(e.currentTarget.value) })}
									class="w-full"
									style="accent-color: var(--color-accent);"
								/>
								<div class="text-xs text-[var(--color-text-muted)] mt-1">
									{#if state.type === 'linear' || state.type === 'conic'}
										Rotates gradient angle 360°
									{:else if state.type === 'radial'}
										Moves gradient center in a circle
									{/if}
								</div>
							</div>
							
							<div>
								<label class="block text-xs text-[var(--color-text-muted)] mb-1">
									Easing
								</label>
								<select
									bind:value={state.animationEasing}
									onchange={(e) => updateState({ animationEasing: e.currentTarget.value as any })}
									class="w-full px-3 py-1.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-[var(--color-text)]"
								>
									<option value="linear">Linear</option>
									<option value="ease">Ease</option>
									<option value="ease-in">Ease In</option>
									<option value="ease-out">Ease Out</option>
									<option value="ease-in-out">Ease In Out</option>
								</select>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Output -->
		<div class="order-4 lg:col-span-2">
			<div class="mb-4">
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-semibold">{tStringReactive('cssGradientGenerator.output', $locale)}</h2>
				</div>
				<div class="mb-3">
					<label class="block text-sm font-medium mb-2">
						{tStringReactive('cssGradientGenerator.outputMode', $locale)}
					</label>
					<select
						bind:value={state.outputMode}
						onchange={(e) => updateState({ outputMode: e.currentTarget.value as any })}
						class="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
					>
						<option value="background">{tStringReactive('cssGradientGenerator.background', $locale)}</option>
						<option value="background-image">{tStringReactive('cssGradientGenerator.backgroundImage', $locale)}</option>
						<option value="css-variable">{tStringReactive('cssGradientGenerator.cssVariable', $locale)}</option>
						<option value="with-fallback">{tStringReactive('cssGradientGenerator.withFallback', $locale)}</option>
					</select>
				</div>
			</div>
			<div class="relative">
				<pre
					class="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm font-mono text-[var(--color-text)] overflow-x-auto whitespace-pre-wrap"
				><code>{outputCss}</code></pre>
				<button
					onclick={() => copyToClipboard(outputCss, 'main')}
					class="absolute top-2 right-2 p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors"
					title={tStringReactive('cssGradientGenerator.copy', $locale)}
				>
					{#if copiedId === 'main'}
						<Check class="w-4 h-4 text-[var(--color-success)]" />
					{:else}
						<Copy class="w-4 h-4 text-[var(--color-text-muted)]" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- About Section -->
	<div class="mt-12 pt-8 border-t border-[var(--color-border)]">
		<div class="max-w-3xl space-y-6">
			<div>
				<h2 class="text-xl font-semibold mb-3">
					{tStringReactive('cssGradientGenerator.whatIs', $locale)}
				</h2>
				<p class="text-[var(--color-text-muted)] leading-relaxed">
					{tStringReactive('cssGradientGenerator.whatIsDescription', $locale)}
				</p>
			</div>

			<div>
				<h3 class="text-lg font-semibold mb-3">
					{tStringReactive('cssGradientGenerator.whenToUse', $locale)}
				</h3>
				<p class="text-[var(--color-text-muted)] leading-relaxed">
					{tStringReactive('cssGradientGenerator.whenToUse1', $locale)}
				</p>
			</div>

			<div>
				<h3 class="text-lg font-semibold mb-3">
					{tStringReactive('cssGradientGenerator.commonMistakes', $locale)}
				</h3>
				<p class="text-[var(--color-text-muted)] leading-relaxed">
					{tStringReactive('cssGradientGenerator.commonMistakes1', $locale)}
				</p>
			</div>

			<div>
				<h3 class="text-lg font-semibold mb-3">
					{tStringReactive('cssGradientGenerator.notes', $locale)}
				</h3>
				<p class="text-[var(--color-text-muted)] leading-relaxed">
					{tStringReactive('cssGradientGenerator.notes1', $locale)}
				</p>
			</div>

			<div class="pt-4 border-t border-[var(--color-border)]">
				<p class="text-sm text-[var(--color-text-muted)]">
					<strong>{tStringReactive('cssGradientGenerator.privacy', $locale)}:</strong>
					{tStringReactive('cssGradientGenerator.privacyText', $locale)}
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Click outside to close color picker -->
{#if colorPickerOpen}
	<div
		class="fixed inset-0 z-40"
		onclick={() => colorPickerOpen = null}
		ontouchstart={() => colorPickerOpen = null}
	></div>
{/if}

<!-- Presets Sheet -->
<Sheet bind:open={presetsSheetOpen} onClose={() => presetsSheetOpen = false} title={tStringReactive('cssGradientGenerator.presets', $locale)}>
	{#snippet children()}
		<div class="grid grid-cols-2 gap-4">
			{#each presets as preset}
				<button
					type="button"
					onclick={() => {
						applyPreset(preset);
						presetsSheetOpen = false;
					}}
					class="group relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all hover:scale-105"
				>
					<!-- Gradient Preview -->
					<div
						class="absolute inset-0"
						style="background: {buildGradientString({
							...state,
							type: preset.type,
							angle: preset.angle ?? 90,
							radialShape: preset.radialShape ?? 'ellipse',
							radialPosition: preset.radialPosition ?? 'center',
							radialX: preset.radialX ?? 50,
							radialY: preset.radialY ?? 50,
							conicX: preset.conicX ?? 50,
							conicY: preset.conicY ?? 50,
							stops: preset.stops.map(s => createStop(s.color, s.position, s.opacity))
						})};"
					></div>
					
					<!-- Name Overlay -->
					<div class="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-2">
						<p class="text-xs font-medium text-white text-center truncate">
							{preset.name}
						</p>
					</div>
				</button>
			{/each}
		</div>
	{/snippet}
</Sheet>
