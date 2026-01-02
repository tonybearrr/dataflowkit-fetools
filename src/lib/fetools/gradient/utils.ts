import type { GradientState, ColorStop, RadialPosition } from './types';


 // Normalize hex color to include alpha if opacity < 100
function hexWithAlpha(hex: string, opacity: number): string {
	if (opacity === 100) return hex;
	
	// Remove # if present
	let cleanHex = hex.replace('#', '');
	
	// Handle 3-digit hex
	if (cleanHex.length === 3) {
		cleanHex = cleanHex.split('').map(c => c + c).join('');
	}
	
	// Validate hex length
	if (cleanHex.length !== 6) {
		return hex; // Return original if invalid
	}
	
	// Convert to RGB
	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);
	
	// Convert opacity to 0-1
	const alpha = opacity / 100;
	
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function sortStops(stops: ColorStop[]): ColorStop[] {
	return [...stops].sort((a, b) => a.position - b.position);
}


 // Build gradient string based on type and state
export function buildGradientString(state: GradientState): string {
	const sortedStops = sortStops(state.stops);
	const stopStrings = sortedStops.map(stop => {
		const color = hexWithAlpha(stop.color, stop.opacity);
		return `${color} ${stop.position}%`;
	});

	switch (state.type) {
		case 'linear': {
			return `linear-gradient(${state.angle}deg, ${stopStrings.join(', ')})`;
		}
		
		case 'radial': {
			let position = '';
			if (state.radialPosition === 'custom') {
				position = `${state.radialX}% ${state.radialY}%`;
			} else {
				position = state.radialPosition;
			}
			return `radial-gradient(${state.radialShape} at ${position}, ${stopStrings.join(', ')})`;
		}
		
		case 'conic': {
			const parts: string[] = [];
			if (state.angle !== 0) {
				parts.push(`from ${state.angle}deg`);
			}
			if (state.conicX !== 50 || state.conicY !== 50) {
				parts.push(`at ${state.conicX}% ${state.conicY}%`);
			}
			const prefix = parts.length > 0 ? `${parts.join(' ')}, ` : '';
			return `conic-gradient(${prefix}${stopStrings.join(', ')})`;
		}
	}
}

export function getFallbackColor(state: GradientState): string {
	if (state.stops.length === 0) return '#ffffff';
	const firstStop = sortStops(state.stops)[0];
	return hexWithAlpha(firstStop.color, firstStop.opacity);
}

function generateAnimationKeyframes(state: GradientState): string {
	const sortedStops = sortStops(state.stops);
	const stopStrings = sortedStops.map(stop => {
		const color = hexWithAlpha(stop.color, stop.opacity);
		return `${color} ${stop.position}%`;
	}).join(', ');
	
	if (state.type === 'linear') {
		const startAngle = state.angle;
		const endAngle = state.angle + 360;
		return `@keyframes gradient-animation {
  0% {
    background: linear-gradient(${startAngle}deg, ${stopStrings});
  }
  100% {
    background: linear-gradient(${endAngle}deg, ${stopStrings});
  }
}`;
	} else if (state.type === 'radial') {
		const shape = state.radialShape;
		const baseX = state.radialPosition === 'custom' ? state.radialX : 50;
		const baseY = state.radialPosition === 'custom' ? state.radialY : 50;
		return `@keyframes gradient-animation {
  0% {
    background: radial-gradient(${shape} at ${baseX}% ${baseY}%, ${stopStrings});
  }
  25% {
    background: radial-gradient(${shape} at ${baseX + 20}% ${baseY}%, ${stopStrings});
  }
  50% {
    background: radial-gradient(${shape} at ${baseX}% ${baseY + 20}%, ${stopStrings});
  }
  75% {
    background: radial-gradient(${shape} at ${baseX - 20}% ${baseY}%, ${stopStrings});
  }
  100% {
    background: radial-gradient(${shape} at ${baseX}% ${baseY}%, ${stopStrings});
  }
}`;
	} else if (state.type === 'conic') {
		const startAngle = state.angle;
		const endAngle = state.angle + 360;
		const x = state.conicX;
		const y = state.conicY;
		return `@keyframes gradient-animation {
  0% {
    background: conic-gradient(from ${startAngle}deg at ${x}% ${y}%, ${stopStrings});
  }
  100% {
    background: conic-gradient(from ${endAngle}deg at ${x}% ${y}%, ${stopStrings});
  }
}`;
	}
	
	return '';
}


 // Generate CSS output based on mode
 
export function generateOutput(state: GradientState): string {
	const gradient = buildGradientString(state);
	const fallback = getFallbackColor(state);
	let css = '';
	
	// Base gradient CSS
	switch (state.outputMode) {
		case 'background':
			css = `background: ${gradient};`;
			break;
		
		case 'background-image':
			css = `background-image: ${gradient};`;
			break;
		
		case 'css-variable':
			css = `--gradient: ${gradient};\nbackground: var(--gradient);`;
			break;
		
		case 'with-fallback':
			css = `background: ${fallback};\nbackground: ${gradient};`;
			break;
		
		default:
			css = `background: ${gradient};`;
	}
	
	// Add animation CSS if enabled
	if (state.animate) {
		const speed = Math.round(Math.max(3, Math.min(60, (100 - (state.animationSpeed ?? 50)) / 1.75 + 3)));
		const easing = state.animationEasing || 'ease-in-out';
		const keyframes = generateAnimationKeyframes(state);
		
		css += `\nanimation: gradient-animation ${speed}s ${easing} infinite;`;
		css += `\n\n/* Keyframes */\n${keyframes}`;
	}
	
	return css;
}

