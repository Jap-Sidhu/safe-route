// /src/Components/Homepage/Homepage.tsx

import { Link } from 'react-router-dom';
import './Homepage.css';

import Hamburger from '../Navigation/Hamburger';
import Clouds from "./Clouds/Clouds";
import Mountains from "./Mountains/Mountains";
import StatusBar from "./StatusBar/StatusBar";

interface PageProps {
    isSidebarActive: boolean;
    toggleSidebar: () => void;
}

function Homepage({ isSidebarActive, toggleSidebar}: PageProps) {
    return(
        <>
            {/* Hamburger button */}
            <header className="header">
                <Hamburger 
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={toggleSidebar}
                />
            </header>

            {/* Clouds background */}
            <Clouds />

            {/* Mountains background */}
            <Mountains />

            <main className="main-content">
                <h1 className="title">SafeRoute</h1>
                <p className="subtitle">Live wildfire &amp; earthquake map with evacuation routes</p>

                <div className="action-buttons">
                    <Link to="/Map" className="btn btn-primary">View Interactive Map</Link>
                    <Link to="/Demo" className="btn btn-secondary">Watch Demo</Link>
                </div>
                <div className="Safety-guide">
                    <Link to="/SafetyGuide/Earthquake" className="btn btn-guide">Safety Guide</Link>
                </div>

                {/* Status bar (weather) */}
                <StatusBar />
            </main>
        </>
    );
}

export default Homepage;