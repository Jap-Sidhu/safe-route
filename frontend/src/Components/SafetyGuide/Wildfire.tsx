import React from 'react';
import { Shield, Home, TreePine } from 'lucide-react';
import './SafetyGuide.css';
import Hamburger from '../Navigation/Hamburger';
import { wildfireData, type WildfireContentProps, type AlertItem } from './wildfireData';

// Wildfire Component
const WildfireContent: React.FC<WildfireContentProps> = ({ content }) => (
  <div className="wildfire-content">
    {/* Emergency Safety Guide Heading */}
    <div className="emergency-safety-heading">
      <h1 className="safety-guide-title">Emergency Safety Guide</h1>
      <div className="title-divider"></div>
      <h2 className="disaster-type">Wildfires</h2>
    </div>
    
    {/* evacuation alerts */}
    <div className="glass-card">
      <h3 className="card-title">Evacuation Alerts</h3>
      <div className="alerts-grid">
        {content.alerts.map((alert: AlertItem, index: number) => (
          <div key={index} className="alert-card">
            <div className="alert-type">{alert.type}</div>
            <div className="alert-action">{alert.action}</div>
          </div>
        ))}
      </div>
    </div>

    {/* preparation */}
    <div className="glass-card">
      <h3 className="card-title">General Preparedness</h3>
      <div className="prep-grid">
        {content.preparation.map((item: string, index: number) => (
          <div key={index} className="prep-item">
            <Shield className="w-4 h-4 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* if you must evacuate */}
    <div className="glass-card">
      <h3 className="card-title">If You Must Evacuate</h3>
      <div className="evacuation-steps">
        {content.evacuation.map((step: string, index: number) => (
          <div key={index} className="evacuation-step">
            <div className="step-number">{index + 1}</div>
            <div className="step-text">{step}</div>
          </div>
        ))}
      </div>
    </div>

    {/* shelter in place */}
    <div className="glass-card">
      <h3 className="card-title">If You Don't Evacuate (Shelter in Place)</h3>
      <div className="shelter-grid">
        {content.shelter.map((item: string, index: number) => (
          <div key={index} className="shelter-item">
            <Home className="w-4 h-4 text-secondary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* hiking/camping */}
    <div className="glass-card">
      <h3 className="card-title">Hiking & Camping Safety</h3>
      <div className="hiking-grid">
        {content.hiking.map((item: string, index: number) => (
          <div key={index} className="hiking-item">
            <TreePine className="w-4 h-4 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="danger-note">
        <strong>If caught in wildfire:</strong> Call emergency services, look for safe areas (minimal vegetation, water bodies, rocky terrain), and as last resort, find low terrain and cover yourself with dirt or wool.
      </div>
    </div>
  </div>
);

interface WildfirePageProps {
    isSidebarActive: boolean;
    toggleSidebar: () => void;
}

// Main Wildfire Export
const Wildfire: React.FC<WildfirePageProps> = ({ isSidebarActive, toggleSidebar }) => {
    return (
        <div className="wildfire-page-container"> 
            <header className="header">
                <Hamburger
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={toggleSidebar} 
                />
            </header>

            {/* Render the WildfireContent with the data */}
            <WildfireContent content={wildfireData} />
        </div>
    );
};

export default Wildfire;
export { WildfireContent };