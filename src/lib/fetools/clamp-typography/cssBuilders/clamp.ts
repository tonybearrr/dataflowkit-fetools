import type { ClampTypographyState, TypographyLevel } from '../types';

export function generateClampCSS(
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const { viewport, typography, unit } = state;
	
	// Prevent division by zero
	if (viewport.max <= viewport.min) {
		const minValue = formatValue(typography.min, unit, remBase);
		const maxValue = formatValue(typography.max, unit, remBase);
		return `clamp(${minValue}, ${minValue}, ${maxValue})`;
	}

	const minVW = viewport.min;
	const maxVW = viewport.max;
	const minSize = typography.min;
	const maxSize = typography.max;

	const minValue = formatValue(minSize, unit, remBase);
	const maxValue = formatValue(maxSize, unit, remBase);
	
	// Calculate the fluid formula
	// clamp(min, calc(min + (max - min) * ((100vw - minVW) / (maxVW - minVW))), max)
	const sizeDiff = maxSize - minSize;
	const vwDiff = maxVW - minVW;
	
	// Build the calc expression with proper unit handling
	const sizeDiffValue = formatValue(sizeDiff, unit, remBase);
	const calcExpression = `calc(${minValue} + ${sizeDiffValue} * ((100vw - ${minVW}px) / ${vwDiff}))`;
	
	return `clamp(${minValue}, ${calcExpression}, ${maxValue})`;
}

export function generateClampVariable(
	state: ClampTypographyState,
	variableName: string = '--fluid-size',
	remBase: number = 16
): string {
	const clampValue = generateClampCSS(state, remBase);
	return `:root {\n  ${variableName}: ${clampValue};\n}\n\n.element {\n  font-size: var(${variableName});\n}`;
}

export function formatValue(value: number, unit: 'px' | 'rem', remBase: number = 16): string {
	// Limit precision to 4 decimals
	const rounded = Math.round(value * 10000) / 10000;
	
	if (unit === 'rem') {
		const remValue = rounded / remBase;
		return `${Math.round(remValue * 10000) / 10000}rem`;
	}
	return `${rounded}px`;
}

/**
 * Calculate the actual font size value for a specific viewport width
 * This is used for preview purposes where I need to simulate clamp() behavior
 */
export function calculateSizeForViewport(
	viewportWidth: number,
	state: ClampTypographyState,
	remBase: number = 16
): number {
	const { viewport, typography } = state;
	const { min: minVW, max: maxVW } = viewport;
	const { min: minSize, max: maxSize } = typography;
	
	// Clamp to viewport range
	if (viewportWidth <= minVW) {
		return minSize;
	}
	if (viewportWidth >= maxVW) {
		return maxSize;
	}
	
	// Calculate interpolated value
	const sizeDiff = maxSize - minSize;
	const vwDiff = maxVW - minVW;
	const progress = (viewportWidth - minVW) / vwDiff;
	
	return minSize + sizeDiff * progress;
}


 //Format the calculated size value with proper unit
export function formatSizeForViewport(
	viewportWidth: number,
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const size = calculateSizeForViewport(viewportWidth, state, remBase);
	return formatValue(size, state.unit, remBase);
}

export function applyPreset(
	preset: 'body' | 'small' | 'h1' | 'h2' | 'h3' | 'spacing',
	mode: 'typography' | 'spacing'
): Partial<ClampTypographyState> {
	const presets = {
		body: {
			typography: { min: 14, max: 18, base: 16 },
			viewport: { min: 320, max: 1440 }
		},
		small: {
			typography: { min: 12, max: 14, base: 14 },
			viewport: { min: 320, max: 1440 }
		},
		h1: {
			typography: { min: 28, max: 48, base: 36 },
			viewport: { min: 320, max: 1440 }
		},
		h2: {
			typography: { min: 24, max: 36, base: 30 },
			viewport: { min: 320, max: 1440 }
		},
		h3: {
			typography: { min: 20, max: 28, base: 24 },
			viewport: { min: 320, max: 1440 }
		},
		spacing: {
			typography: { min: 8, max: 24, base: 16 },
			viewport: { min: 320, max: 1440 }
		}
	};

	const presetData = presets[preset];
	
	if (mode === 'spacing' && preset !== 'spacing') {
		return {
			typography: {
				min: presetData.typography.min * 0.5,
				max: presetData.typography.max * 0.5,
				base: presetData.typography.base * 0.5
			},
			viewport: presetData.viewport,
			preset: 'spacing' as const
		};
	}

	return {
		typography: presetData.typography,
		viewport: presetData.viewport,
		preset
	};
}

export function getRatioValue(state: ClampTypographyState): number {
	if (state.scaleRatio === 'custom') {
		return Math.max(1.05, Math.min(2, state.customRatio));
	}
	return state.scaleRatio;
}

/**
 * Calculate typography levels based on Body and ratio
 * H6 = Body * R^0, H5 = Body * R^1, ..., H1 = Body * R^5
 * Small = Body / R
 */
export function calculateTypographyLevels(state: ClampTypographyState): TypographyLevel[] {
	const ratio = getRatioValue(state);
	const bodyMin = state.typography.min;
	const bodyMax = state.typography.max;
	
	const levels: TypographyLevel[] = [];
	
	// H1 through H6 (exponents 5 down to 0)
	for (let exp = 5; exp >= 0; exp--) {
		const levelName = `h${6 - exp}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
		const ratioPower = Math.pow(ratio, exp);
		levels.push({
			level: levelName,
			min: bodyMin * ratioPower,
			max: bodyMax * ratioPower
		});
	}
	
	// Body
	levels.push({
		level: 'body',
		min: bodyMin,
		max: bodyMax
	});
	
	// Small (if enabled)
	if (state.includeSmall) {
		levels.push({
			level: 'small',
			min: bodyMin / ratio,
			max: bodyMax / ratio
		});
	}
	
	return levels;
}

/**
 * Generate clamp() CSS for a specific typography level
 */
export function generateClampForLevel(
	level: TypographyLevel,
	viewport: { min: number; max: number },
	unit: 'px' | 'rem',
	remBase: number = 16
): string {
	if (viewport.max <= viewport.min) {
		const minValue = formatValue(level.min, unit, remBase);
		const maxValue = formatValue(level.max, unit, remBase);
		return `clamp(${minValue}, ${minValue}, ${maxValue})`;
	}
	
	const minVW = viewport.min;
	const maxVW = viewport.max;
	const minSize = level.min;
	const maxSize = level.max;
	
	const minValue = formatValue(minSize, unit, remBase);
	const maxValue = formatValue(maxSize, unit, remBase);
	
	const sizeDiff = maxSize - minSize;
	const vwDiff = maxVW - minVW;
	const sizeDiffValue = formatValue(sizeDiff, unit, remBase);
	const calcExpression = `calc(${minValue} + ${sizeDiffValue} * ((100vw - ${minVW}px) / ${vwDiff}))`;
	
	return `clamp(${minValue}, ${calcExpression}, ${maxValue})`;
}

/**
 * Generate full typography scale CSS
 */
export function generateFullScaleCSS(
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const levels = calculateTypographyLevels(state);
	const cssLines: string[] = [];
	
	for (const level of levels) {
		const clampValue = generateClampForLevel(level, state.viewport, state.unit, remBase);
		const selector = level.level === 'body' ? 'body' : level.level;
		cssLines.push(`${selector} {\n  font-size: ${clampValue};\n}`);
	}
	
	return cssLines.join('\n\n');
}

/**
 * Generate full typography scale as CSS variables
 */
export function generateFullScaleVariables(
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const levels = calculateTypographyLevels(state);
	const variables: string[] = [];
	
	for (const level of levels) {
		const clampValue = generateClampForLevel(level, state.viewport, state.unit, remBase);
		const varName = `--fs-${level.level}`;
		variables.push(`  ${varName}: ${clampValue};`);
	}
	
	return `:root {\n${variables.join('\n')}\n}\n\n/* Usage */\nh1 { font-size: var(--fs-h1); }\nh2 { font-size: var(--fs-h2); }\nh3 { font-size: var(--fs-h3); }\nh4 { font-size: var(--fs-h4); }\nh5 { font-size: var(--fs-h5); }\nh6 { font-size: var(--fs-h6); }\nbody { font-size: var(--fs-body); }${state.includeSmall ? '\nsmall { font-size: var(--fs-small); }' : ''}`;
}

/**
 * Calculate size for a specific level at a viewport width
 */
export function calculateLevelSizeForViewport(
	viewportWidth: number,
	level: TypographyLevel,
	viewport: { min: number; max: number }
): number {
	const { min: minVW, max: maxVW } = viewport;
	const { min: minSize, max: maxSize } = level;
	
	if (viewportWidth <= minVW) {
		return minSize;
	}
	if (viewportWidth >= maxVW) {
		return maxSize;
	}
	
	const sizeDiff = maxSize - minSize;
	const vwDiff = maxVW - minVW;
	const progress = (viewportWidth - minVW) / vwDiff;
	
	return minSize + sizeDiff * progress;
}

/**
 * Generate spacing token CSS variable
 */
export function generateSpacingToken(
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const clampValue = generateClampCSS(state, remBase);
	return `:root {\n  --space-fluid: ${clampValue};\n}`;
}

/**
 * Generate spacing token with usage examples
 */
export function generateSpacingTokenWithUsage(
	state: ClampTypographyState,
	remBase: number = 16
): string {
	const token = generateSpacingToken(state, remBase);
	return `${token}\n\n/* Usage */\n.stack {\n  gap: var(--space-fluid);\n}\n\n.card {\n  padding: calc(var(--space-fluid) * 1.5);\n}\n\n.section {\n  margin-bottom: var(--space-fluid);\n}`;
}

