export type ShadowType = 'box-shadow' | 'drop-shadow';

export interface ShadowLayer {
	id: string;
	x: number;
	y: number;
	blur: number;
	spread: number; // Only for box-shadow
	opacity: number;
	color: string;
	inset: boolean; // Only for box-shadow
}

export interface ShadowState {
	type: ShadowType;
	layers: ShadowLayer[];
	useAngleMode: boolean;
	angle: number;
	distance: number;
	preset: 'subtle' | 'medium' | 'strong' | 'neon' | null;
	previewBackground: 'light' | 'dark';
	showGrid: boolean;
}

export interface GlassState {
	blur: number;
	tintColor: string;
	tintOpacity: number;
	backgroundBrightness: number;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	shadow: {
		x: number;
		y: number;
		blur: number;
		opacity: number;
	};
	noiseEnabled: boolean;
	customBackground: string;
	customTextColor: string;
}

export interface ShadowGlassState {
	activeTab: 'shadow' | 'glass';
	shadow: ShadowState;
	glass: GlassState;
}

