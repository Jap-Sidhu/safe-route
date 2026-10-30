import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Activity, Phone } from 'lucide-react';
import './SafetyGuide.css';

interface GuideLayoutProps {
    kind: 'fire' | 'quake';
    title: string;
    lede: string;
    children: ReactNode;
}

export function GuideSection({ label, title, children }: { label: string; title: string; children: ReactNode }) {
    return (
        <section className="guide-section">
            <header className="guide-section-head">
                <span className="eyebrow">{label}</span>
                <h2>{title}</h2>
            </header>
            {children}
        </section>
    );
}

function GuideLayout({ kind, title, lede, children }: GuideLayoutProps) {
    return (
        <main className={`guide ${kind}`}>
            <header className="guide-hero">
                <div className="guide-hero-inner">
                    <div className="guide-tabs" role="tablist" aria-label="Safety guides">
                        <NavLink to="/SafetyGuide/Wildfire" className={({ isActive }) => `guide-tab fire ${isActive ? 'active' : ''}`}>
                            <Flame size={16} /> Wildfires
                        </NavLink>
                        <NavLink to="/SafetyGuide/Earthquake" className={({ isActive }) => `guide-tab quake ${isActive ? 'active' : ''}`}>
                            <Activity size={16} /> Earthquakes
                        </NavLink>
                    </div>
                    <span className="eyebrow guide-eyebrow">Emergency safety guide</span>
                    <h1>{title}</h1>
                    <p className="guide-lede">{lede}</p>
                    <div className="guide-callout">
                        <Phone size={18} />
                        <span>Life in danger? Call <strong className="mono">911</strong> first. Everything else can wait.</span>
                    </div>
                </div>
            </header>
            <div className="guide-body">{children}</div>
        </main>
    );
}

export default GuideLayout;
