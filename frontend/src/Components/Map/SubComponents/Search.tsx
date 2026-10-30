
import { useState, useRef, useCallback } from 'react';
import "./Search.css";

interface SearchProps {
    onSearch: (searchTerm: string) => void;
}

type Suggestion = {
    display_name: string;
    lat: string;
    lon: string;
};

function Search({ onSearch }: SearchProps) {
    // useState to manage input field's value
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    // useRef for debounce timer
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // clear suggestions helper
    const clearSuggestions = () => {
        setSuggestions([]);
    };

    // handle GO button click
    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim());
            setSearchTerm('');
            clearSuggestions();
        }
    };

    // Debounce helper
    const fetchSuggestions = useCallback((query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        // clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // set new timer
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&Limit=5` +
                    `&countrycodes=ca` +
                    `&viewbox=-141,83,-52,42&bounded=1` +
                    `&q=${encodeURIComponent(query)}`;

                const res = await fetch(url);
                const data = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error("Autocomplete error:", err);
                setSuggestions([]);
            }
        }, 250);
    }, []);

    // handle pressing enter key
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    // handle suggestion click
    const handleSuggestionClick = (suggestion: Suggestion) => {
        onSearch(suggestion.display_name);
        setSearchTerm('');
        clearSuggestions();
    }

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        fetchSuggestions(val);
    };

    // click outside to close suggestions
    const handleInputBlur = () => {
        setTimeout(() => {
            clearSuggestions();
        }, 150)
    };

    return(
        <div className="sidebar-section">
            <h3 className="sidebar-title">Location Search</h3>
            <div className="search-container">  
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="e.g., Vancouver" 
                    id="locationSearch" 
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onBlur={handleInputBlur}
                    autoComplete='off'                   
                /> 
                {suggestions.length > 0 && (
                    <ul className="autocomplete-list">
                        {suggestions.map((sug, idx) => (
                            <li
                                key={idx}
                                className="autocomplete-item"
                                onClick={() => handleSuggestionClick(sug)}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {sug.display_name}
                            </li>
                        ))}
                    </ul>
                )}              
                <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1rem', padding: '0.8rem 1.5rem' }}
                    onClick={handleSearchClick}
                >
                    Go
                </button>
            </div>
        </div>
    );
}

export default Search;