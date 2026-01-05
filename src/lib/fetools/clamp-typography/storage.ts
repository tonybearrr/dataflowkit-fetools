import type { ClampTypographyState } from './types';

const STORAGE_KEY = 'fe-tools.clamp-typography.v1';

export function loadState(): ClampTypographyState | null {
	if (typeof window === 'undefined') return null;
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		
		const parsed = JSON.parse(stored);
		if (
			parsed.viewport?.min && parsed.viewport?.max &&
			parsed.typography?.min && parsed.typography?.max && parsed.typography?.base &&
			typeof parsed.unit === 'string'
		) {
			return parsed as ClampTypographyState;
		}
	} catch (e) {
		console.error('Failed to load clamp typography state:', e);
	}
	
	return null;
}

export function saveState(state: ClampTypographyState): void {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save clamp typography state:', e);
	}
}

