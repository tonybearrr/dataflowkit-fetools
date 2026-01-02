export type GradientType = 'linear' | 'radial' | 'conic';

export type RadialShape = 'circle' | 'ellipse';

export type RadialPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom';

export type OutputMode = 'background' | 'background-image' | 'css-variable' | 'with-fallback';

export type AnimationEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface ColorStop {
	id: string;
	color: string;
	position: number;
	opacity: number;
}

export interface GradientState {
	type: GradientType;
	angle: number;
	radialShape: RadialShape;
	radialPosition: RadialPosition;
	radialX: number;
	radialY: number;
	conicX: number;
	conicY: number; 
	stops: ColorStop[];
	outputMode: OutputMode;
	showCheckerboard: boolean;
	applyToBackground?: boolean;
	animate?: boolean;
	animationSpeed?: number;
	animationEasing?: AnimationEasing;
	selectedStopId?: string | null;
}

export interface GradientPreset {
	name: string;
	type: GradientType;
	angle?: number;
	radialShape?: RadialShape;
	radialPosition?: RadialPosition;
	radialX?: number;
	radialY?: number;
	conicX?: number;
	conicY?: number;
	stops: Omit<ColorStop, 'id'>[];
}

