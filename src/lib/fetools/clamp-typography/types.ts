export type ScaleRatio = 1.125 | 1.2 | 1.25 | 1.333 | 1.414 | 'custom';

export interface ClampTypographyState {
	viewport: {
		min: number;
		max: number;
	};
	typography: {
		min: number; // Body min
		max: number; // Body max
		base: number; // Body base
	};
	unit: 'px' | 'rem';
	preset: 'body' | 'small' | 'h1' | 'h2' | 'h3' | 'spacing' | null;
	mode: 'typography' | 'spacing';
	showScaleTable: boolean;
	scaleRatio: ScaleRatio;
	customRatio: number;
	includeSmall: boolean;
	spacingApplyTo: 'gap' | 'padding'; // For spacing mode preview
}

export interface TypographyLevel {
	level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small';
	min: number;
	max: number;
}

