// Base URL of the SafeRoute API. Empty means same origin (Flask serves the built app,
// and the Vite dev server proxies /api to Flask).
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

export interface HazardPayload<T> {
    updated_at: number;
    count: number;
    data: T[];
}

export async function getHazards<T>(kind: 'fires' | 'earthquakes'): Promise<HazardPayload<T>> {
    const res = await fetch(`${API_BASE}/api/hazards/${kind}`);
    if (!res.ok) throw new Error(`Hazard API returned ${res.status}`);
    return res.json();
}

// safezone.js is a plain script in /public, so it reads the base URL from window.
declare global {
    interface Window { SAFEROUTE_API?: string }
}
window.SAFEROUTE_API = API_BASE;
