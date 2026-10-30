// src/Components/Navigation/Navigation.tsx

import { NavLink } from 'react-router-dom';
import "./Navigation.css";

interface NavigationProps {
    isSidebarActive: boolean;
    onToggleSidebar: () => void;
}

const Navigation = (props: NavigationProps) => {
    const { isSidebarActive, onToggleSidebar } = props;
    return(
        <>
            {/* Overlay */}
            <div 
                className={`overlay ${isSidebarActive ? 'active' : ''}`}
                onClick={onToggleSidebar}
            ></div>

            {/* Side bar navigation */}
            <nav
                className={`sidebar ${isSidebarActive ? 'active' : ''}`}
                id="sidebar"
            >
                <h3 className="main-title">Navigation</h3>
                <NavLink
                    to="/"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    onClick={onToggleSidebar} end>Home
                </NavLink>
                {/* May remove demo later as it's a YT link and not a page */}
                <NavLink
                    to="/Demo"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    onClick={onToggleSidebar} end>Watch Demo
                </NavLink>
                <NavLink
                    to="/Map"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    onClick={onToggleSidebar} end>View Interactive Map
                </NavLink>

                <h3 className="subtopic">Safety Guides</h3>
                <NavLink
                    to="/SafetyGuide/Earthquake"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    onClick={onToggleSidebar} end>Earthquakes
                </NavLink>
                <NavLink
                    to="/SafetyGuide/Wildfire"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    onClick={onToggleSidebar} end>Wildfires
                </NavLink>
            </nav>
        </>
    );
}

export default Navigation;