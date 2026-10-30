// src/Components/Demo/Demo.tsx

import "./Demo.css";

import Hamburger from "../Navigation/Hamburger";
import Clouds from "../Homepage/Clouds/Clouds";
import Mountains from "../Homepage/Mountains/Mountains";

interface PageProps {
    isSidebarActive: boolean;
    toggleSidebar: () => void;
}

function Demo({ isSidebarActive, toggleSidebar}: PageProps) {
    return(
        <>
            {/* Hamburger button */}
            <header className="header">
                <Hamburger 
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={toggleSidebar}
                />
            </header>
            <div className="PageContainer">
                <Clouds />
                <Mountains />
                <h1 className="Title">Demo</h1>
                <div className="Video">
                    <iframe 
                        
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=abcdefghijklm"
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen>
                    </iframe>
                </div>

                <div className="TextContainer">
                    <div className="box">
                        <div className="box-wrapper">
                            <h1>The Problem</h1>
                            <p>Growing natural disaster risks in BC, like "Big One" earthquakes and increasing wildfires.</p>
                        </div>
                    </div>

                    <div className="box">
                        <div className="box-wrapper">
                            <h1>Our Goal</h1>
                            <p>To raise awareness and educate citizens for critical disaster preparedness.</p>
                        </div>
                    </div>

                    <div className="box">
                        <div className="box-wrapper">
                            <h1>The Solution</h1>
                            <p>SafeRoute provides routes, resources, and vital safety info.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Demo;