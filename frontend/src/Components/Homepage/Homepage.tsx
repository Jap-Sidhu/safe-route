import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Activity, Route, Satellite, Database, BookOpen } from 'lucide-react';
import { getHazards } from '../../api';
import { timeAgo, useNow } from '../../hooks/useHazards';
import type { FireData } from '../Map/SubComponents/WildfireFetch';
import './Homepage.css';

interface RawQuake {
    lat: number;
    lng: number;
    properties: { magnitude: number; depth: number; place: string; time: number; url: string; id: string };
}

interface Snapshot {
    fires: FireData[];
    quakes: RawQuake[];
    firesUpdated: number;
    quakesUpdated: number;
}

const osmLink = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=9/${lat}/${lng}`;

const fmtCoord = (lat: number, lng: number) =>
    `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;

// FIRMS reports date and time separately in UTC ("2026-10-29", "0930")
const firmsTime = (date: string, time: string) => {
    const t = time.padStart(4, '0');
    return Date.parse(`${date}T${t.slice(0, 2)}:${t.slice(2)}:00Z`);
};

function useSnapshot() {
    const [data, setData] = useState<Snapshot | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        Promise.all([getHazards<FireData>('fires'), getHazards<RawQuake>('earthquakes')])
            .then(([f, q]) => setData({ fires: f.data, quakes: q.data, firesUpdated: f.updated_at, quakesUpdated: q.updated_at }))
            .catch(() => setFailed(true));
    }, []);
    return { data, failed };
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'fire' | 'quake' }) {
    return (
        <div className={`stat ${tone ?? ''}`}>
            <span className="eyebrow">{label}</span>
            <span className="stat-value mono">{value}</span>
            <span className="stat-sub">{sub}</span>
        </div>
    );
}

function Homepage() {
    const { data, failed } = useSnapshot();
    const now = useNow();

    const stats = useMemo(() => {
        if (!data) return null;
        const highConf = data.fires.filter(f => f.properties.confidence === 'h').length;
        const quakes = [...data.quakes].sort((a, b) => b.properties.magnitude - a.properties.magnitude);
        const fires = [...data.fires].sort((a, b) => b.properties.fp - a.properties.fp);
        return {
            fireCount: data.fires.length,
            highConf,
            quakeCount: data.quakes.length,
            felt: data.quakes.filter(q => q.properties.magnitude >= 4).length,
            strongest: quakes[0],
            topQuakes: quakes.slice(0, 5),
            topFires: fires.slice(0, 5),
        };
    }, [data]);

    const dash = '—';

    return (
        <main className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-grid">
                    <div className="hero-copy">
                        <span className="eyebrow hero-eyebrow">Canada · live hazard picture</span>
                        <h1>Know what's burning and shaking. <span>Know the way out.</span></h1>
                        <p className="hero-lede">
                            SafeRoute combines NASA satellite fire detections and USGS earthquake data on one map,
                            refreshed every 10 minutes. Pick a fire and it ranks driving routes to the nearest
                            hospitals, emergency centres and towns.
                        </p>
                        <div className="hero-cta">
                            <Link to="/Map" className="btn btn-primary">Open the live map <ArrowRight size={18} /></Link>
                            <Link to="/SafetyGuide/Wildfire" className="btn btn-ghost"><BookOpen size={18} /> Safety guides</Link>
                        </div>
                    </div>

                    <aside className="board" aria-label="Current hazard status">
                        <div className="board-head">
                            <span className="eyebrow">Status board</span>
                            <span className="board-time mono">
                                {data ? `Updated ${timeAgo(Math.max(data.firesUpdated, data.quakesUpdated), now)}` : failed ? 'Unavailable' : 'Loading…'}
                            </span>
                        </div>
                        <div className="board-stats">
                            <Stat tone="fire" label="Fire detections" value={stats ? stats.fireCount.toLocaleString() : dash}
                                  sub={stats ? `${stats.highConf.toLocaleString()} high confidence · last 48 h` : 'Canada · last 48 h'} />
                            <Stat tone="quake" label="Earthquakes" value={stats ? stats.quakeCount.toLocaleString() : dash}
                                  sub={stats ? `${stats.felt} at M4.0+ · last 30 days` : 'North America · last 30 days'} />
                        </div>
                        <div className="board-strongest">
                            <span className="eyebrow">Strongest earthquake</span>
                            {stats?.strongest ? (
                                <a href={stats.strongest.properties.url} target="_blank" rel="noopener noreferrer" className="strongest">
                                    <span className="mag mono">M{stats.strongest.properties.magnitude.toFixed(1)}</span>
                                    <span className="strongest-text">
                                        <strong>{stats.strongest.properties.place}</strong>
                                        <span className="mono">{timeAgo(stats.strongest.properties.time, now)} · {stats.strongest.properties.depth.toFixed(0)} km deep</span>
                                    </span>
                                </a>
                            ) : (
                                <p className="board-empty">{failed ? 'Hazard feed is unavailable right now.' : 'Loading…'}</p>
                            )}
                        </div>
                        <Link to="/Map" className="board-link">View everything on the map <ArrowRight size={16} /></Link>
                    </aside>
                </div>
            </section>

            {/* Live tables */}
            <section className="section">
                <div className="section-inner tables">
                    <div className="table-card">
                        <div className="table-head">
                            <Activity size={18} className="quake-ico" />
                            <h2>Strongest earthquakes</h2>
                            <span className="eyebrow">30 days</span>
                        </div>
                        <ol className="rows">
                            {(stats?.topQuakes ?? []).map(q => (
                                <li key={q.properties.id}>
                                    <span className="row-badge quake mono">{q.properties.magnitude.toFixed(1)}</span>
                                    <span className="row-main">
                                        <a href={q.properties.url} target="_blank" rel="noopener noreferrer">{q.properties.place}</a>
                                        <span className="row-sub mono">{q.properties.depth.toFixed(0)} km deep · {timeAgo(q.properties.time, now)}</span>
                                    </span>
                                </li>
                            ))}
                            {!stats && <li className="rows-empty">{failed ? 'Unavailable' : 'Loading…'}</li>}
                        </ol>
                    </div>

                    <div className="table-card">
                        <div className="table-head">
                            <Flame size={18} className="fire-ico" />
                            <h2>Most intense fire detections</h2>
                            <span className="eyebrow">48 h</span>
                        </div>
                        <ol className="rows">
                            {(stats?.topFires ?? []).map((f, i) => (
                                <li key={`${f.lat},${f.lng},${i}`}>
                                    <span className="row-badge fire mono">{Math.round(f.properties.fp)}</span>
                                    <span className="row-main">
                                        <a href={osmLink(f.lat, f.lng)} target="_blank" rel="noopener noreferrer">{fmtCoord(f.lat, f.lng)}</a>
                                        <span className="row-sub mono">
                                            {f.properties.confidence === 'h' ? 'high' : 'nominal'} confidence · {timeAgo(firmsTime(f.properties.date, f.properties.time), now)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                            {!stats && <li className="rows-empty">{failed ? 'Unavailable' : 'Loading…'}</li>}
                        </ol>
                        <p className="table-note">Badge is fire radiative power in megawatts, a measure of how much heat the fire is giving off.</p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="section">
                <div className="section-inner">
                    <span className="eyebrow">How it works</span>
                    <h2 className="section-title">From satellite pass to a route out</h2>
                    <div className="steps">
                        <div className="step">
                            <Satellite size={22} />
                            <h3>Detect</h3>
                            <p>Two NASA VIIRS satellites spot heat on the ground. USGS seismometers report every earthquake across North America.</p>
                        </div>
                        <div className="step">
                            <Database size={22} />
                            <h3>Refresh</h3>
                            <p>Every 10 minutes the server pulls both feeds in parallel, filters out low-confidence points, and caches the result. The map never waits on NASA.</p>
                        </div>
                        <div className="step">
                            <Route size={22} />
                            <h3>Route</h3>
                            <p>Click a fire to find nearby safe zones and compare car and heavy-vehicle routes by distance, drive time and safety score.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Disclaimer */}
            <section className="section">
                <div className="section-inner">
                    <div className="notice">
                        <strong>SafeRoute is not an emergency alert system.</strong>
                        <p>Heat detections can be hours old and include things like controlled burns. Routes don't know about road closures.
                            Always follow evacuation orders from <a href="https://www.emergencyinfobc.gov.bc.ca/" target="_blank" rel="noopener noreferrer">EmergencyInfoBC</a> and
                            local authorities. In an emergency, call <span className="mono">911</span>.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Homepage;
