import type { ShadowGlassState } from './types';

const STORAGE_KEY = 'fe-tools.shadow-glass.v1';

export function loadState(): ShadowGlassState | null {
	if (typeof window === 'undefined') return null;
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		
		const parsed = JSON.parse(stored);
		return parsed as ShadowGlassState;
	} catch (e) {
		console.error('Failed to load shadow-glass state:', e);
		return null;
	}
}

export function saveState(state: ShadowGlassState): void {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save shadow-glass state:', e);
	}
}

