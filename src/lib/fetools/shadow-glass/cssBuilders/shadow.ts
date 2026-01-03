import type { ShadowLayer, ShadowState } from '../types';

export function buildBoxShadow(layers: ShadowLayer[]): string {
	return layers
		.map((layer) => {
			const color = layer.color.startsWith('#')
				? `${layer.color}${Math.round((layer.opacity / 100) * 255)
						.toString(16)
						.padStart(2, '0')}`
				: layer.color;
			const inset = layer.inset ? 'inset ' : '';
			return `${inset}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${color}`;
		})
		.join(', ');
}

export function buildDropShadow(layers: ShadowLayer[]): string {
	return layers
		.map((layer) => {
			const color = layer.color.startsWith('#')
				? `${layer.color}${Math.round((layer.opacity / 100) * 255)
						.toString(16)
						.padStart(2, '0')}`
				: layer.color;
			return `drop-shadow(${layer.x}px ${layer.y}px ${layer.blur}px ${color})`;
		})
		.join(' ');
}

export function generateShadowCSS(state: ShadowState, outputMode: 'standard' | 'css-variable' = 'standard'): string {
	const layers = state.layers;
	
	if (layers.length === 0) {
		return outputMode === 'css-variable'
			? ':root {\n  --shadow: none;\n}\n\n.card {\n  box-shadow: var(--shadow);\n}'
			: 'box-shadow: none;';
	}

	if (state.type === 'box-shadow') {
		const cssValue = buildBoxShadow(layers);
		if (outputMode === 'css-variable') {
			return `:root {\n  --shadow: ${cssValue};\n}\n\n.card {\n  box-shadow: var(--shadow);\n}`;
		}
		return `box-shadow: ${cssValue};`;
	} else {
		const cssValue = buildDropShadow(layers);
		if (outputMode === 'css-variable') {
			return `:root {\n  --shadow: ${cssValue};\n}\n\n.card {\n  filter: var(--shadow);\n}`;
		}
		return `filter: ${cssValue};`;
	}
}

export function generateTailwindValues(state: ShadowState): string {
	if (state.layers.length === 0) return 'No shadow';
	
	return state.layers
		.map((layer, i) => {
			if (state.type === 'box-shadow') {
				return `Layer ${i + 1}: ${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgba(${hexToRgb(layer.color)}, ${(layer.opacity / 100).toFixed(2)})${layer.inset ? ' inset' : ''}`;
			} else {
				return `Layer ${i + 1}: ${layer.x}px ${layer.y}px ${layer.blur}px rgba(${hexToRgb(layer.color)}, ${(layer.opacity / 100).toFixed(2)})`;
			}
		})
		.join('\n');
}

function hexToRgb(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

export function applyPreset(state: ShadowState, preset: 'subtle' | 'medium' | 'strong' | 'neon'): ShadowState {
	const presets: Record<string, Partial<ShadowLayer>> = {
		subtle: {
			x: 0,
			y: 1,
			blur: 3,
			spread: 0,
			opacity: 10,
			color: '#000000',
			inset: false
		},
		medium: {
			x: 0,
			y: 4,
			blur: 12,
			spread: 0,
			opacity: 15,
			color: '#000000',
			inset: false
		},
		strong: {
			x: 0,
			y: 8,
			blur: 24,
			spread: 0,
			opacity: 25,
			color: '#000000',
			inset: false
		},
		neon: {
			x: 0,
			y: 0,
			blur: 20,
			spread: 0,
			opacity: 80,
			color: '#00ffff',
			inset: false
		}
	};

	const presetData = presets[preset];
	if (!presetData) return state;

	const firstLayer = state.layers[0];
	if (!firstLayer) return state;

	return {
		...state,
		layers: [
			{ ...firstLayer, ...presetData },
			...state.layers.slice(1)
		]
	};
}

