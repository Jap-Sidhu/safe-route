
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'

import Navigation from "./Components/Navigation/Navigation";
import CursorGlow from "./Components/CursorGlow/CursorGlow";

import Homepage from "./Components/Homepage/Homepage";
import Demo from "./Components/Demo/Demo";
import MapPage from "./Components/Map/Map";
import Earthquake from "./Components/SafetyGuide/Earthquake";
import Wildfire from "./Components/SafetyGuide/Wildfire";

function App() {

  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarActive(prev => !prev);
  }

  return (
    <Router>
      {/* CursorGlow */}
      <CursorGlow />
      
      {/* Navigation */}
      <Navigation
        isSidebarActive={isSidebarActive}
        onToggleSidebar={toggleSidebar}
      />

      <div className={`container ${isSidebarActive ? 'shifted' : ''}`}>

        <Routes>
          {/* Homepage */}
          <Route path="/" element={<Homepage isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />} />

          {/* Demo page */}
          <Route path="/Demo" element={<Demo isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />} />

          {/* Interactive map */}
          <Route path="/Map" element={<MapPage isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />} />

          {/* Safety Guides */}
          <Route path="/SafetyGuide/Earthquake" element={<Earthquake isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />} />
          <Route path="/SafetyGuide/Wildfire" element={<Wildfire isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />} />
        </Routes>

      </div>
    </Router>
  )
}

export default App
