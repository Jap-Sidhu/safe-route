import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { timeAgo, useHealth, useNow } from '../../hooks/useHazards';
import './TopBar.css';

const LINKS = [
    { to: '/', label: 'Overview', end: true },
    { to: '/Map', label: 'Live map', end: false },
    { to: '/SafetyGuide/Wildfire', label: 'Wildfire guide', end: false },
    { to: '/SafetyGuide/Earthquake', label: 'Earthquake guide', end: false },
];

// Data older than three refresh cycles means the feed has stalled.
const STALE_AFTER_MS = 30 * 60 * 1000;

export function Logo() {
    return (
        <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3 5 7.5v7.8C5 22 9.7 27 16 29c6.3-2 11-7 11-13.7V7.5z" fill="currentColor" />
            <path d="M10.5 17.5 14.5 21 21.5 12" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function LiveStatus() {
    const { status, error } = useHealth();
    const now = useNow();
    const latest = Math.max(status?.fires?.updated_at ?? 0, status?.earthquakes?.updated_at ?? 0);

    let state = 'down';
    let label = 'Feed offline';
    if (!error && status && latest) {
        state = now - latest > STALE_AFTER_MS ? 'stale' : 'live';
        label = `${state === 'live' ? 'Live' : 'Delayed'} · ${timeAgo(latest, now)}`;
    } else if (!error && !status) {
        state = 'stale';
        label = 'Connecting…';
    }

    return (
        <div className={`live-status ${state}`} title="When hazard data was last refreshed from NASA and USGS">
            <span className={`live-dot ${state === 'live' ? '' : state}`} />
            <span className="mono">{label}</span>
        </div>
    );
}

function TopBar() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    useEffect(() => setOpen(false), [pathname]);

    return (
        <header className="topbar">
            <div className="topbar-inner">
                <NavLink to="/" className="brand" aria-label="SafeRoute home">
                    <Logo />
                    <span className="brand-name">SafeRoute</span>
                    <span className="brand-tag mono">CA</span>
                </NavLink>

                <nav className={`topnav ${open ? 'open' : ''}`} aria-label="Main">
                    {LINKS.map(link => (
                        <NavLink key={link.to} to={link.to} end={link.end}
                                 className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="topbar-right">
                    <LiveStatus />
                    <button className="menu-btn" onClick={() => setOpen(o => !o)}
                            aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default TopBar;
