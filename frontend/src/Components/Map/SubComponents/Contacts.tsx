import { useEffect, useRef } from 'react';
import { X, Siren, Flame, HeartPulse, Info } from 'lucide-react';
import './Contacts.css';

interface ContactsProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Contact {
    name: string;
    number: string;
    dial: string;     // what the phone actually dials
    note?: string;
}

// British Columbia numbers. 911 always comes first.
const GROUPS: { title: string; icon: typeof Siren; tone: string; contacts: Contact[] }[] = [
    {
        title: 'Immediate emergency',
        icon: Siren,
        tone: 'critical',
        contacts: [{ name: 'Police, fire, ambulance', number: '911', dial: '911', note: 'Life-threatening situations' }],
    },
    {
        title: 'Wildfire',
        icon: Flame,
        tone: 'fire',
        contacts: [
            { name: 'Report a wildfire (BC Wildfire Service)', number: '1-800-663-5555', dial: '18006635555' },
            { name: 'Report a wildfire from a cell phone', number: '*5555', dial: '*5555' },
        ],
    },
    {
        title: 'Health',
        icon: HeartPulse,
        tone: 'health',
        contacts: [
            { name: 'HealthLink BC (nurse line)', number: '8-1-1', dial: '811' },
            { name: 'BC Drug & Poison Information Centre', number: '1-800-567-8911', dial: '18005678911' },
        ],
    },
    {
        title: 'Support and information',
        icon: Info,
        tone: 'info',
        contacts: [
            { name: 'bc211 (community and disaster services)', number: '2-1-1', dial: '211' },
            { name: 'Canadian Red Cross', number: '1-800-418-1111', dial: '18004181111' },
        ],
    },
];

function Contacts({ isOpen, onClose }: ContactsProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const onClick = (e: MouseEvent) => { if (e.target === overlayRef.current) onClose(); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="contacts-overlay" ref={overlayRef}>
            <div className="contacts-modal" role="dialog" aria-modal="true" aria-labelledby="contacts-title">
                <header className="contacts-head">
                    <div>
                        <span className="eyebrow">British Columbia</span>
                        <h2 id="contacts-title">Emergency contacts</h2>
                    </div>
                    <button className="contacts-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
                </header>

                <div className="contacts-body">
                    {GROUPS.map(group => (
                        <section key={group.title} className={`contacts-group ${group.tone}`}>
                            <h3><group.icon size={16} /> {group.title}</h3>
                            {group.contacts.map(c => (
                                <a key={c.name} className="contact-row" href={`tel:${c.dial}`}>
                                    <span className="contact-text">
                                        <span className="contact-name">{c.name}</span>
                                        {c.note && <span className="contact-note">{c.note}</span>}
                                    </span>
                                    <span className="contact-number mono">{c.number}</span>
                                </a>
                            ))}
                        </section>
                    ))}
                </div>

                <footer className="contacts-foot">
                    In a life-threatening emergency, always call <b className="mono">911</b> first.
                    For evacuation orders, check <a href="https://www.emergencyinfobc.gov.bc.ca/" target="_blank" rel="noopener noreferrer">EmergencyInfoBC</a>.
                </footer>
            </div>
        </div>
    );
}

export default Contacts;
