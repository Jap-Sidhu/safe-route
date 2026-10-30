
import { useState } from 'react';
import './Map.css'
import Hamburger from '../Navigation/Hamburger';

import Search from './SubComponents/Search';
import Filters from './SubComponents/Filter';
import Contacts from './SubComponents/Contacts';
import MapComponent from './SubComponents/MapComponent';

type FilterType = 'all' | 'fire' | 'earthquake';

interface MapPageProps {
    isSidebarActive: boolean;
    toggleSidebar: () => void;
}

function Map({ isSidebarActive, toggleSidebar}: MapPageProps) {

    const [currentSearchLocation, setCurrentSearchLocation] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [minMagnitude, setMinMagnitude] = useState<number>(1.0);
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

    const handleSearchSubmit = (searchTerm: string) => {
        setCurrentSearchLocation(searchTerm);
        console.log('Parent received search term:', searchTerm);
    }

    const handleFilterChange = (filter: FilterType, magnitude?: number) => {
        setActiveFilter(filter);
        if (magnitude != undefined) {
            setMinMagnitude(magnitude);
        }
        console.log('Parent received filter:', filter,'. Magnitude received.');
    };

    const handleOpenContacts = () => {
        setIsContactsModalOpen(true);
    };
    const handleCloseContacts = () => {
        setIsContactsModalOpen(false);
    };


    return(
        <div>

            {/* Overlay */}
            <div className="overlay" id="overlay"></div>

            <header className="headerMap">
                <Hamburger 
                    isSidebarActive={isSidebarActive}
                    onToggleSidebar={toggleSidebar}
                />
                <p className="page-titleMap">Interactive Map</p>
            </header>

            {/* Main content area */}
            <main className="main-contentMap">
                <aside className="sidebarMap">

                    {/* Search */}
                    <Search onSearch={handleSearchSubmit}/>

                    {/* Filters */}
                    <Filters onFilterChange={handleFilterChange}/>

                    {/* Emergency contacts */}
                    <div className="sidebar-section">
                        <h3 className="sidebar-title">Help/Info</h3>
                        <p style={{fontSize: '0.9rem', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem'}}>
                            Use the map to view real-time disaster information and plan safe evacuation routes.
                        </p>
                        <button
                            className="btn btn-danger"
                            style={{width: '100%'}}
                            onClick={handleOpenContacts}
                        >
                            Emergency Contacts
                        </button>
                    </div>  

                </aside>

                <Contacts isOpen={isContactsModalOpen} onClose={handleCloseContacts} />

                {/* Map Component */}
                <MapComponent 
                    searchLocation={currentSearchLocation}
                    activeFilter={activeFilter}
                    minMagnitude={minMagnitude}
                />

            </main>

        </div>
    );
}

export default Map;