import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css'

import TopBar from "./Components/Layout/TopBar";
import Footer from "./Components/Layout/Footer";
import Homepage from "./Components/Homepage/Homepage";
import MapPage from "./Components/Map/Map";
import Earthquake from "./Components/SafetyGuide/Earthquake";
import Wildfire from "./Components/SafetyGuide/Wildfire";

function Shell() {
  // The map fills the screen, so it has no footer
  const { pathname } = useLocation();
  const isMap = pathname.toLowerCase() === '/map';

  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/Map" element={<MapPage />} />
        <Route path="/SafetyGuide/Earthquake" element={<Earthquake />} />
        <Route path="/SafetyGuide/Wildfire" element={<Wildfire />} />
        <Route path="/SafetyGuide" element={<Navigate to="/SafetyGuide/Wildfire" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isMap && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  )
}

export default App
