import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './SafetyGuide.css';
import Hamburger from '../Navigation/Hamburger';
import { earthquakeData } from './EarthquakeData';
import type { EarthquakeContentProps, ActionItem, SituationItem } from './EarthquakeData';

// earthquake Component
const EarthquakeContent: React.FC<EarthquakeContentProps> = ({ content }) => (
  <div className="earthquake-content">
    {/* Emergency Safety Guide Heading */}
    <div className="emergency-safety-heading">
      <h1 className="safety-guide-title">Emergency Safety Guide</h1>
      <div className="title-divider"></div>
      <h2 className="disaster-type">Earthquakes</h2>
    </div>
    
    {/* warning Signs */}
    <div className="glass-card">
      <h3 className="card-title">Warning Signs</h3>
      <div className="signs-grid">
        {content.signs.map((sign: string, index: number) => (
          <div key={index} className="sign-item">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span>{sign}</span>
          </div>
        ))}
      </div>
    </div>

    {/* key actions */}
    <div className="glass-card">
      <h3 className="card-title">Key Actions: DROP, COVER, HOLD ON</h3>
      <div className="actions-grid">
        {content.actions.map((action: ActionItem, index: number) => (
          <div key={index} className="action-card">
            <div className="action-icon"><action.icon /></div>
            <h4 className="action-title">{action.title}</h4>
            <p className="action-description">{action.description}</p>
          </div>
        ))}
      </div>
      <div className="important-note">
        <strong>Important:</strong> Count to 60 after shaking stops before moving. Stay alert for hazards and call 911 if there are injuries.
      </div>
    </div>

    {/* specific situations */}
    <div className="glass-card">
      <h3 className="card-title">Specific Situations</h3>
      <div className="situations-grid">
        {content.situations.map((situation: SituationItem, index: number) => (
          <div key={index} className="situation-card">
            <h4 className="situation-title">{situation.title}</h4>
            <ul className="situation-steps">
              {situation.steps.map((step: string, stepIndex: number) => (
                <li key={stepIndex}>{step}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface EarthquakePageProps {
    isSidebarActive: boolean;
    toggleSidebar: () => void;
}

// Main Earthquake Component 
const Earthquake: React.FC<EarthquakePageProps> = ({ isSidebarActive, toggleSidebar }) => {
    return (
        <div className="earthquake-page-container"> 
            <header className="header"> 
                <Hamburger
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={toggleSidebar}
                />
            </header>

            {/* Render the EarthquakeContent with the data */}
            <EarthquakeContent content={earthquakeData} />
        </div>
    );
};

export default Earthquake;
export { EarthquakeContent };