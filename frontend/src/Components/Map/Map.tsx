import { useState } from 'react';
import { Phone, MousePointerClick, Navigation } from 'lucide-react';
import './Map.css'

import Search from './SubComponents/Search';
import Filters from './SubComponents/Filter';
import Contacts from './SubComponents/Contacts';
import MapComponent from './SubComponents/MapComponent';

type FilterType = 'all' | 'fire' | 'earthquake';

function Map() {

    const [currentSearchLocation, setCurrentSearchLocation] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [minMagnitude, setMinMagnitude] = useState<number>(1.0);
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

    const handleFilterChange = (filter: FilterType, magnitude?: number) => {
        setActiveFilter(filter);
        if (magnitude !== undefined) {
            setMinMagnitude(magnitude);
        }
    };

    return(
        <main className="map-page">
            <aside className="sidebarMap">
                <div className="sidebar-intro">
                    <span className="eyebrow">Live map</span>
                    <h1>Hazards across Canada</h1>
                </div>

                {/* Search */}
                <Search onSearch={setCurrentSearchLocation}/>

                {/* Filters */}
                <Filters onFilterChange={handleFilterChange}/>

                {/* How to get a route */}
                <div className="sidebar-section">
                    <h3 className="sidebar-title">Find a route out</h3>
                    <ol className="howto">
                        <li><MousePointerClick size={16} /><span>Click a fire on the map</span></li>
                        <li><Navigation size={16} /><span>Press <b>Find Safe Route</b> to rank routes to nearby safe zones</span></li>
                    </ol>
                </div>

                {/* Emergency contacts */}
                <button className="btn btn-danger contacts-btn" onClick={() => setIsContactsModalOpen(true)}>
                    <Phone size={16} /> Emergency contacts
                </button>
            </aside>

            <Contacts isOpen={isContactsModalOpen} onClose={() => setIsContactsModalOpen(false)} />

            {/* Map Component */}
            <MapComponent
                searchLocation={currentSearchLocation}
                activeFilter={activeFilter}
                minMagnitude={minMagnitude}
            />
        </main>
    );
}

export default Map;
