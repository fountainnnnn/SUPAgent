declare const __API_BASE__: string;

/** Absolute prefix for all /api/* calls. Empty string in dev (Vite proxies). Set VITE_API_BASE for production. */
export const API_BASE: string = (typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
