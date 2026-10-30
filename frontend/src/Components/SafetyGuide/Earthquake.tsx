import { AlertTriangle, Clock } from 'lucide-react';
import GuideLayout, { GuideSection } from './GuideLayout';
import { earthquakeData } from './EarthquakeData';

function Earthquake() {
    const content = earthquakeData;
    return (
        <GuideLayout
            kind="quake"
            title="Earthquakes"
            lede="BC sits on an active fault zone. Learn the warning signs, the three moves that protect you, and what to do wherever you are when it hits."
        >
            <GuideSection label="01 · Warning signs" title="What you might notice">
                <ul className="sign-row">
                    {content.signs.map(sign => (
                        <li key={sign}><AlertTriangle size={16} /><span>{sign}</span></li>
                    ))}
                </ul>
            </GuideSection>

            <GuideSection label="02 · When shaking starts" title="Drop, cover, hold on">
                <div className="dch">
                    {content.actions.map((action, i) => (
                        <div key={action.title} className="dch-card">
                            <span className="dch-n mono">{i + 1}</span>
                            <action.icon className="dch-icon" />
                            <h3>{action.title}</h3>
                            <p>{action.description}</p>
                        </div>
                    ))}
                </div>
                <div className="info-box">
                    <Clock size={20} />
                    <p><strong>After the shaking stops,</strong> count to 60 before you move. Watch for falling debris,
                        gas leaks and aftershocks, and call 911 if anyone is hurt.</p>
                </div>
            </GuideSection>

            <GuideSection label="03 · Where you are" title="Specific situations">
                <div className="situations">
                    {content.situations.map(situation => (
                        <div key={situation.title} className="situation">
                            <h3>{situation.title}</h3>
                            <ul>
                                {situation.steps.map(step => <li key={step}>{step}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </GuideSection>
        </GuideLayout>
    );
}

export default Earthquake;
