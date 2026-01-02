import type { GradientState } from './types';

const STORAGE_KEY = 'fe-tools.gradient-generator';

export function loadState(): Partial<GradientState> | null {
	if (typeof window === 'undefined') return null;
	
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return null;
	
	try {
		return JSON.parse(stored);
	} catch {
		return null;
	}
}

export function saveState(state: GradientState): void {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save gradient state:', error);
	}
}

