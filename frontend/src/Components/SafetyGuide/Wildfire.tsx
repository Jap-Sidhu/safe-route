import { Shield, Home, TreePine, AlertTriangle } from 'lucide-react';
import GuideLayout, { GuideSection } from './GuideLayout';
import { wildfireData } from './wildfireData';

function Wildfire() {
    const content = wildfireData;
    return (
        <GuideLayout
            kind="fire"
            title="Wildfires"
            lede="What the alert levels mean, how to get ready before a fire is near, and what to do if you have to leave or stay put."
        >
            <GuideSection label="01 · Alert levels" title="Know the difference">
                <div className="alert-levels">
                    {content.alerts.map((alert, i) => (
                        <div key={alert.type} className={`alert-level ${i === 0 ? 'order' : 'alert'}`}>
                            <span className="alert-level-tag mono">{i === 0 ? 'Leave now' : 'Get ready'}</span>
                            <h3>{alert.type}</h3>
                            <p>{alert.action}</p>
                        </div>
                    ))}
                </div>
            </GuideSection>

            <GuideSection label="02 · Before" title="General preparedness">
                <ul className="check-grid">
                    {content.preparation.map(item => (
                        <li key={item}><Shield size={18} /><span>{item}</span></li>
                    ))}
                </ul>
            </GuideSection>

            <GuideSection label="03 · Leaving" title="If you must evacuate">
                <ol className="steps-list">
                    {content.evacuation.map((step, i) => (
                        <li key={step}><span className="step-n mono">{i + 1}</span><span>{step}</span></li>
                    ))}
                </ol>
            </GuideSection>

            <GuideSection label="04 · Staying" title="If you don't evacuate (shelter in place)">
                <ul className="check-grid">
                    {content.shelter.map(item => (
                        <li key={item}><Home size={18} /><span>{item}</span></li>
                    ))}
                </ul>
            </GuideSection>

            <GuideSection label="05 · Outdoors" title="Hiking and camping">
                <ul className="check-grid">
                    {content.hiking.map(item => (
                        <li key={item}><TreePine size={18} /><span>{item}</span></li>
                    ))}
                </ul>
                <div className="danger-box">
                    <AlertTriangle size={20} />
                    <p><strong>Caught near a wildfire?</strong> Call 911 and report the fire to BC Wildfire Service
                        at <span className="mono">*5555</span> on a cell phone. Head for areas with little vegetation, water or rocky ground.
                        As a last resort, find low ground and cover yourself with dirt or a wool blanket.</p>
                </div>
            </GuideSection>
        </GuideLayout>
    );
}

export default Wildfire;
