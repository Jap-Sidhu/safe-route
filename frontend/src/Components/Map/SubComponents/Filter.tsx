import { useState } from 'react';
import './Filter.css';

//  filter options
type FilterType = 'all' | 'fire' | 'earthquake';

interface FilterProps {
    initialActiveFilter?: FilterType;
    onFilterChange?: (filter: FilterType, magnitude?: number) => void;
}

function Filter({ initialActiveFilter='all', onFilterChange }: FilterProps) {

    // handle button clicks
    const [activeFilter, setActiveFilter] = useState<FilterType>(initialActiveFilter);

    // handle  button click
    const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // get the data filter value from the clicked button
        const selectedFilter = event.currentTarget.dataset.filter as FilterType;

        // update the state
        setActiveFilter(selectedFilter);

        // Notify parent
        if (onFilterChange) {
            onFilterChange(selectedFilter);
        }
        console.log('Filter applied: ', selectedFilter);
    }

    // Slider //

    // useState for the magnitude slider's value
    const [minMagnitude, setMinMagnitude] = useState<number>(1.0);

    const handleMagnitudeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Parse the new value from the slider input
        const newMagnitude = parseFloat(event.target.value);

        // Update the state with the new magnitude value
        setMinMagnitude(newMagnitude);

        // If the "Earthquake" filter is currently active, notify the parent
        if ((activeFilter === 'earthquake' || activeFilter === 'all') && onFilterChange) {
            onFilterChange(activeFilter, newMagnitude);
        }
    };

    return(
        <div className="sidebar-section">
            <h3 className="sidebar-title">Filter</h3>
            <div className="filter-options">

                <div className="filter-group">
                    <button
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        data-filter="all"
                        onClick={handleFilterClick}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'fire' ? 'active' : ''}`}
                        data-filter="fire"
                        onClick={handleFilterClick}
                    >
                        Fires
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'earthquake' ? 'active' : ''}`}
                        data-filter="earthquake"
                        onClick={handleFilterClick}
                    >
                        Quakes
                    </button>
                </div>

                {/* magnitude slider rendering */}
                {(activeFilter === 'earthquake' || activeFilter === 'all') && (
                    <div className="magnitude-adjuster">
                        <h4 className="magnitude-title">Minimum Magnitude</h4>
                        <div className="magnitude-slider-container">
                            <input
                                type="range"
                                className="magnitude-slider"
                                id="magnitudeSlider" 
                                min="1"
                                max="9"
                                step="0.1"
                                value={minMagnitude}
                                onChange={handleMagnitudeChange} // Updates state when slider moves
                            />
                            <div className="magnitude-labels">
                                {/* Displays the current minMagnitude state, formatted to one decimal */}
                                <span className="magnitude-value">{minMagnitude.toFixed(1)}</span>
                                <span className="magnitude-scale">minimum shown</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Filter;