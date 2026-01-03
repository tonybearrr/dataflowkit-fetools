import type { GlassState } from '../types';

export function generateGlassCSS(state: GlassState): string {
	const tintRgba = hexToRgba(state.tintColor, state.tintOpacity / 100);
	const borderRgba = hexToRgba(state.borderColor, state.borderOpacity / 100);
	const shadowRgba = hexToRgba('#000000', state.shadow.opacity / 100);
	
	const shadowValue = `${state.shadow.x}px ${state.shadow.y}px ${state.shadow.blur}px ${shadowRgba}`;
	
	let css = `.glass-panel {\n`;
	css += `  background: ${tintRgba};\n`;
	css += `  border: ${state.borderWidth}px solid ${borderRgba};\n`;
	css += `  backdrop-filter: blur(${state.blur}px);\n`;
	css += `  -webkit-backdrop-filter: blur(${state.blur}px);\n`;
	css += `  box-shadow: ${shadowValue};\n`;
	
	if (state.noiseEnabled) {
		css += `  position: relative;\n`;
		css += `}\n\n`;
		css += `.glass-panel::before {\n`;
		css += `  content: '';\n`;
		css += `  position: absolute;\n`;
		css += `  inset: 0;\n`;
		css += `  background-image: url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%270.05%27/%3E%3C/svg%3E");\n`;
		css += `  pointer-events: none;\n`;
		css += `  border-radius: inherit;\n`;
		css += `}`;
	} else {
		css += `}`;
	}
	
	return css;
}

function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export function getGlassPreviewStyle(state: GlassState): string {
	const tintRgba = hexToRgba(state.tintColor, state.tintOpacity / 100);
	const borderRgba = hexToRgba(state.borderColor, state.borderOpacity / 100);
	const shadowRgba = hexToRgba('#000000', state.shadow.opacity / 100);
	
	let style = `background: ${tintRgba}; `;
	style += `border: ${state.borderWidth}px solid ${borderRgba}; `;
	style += `backdrop-filter: blur(${state.blur}px); `;
	style += `-webkit-backdrop-filter: blur(${state.blur}px); `;
	style += `box-shadow: ${state.shadow.x}px ${state.shadow.y}px ${state.shadow.blur}px ${shadowRgba};`;
	
	return style;
}

