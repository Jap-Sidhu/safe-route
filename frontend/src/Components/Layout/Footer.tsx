import { Logo } from './TopBar';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <Logo />
                    <div>
                        <strong>SafeRoute</strong>
                        <p>Situational awareness, not an alert system. Always follow official evacuation orders.
                            In an emergency, call <span className="mono">911</span>.</p>
                    </div>
                </div>
                <div className="footer-cols">
                    <div>
                        <span className="eyebrow">Data</span>
                        <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA FIRMS</a>
                        <a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener noreferrer">USGS Earthquakes</a>
                        <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">OpenRouteService</a>
                    </div>
                    <div>
                        <span className="eyebrow">Official sources</span>
                        <a href="https://www.emergencyinfobc.gov.bc.ca/" target="_blank" rel="noopener noreferrer">EmergencyInfoBC</a>
                        <a href="https://www.alertready.ca/" target="_blank" rel="noopener noreferrer">Alert Ready</a>
                        <a href="https://www.getprepared.gc.ca/" target="_blank" rel="noopener noreferrer">Get Prepared (Canada)</a>
                    </div>
                    <div>
                        <span className="eyebrow">Project</span>
                        <a href="https://github.com/Jap-Sidhu/safe-route" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
                        <a href="https://www.jap-s.dev" target="_blank" rel="noopener noreferrer">Built by Japdeep Sidhu</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
