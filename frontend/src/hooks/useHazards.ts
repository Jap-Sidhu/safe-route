import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

export interface DatasetMeta {
    updated_at: number;
    count: number;
}

export interface HealthStatus {
    fires: DatasetMeta | null;
    earthquakes: DatasetMeta | null;
}

// Poll /api/health so the top bar can show whether data is live and how fresh it is.
export function useHealth(intervalMs = 60_000) {
    const [status, setStatus] = useState<HealthStatus | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/health`);
                if (!res.ok) throw new Error(String(res.status));
                const body = await res.json();
                if (cancelled) return;
                setStatus({
                    fires: body.datasets?.['hazards:fires'] ?? null,
                    earthquakes: body.datasets?.['hazards:earthquakes'] ?? null,
                });
                setError(false);
            } catch {
                if (!cancelled) setError(true);
            }
        };
        load();
        const id = setInterval(load, intervalMs);
        return () => { cancelled = true; clearInterval(id); };
    }, [intervalMs]);

    return { status, error };
}

// Re-render on a timer so "updated 3 min ago" style labels stay current.
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}

export function timeAgo(ms: number, now: number): string {
    const s = Math.max(0, Math.round((now - ms) / 1000));
    if (s < 60) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 48) return `${h} h ago`;
    return `${Math.round(h / 24)} d ago`;
}
