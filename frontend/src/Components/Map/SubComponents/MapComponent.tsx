
import './MapComponent.css';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import { fetchWildfireData } from './WildfireFetch';
import type { FireData } from './WildfireFetch';
import { fetchEarthquakeData, formatEarthquakePopup } from './EarthquakeFetch';
import type { EarthquakeData } from './EarthquakeFetch';

// Type definitions for marker cluster
interface MarkerCluster {
    getChildCount(): number;
}

interface MarkerClusterGroup extends L.LayerGroup {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
}

declare module 'leaflet' {
    function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

declare global {
    interface Window {
        evacuateFromFire?: (map: L.Map, lat: number, lng: number, apiKey: string) => Promise<void>;
        clearEvacuationRoutes?: () => void;
        toggleRoutePanel?: () => void;
        currentEvacuationRoutes?: any;
        currentRoutePanel?: HTMLElement;
        openEvacuationErrorModal?: (title: string, heading: string, subtext: string, details: string[]) => void;
    }
}

///////////////////////////////////////////////////////////////////////////////

// define types for the filter options
type FilterType = 'all' | 'fire' | 'earthquake';

interface MapComponentProps {
    searchLocation: string;
    activeFilter: FilterType;
    minMagnitude: number;
}

///////////////////////////////////////////////////////////////////////////////

// @ts-expect-error: Property '_getIconUrl' does not exist on type 'Default'.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom User Location Icon
const createUserLocationIcon = () => {
    return L.divIcon({
        className: 'user-location-icon',
        html: '<div style="width:20px;height:20px;background:#4285f4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(10,14,19,0.55),0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

// Custom Fire Marker
const createFireMarker = (fireData: FireData) => {
    return L.circleMarker([fireData.lat, fireData.lng], {
        radius: 17,
        fillColor: '#ff6a2b',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    });
};

// Custom Fire Cluster Icon
const createFireClusterIcon = (cluster: MarkerCluster) => {
    const count = cluster.getChildCount();
    return new L.DivIcon({
        html: `<div style="
            background:#ff6a2b;
            color:white;
            border-radius:50%;
            width:40px;
            height:40px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:'JetBrains Mono',monospace;
            font-weight:700;
            font-size:14px;
            box-shadow:0 0 0 3px rgba(10,14,19,0.55),0 2px 8px rgba(0,0,0,0.4);
        ">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: [40, 40]
    });
};

// Custom Earthquake Marker
const createEarthquakeMarker = (earthquakeData: EarthquakeData) => {   
    return L.circleMarker([earthquakeData.lat, earthquakeData.lng], {
        radius: 17,
        fillColor: '#3b8eea',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    });
};

// Custom Earthquake Cluster Icon
const createEarthquakeClusterIcon = (cluster: MarkerCluster) => {
    const count = cluster.getChildCount();
    return new L.DivIcon({
        html: `<div style="
            background:#3b8eea;
            color:white;
            border-radius:50%;
            width:40px;
            height:40px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:'JetBrains Mono',monospace;
            font-weight:700;
            font-size:14px;
            box-shadow:0 0 0 3px rgba(10,14,19,0.55),0 2px 8px rgba(0,0,0,0.4);
        ">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: [40, 40]
    });
};

const TILE_LAYERS = {
    standard: {
        // Dark basemap so fire and quake markers stand out
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        maxZoom: 19,
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles © Esri — Source: Esri, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
    },
    terrain: {
        url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, CC BY 3.0 — Map data © OpenStreetMap contributors',
        maxZoom: 18,
        subdomains: 'abcd',
    }
};

// Fire Popup Component
const showFirePopup = (fireData: FireData) => {
    const f = fireData;
    return `<div style="font-family:Roboto,Arial;padding:8px;min-width:250px;">
        <strong style="color:#ea4335;font-size:18px;font-weight:900;">🔥 Fire Detected</strong><br><br>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Satellite:</strong> ${f.properties.satellite}</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Brightness:</strong> ${f.properties.brightness}°K</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Fire Power:</strong> ${f.properties.fp} MW</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Confidence:</strong> ${(f.properties.confidence === 'h') ? 'High' : 'Normal'}</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Date:</strong> ${f.properties.date}</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Time:</strong> ${f.properties.time}</div>
        <div style="font-size:15px;margin-bottom:8px;"><strong style="font-weight:900;">Detection:</strong> ${(f.properties.daynight === 'D') ? 'Daytime' : 'Nighttime'}</div>
        <button id="evacuateBtn" 
            style="margin-top:10px;
                font-size: 16px;
                padding:8px 12px;
                background:#ff6a2b;
                color:white;
                border:none;
                border-radius:6px;cursor:pointer;
                width:100%;
            ">
            🚨 Find Safe Route
        </button>
    </div>`;
};

// Custom component to capture map reference using useMap hook
const MapController: React.FC<{ 
    onMapReady: (map: L.Map) => void 
}> = ({ onMapReady }) => {
    const map = useMap();
    
    useEffect(() => {
        if (map) {
            onMapReady(map);
        }
    }, [map, onMapReady]);
    
    return null;
};

///////////////////////////////////////////////////////////////////////////////

const MapComponent: React.FC<MapComponentProps> = ({ searchLocation, activeFilter, minMagnitude }) => {

    // default center for the map
    const defaultCenter: [number, number] = [56.1304, -106.3468];

    const mapRef = useRef<L.Map | null>(null);
    const [centerCoords, setCenterCoords] = useState<[number, number]>([0, 0]);
    const [isMapReady, setIsMapReady] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [hasShownUserPopup, setHasShownUserPopup] = useState(false);
    const [fireData, setFireData] = useState<FireData[]>([]);
    const [earthquakeData, setEarthquakeData] = useState<EarthquakeData[]>([]);

    // store references to cluster groups for removal
    const fireClusterGroupRef = useRef<MarkerClusterGroup | null>(null);
    const earthquakeClusterGroupRef = useRef<MarkerClusterGroup | null>(null);

    // create the user location icon
    const customUserIcon = useMemo(() => {
        return createUserLocationIcon();
    }, []);

    // calculate filtered counts for status display
    const { filteredFireCount, filteredEarthquakeCount } = useMemo(() => {
        let fireCount = 0;
        let earthquakeCount = 0;

        // count fires only if they should be displayed
        if (activeFilter === 'all' || activeFilter === 'fire') {
            fireCount = fireData.length;
        }

        // count earthquakes only if they should be displayed and meet magnitude requirement
        if (activeFilter === 'all' || activeFilter === 'earthquake') {
            earthquakeCount = earthquakeData.filter(earthquake => {
                const magnitude = earthquake.properties.magnitude || 0;
                return magnitude >= minMagnitude;
            }).length;
        }
        return { filteredFireCount: fireCount, filteredEarthquakeCount: earthquakeCount };
    }, [fireData, earthquakeData, activeFilter, minMagnitude]);

    ///////////////////////////////////////////////////////////////////////////////

    // Load wildfire data
    useEffect(() => {
        const loadFireData = async () => {
            try {
                const data = await fetchWildfireData();
                setFireData(data);
            } catch (error) {
                console.error('Error loading fire data:', error);
            }
        };
        loadFireData();
    }, []);

    // Load earthquake data
    useEffect(() => {
        const loadEarthquakeData = async () => {
            try {
                const data = await fetchEarthquakeData();
                setEarthquakeData(data);
            } catch (error) {
                console.error('Error loading earthquake data:', error);
            }
        };
        loadEarthquakeData();
    }, []);

    // FIRE MARKERS EFFECT
    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;
        const map = mapRef.current;

        // Only update if fires are to be shown
        if (activeFilter === 'all' || activeFilter === 'fire') {
            // Clear old fire markers
            if (fireClusterGroupRef.current && map.hasLayer(fireClusterGroupRef.current)) {
                map.removeLayer(fireClusterGroupRef.current);
                fireClusterGroupRef.current = null;
            }

            if (fireData.length > 0) {
                const fireClusterGroup = L.markerClusterGroup({
                    iconCreateFunction: createFireClusterIcon,
                });

                fireData.forEach((fire) => {
                    const marker = createFireMarker(fire);
                    marker.on('click', () => {
                        marker.bindPopup(showFirePopup(fire)).openPopup();
                        setTimeout(() => {
                            const evacuateBtn = document.getElementById('evacuateBtn');
                            if (evacuateBtn) {
                                evacuateBtn.addEventListener('click', () => {
                                    handleEvacuation(map, fire.lat, fire.lng, ''); // routing key lives on the server
                                });
                            }
                        }, 25);
                    });
                    fireClusterGroup.addLayer(marker);
                });

                map.addLayer(fireClusterGroup);
                fireClusterGroupRef.current = fireClusterGroup;
            }
        } else {
            // Remove fire markers if not active
            if (fireClusterGroupRef.current && map.hasLayer(fireClusterGroupRef.current)) {
                map.removeLayer(fireClusterGroupRef.current);
                fireClusterGroupRef.current = null;
            }
        }
    }, [fireData, activeFilter, isMapReady]);

    // EARTHQUAKE MARKERS EFFECT
    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;
        const map = mapRef.current;

        if (activeFilter === 'all' || activeFilter === 'earthquake') {
            // Clear old earthquake markers
            if (earthquakeClusterGroupRef.current && map.hasLayer(earthquakeClusterGroupRef.current)) {
                map.removeLayer(earthquakeClusterGroupRef.current);
                earthquakeClusterGroupRef.current = null;
            }

            if (earthquakeData.length > 0) {
                const earthquakeClusterGroup = L.markerClusterGroup({
                    iconCreateFunction: createEarthquakeClusterIcon,
                });

                earthquakeData.forEach((earthquake) => {
                    const magnitude = earthquake.properties.magnitude || 0;
                    if (magnitude >= minMagnitude) {
                        const marker = createEarthquakeMarker(earthquake);
                        marker.on('click', () => {
                            const popupContent = formatEarthquakePopup(earthquake.properties, earthquake.lat, earthquake.lng);
                            marker.bindPopup(popupContent).openPopup();
                        });
                        earthquakeClusterGroup.addLayer(marker);
                    }
                });

                map.addLayer(earthquakeClusterGroup);
                earthquakeClusterGroupRef.current = earthquakeClusterGroup;
            }
        } else {
            // Remove if not active
            if (earthquakeClusterGroupRef.current && map.hasLayer(earthquakeClusterGroupRef.current)) {
                map.removeLayer(earthquakeClusterGroupRef.current);
                earthquakeClusterGroupRef.current = null;
            }
        }
    }, [earthquakeData, activeFilter, minMagnitude, isMapReady]);

    ///////////////////////////////////////////////////////////////////////////////

    // search
    useEffect(() => {
        if (!searchLocation) return;

        const map = mapRef.current;
        if (!map || !isMapReady) return;

        const controller = new AbortController();

        const fetchLocation = async () => {
            try {
                const params = new URLSearchParams({
                    q: searchLocation,
                    format: "geojson",
                    limit: "1",
                    countrycodes: "ca",
                    viewbox: "-141,83,-52,42",
                    bounded: "1"
                });
                const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
                    signal: controller.signal
                });
                const data = await res.json();

                if (!data.features || data.features.length === 0) {
                    alert("Location not found.");
                    return;
                }

                const [lng, lat] = data.features[0].geometry.coordinates;

                // Zoom to location
                map.setView([lat, lng], 10);

                // Add a search result marker
                const searchResultIcon = L.divIcon({
                    className: 'search-result-icon',
                    html: '<div style="width:12px;height:12px;background:#34a853;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });

                // remove previous search markers
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker && layer.options.icon &&
                        (layer.options.icon as L.DivIcon).options?.className === 'search-result-icon') {
                        map.removeLayer(layer);
                    }
                });

                // close user location popup
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker && 
                        layer.options.icon && 
                        (layer.options.icon as L.DivIcon).options?.className === 'user-location-icon') {
                        layer.closePopup();
                    }
                });

                let nearestFire: FireData | null = null;
                let minFireDistance = Infinity;
                const searchRadius = 15; // km

                fireData.forEach((fire) => {
                    const distance = haversine(lat, lng, fire.lat, fire.lng);
                    if (distance <= searchRadius && distance < minFireDistance) {
                        minFireDistance = distance;
                        nearestFire = fire;
                    }
                });

                if (nearestFire) {
                    const confirmedNearestFire: FireData = nearestFire;

                    // show fire warning
                    map.setView([confirmedNearestFire.lat, confirmedNearestFire.lng], 10);

                    // add warning circle
                    L.circle([lat, lng], {
                        radius: 15000,
                        fillColor: '#ff6b6b',
                        color: '#ea4335',
                        weight: 2,
                        opacity: 0.7,
                        fillOpacity: 0.1
                    }).addTo(map);

                    // show fire popup
                    const fireMarker = createFireMarker(confirmedNearestFire);
                    fireMarker.addTo(map);
                    fireMarker.bindPopup(showFirePopup(confirmedNearestFire)).openPopup();
                } else {
                    // Add new search marker - area clear
                    L.marker([lat, lng], { icon: searchResultIcon })
                        .addTo(map)
                        .bindPopup(`<strong style="color:#34a853;">✅ Area Clear</strong><br>No fires within 15 km of<br><strong>${data.features[0].properties.display_name}</strong>`)
                        .openPopup();
                }

            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error("Search failed:", err);
                    alert("Search failed. Please try again.");
                }
            }
        };

        fetchLocation();

        return () => controller.abort();
    }, [searchLocation, isMapReady, fireData]);

    // ESC key handler for evacuation routes and modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // First check if modal is open and close it
                const modal = document.getElementById('evacuationErrorModal');
                if (modal && modal.classList.contains('active')) {
                    hideEvacuationErrorModal();
                    return;
                }

                // Then handle evacuation routes
                if (window.currentEvacuationRoutes) {
                    if (window.clearEvacuationRoutes) {
                        window.clearEvacuationRoutes();
                    }
                } else if (window.currentRoutePanel) {
                    if (window.toggleRoutePanel) {
                        window.toggleRoutePanel();
                    }
                }
            }
        };

        const handleModalClose = () => {
            const closeBtn = document.getElementById('closeErrorModal');
            const modal = document.getElementById('evacuationErrorModal');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', hideEvacuationErrorModal);
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        hideEvacuationErrorModal();
                    }
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        handleModalClose();
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            const closeBtn = document.getElementById('closeErrorModal');
            if (closeBtn) {
                closeBtn.removeEventListener('click', hideEvacuationErrorModal);
            }
            // Clean up global function
            if (window.openEvacuationErrorModal) {
                delete window.openEvacuationErrorModal;
            }
        };
    }, []);

    // Haversine distance calculation
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Function to show evacuation error modal
    const showEvacuationErrorModal = (errorMessage?: string) => {
        const modal = document.getElementById('evacuationErrorModal');
        const statusText = document.getElementById('errorModalSubtext');
        
        if (modal) {
            // Update the status text if a specific error message is provided
            if (statusText && errorMessage) {
                statusText.textContent = errorMessage;
            } else if (statusText) {
                statusText.textContent = "Navigation services are currently unavailable for this area";
            }
            
            modal.classList.add('active');
        }
    };

    // Function to hide evacuation error modal
    const hideEvacuationErrorModal = () => {
        const modal = document.getElementById('evacuationErrorModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    // Enhanced evacuation function with error handling
    const handleEvacuation = async (map: L.Map, lat: number, lng: number, apiKey: string) => {
        if (!window.evacuateFromFire) {
            showEvacuationErrorModal("Evacuation system is not properly initialized");
            return;
        }

        try {
            await window.evacuateFromFire(map, lat, lng, apiKey);
        } catch (error) {
            console.error('Evacuation route calculation failed:', error);
            
            // Handle specific error types with simpler messages
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            let modalMessage = '';
            if (errorMessage.includes('Routes found to safe locations, but none are accessible by road')) {
                modalMessage = "Navigation services are currently unavailable for this area";
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                modalMessage = "Network connection issues preventing route calculation";
            } else if (errorMessage.includes('API') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
                modalMessage = "Routing service experiencing high traffic or limitations";
            } else if (errorMessage.includes('No safe zones')) {
                modalMessage = "No safe evacuation zones identified in immediate area";
            } else {
                modalMessage = "Navigation services are currently unavailable for this area";
            }
            
            showEvacuationErrorModal(modalMessage);
        }
    };

    // callback to get the map instance once it's created
    const onMapReady = useCallback((mapInstance: L.Map) => {
        mapRef.current = mapInstance;
        setIsMapReady(true);

        // Set up global evacuation error modal function for safezone.js
        window.openEvacuationErrorModal = (_title: string, _heading: string, subtext: string, _details: string[]) => {
            showEvacuationErrorModal(subtext);
        };

        // track mouse movement for coordinates display
        mapInstance.on('mousemove', (e: L.LeafletMouseEvent) => {
            setCenterCoords([e.latlng.lat, e.latlng.lng]);
        });

        // try to get geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    
                    // Only show User Location popup once when location is first detected
                    if (!hasShownUserPopup) {
                        setTimeout(() => {
                            mapInstance.invalidateSize();
                            mapInstance.eachLayer((layer) => {
                                if (layer instanceof L.Marker &&
                                    layer.options.icon &&
                                    (layer.options.icon as L.DivIcon).options?.className === 'user-location-icon') {
                                    layer.openPopup();
                                }
                            });
                            setHasShownUserPopup(true);
                        }, 50);
                    }
                },
                (error) => {
                    console.warn("Geolocation error:", error.message);
                },
                { enableHighAccuracy: true}
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
        }
    }, [hasShownUserPopup]);

    // useState for map tiles
    const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof TILE_LAYERS>('satellite');
    // Use useMemo to get the details of the currently active layer
    const activeLayer = useMemo(() => TILE_LAYERS[activeLayerKey], [activeLayerKey]);

    // zoom buttons
    const zoomIn = () => { 
        if (mapRef.current && isMapReady) {
            mapRef.current.setZoom(mapRef.current.getZoom() + 1);   
        } else {
            console.warn("Map reference not available for zoomIn.");
        }
    };
    const zoomOut = () => {
        if (mapRef.current && isMapReady) {
            mapRef.current.setZoom(mapRef.current.getZoom() - 1);
        } else {
            console.warn("Map reference not available for zoomOut.");
        }
    };

    ///////////////////////////////////////////////////////////////////////////////

    return(
        <div className="map-container">

            <MapContainer
                center = {defaultCenter}
                zoom = {4} // default zoom
                scrollWheelZoom = {true}
                className="map-leaflet-instance"
                zoomControl={false}
            >
                {/* use MapController component to get map reference */}
                <MapController onMapReady={onMapReady} />

                <TileLayer
                    key={activeLayerKey}
                    attribution={activeLayer.attribution}
                    url={activeLayer.url}
                    maxZoom={activeLayer.maxZoom}
                />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker 
                        position={userLocation}
                        icon={customUserIcon}
                    >
                        <Popup
                            closeButton={true}
                            autoClose={false}
                            closeOnEscapeKey={true}
                        >
                            <div style={{ fontFamily: 'Roboto, Arial, sans-serif', textAlign: 'center', fontSize: '14px', margin: '0' }} >
                                <p>Your Location</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Map Coords */}
            <div className="coords-display" id="coordsBox">
                <p>Lat: {centerCoords[0].toFixed(4)} <br/>Lng: {centerCoords[1].toFixed(4)}</p>
            </div>

            {/* Map Controls */}
            <div className="map-controls">
                <button className="map-control-btn" title="Zoom In" onClick={zoomIn} disabled={!isMapReady}>+</button>
                <button className="map-control-btn" title="Zoom Out" onClick={zoomOut} disabled={!isMapReady}>-</button>
            </div>

            {/* Map Types */}
            <div className="map-type-controls">
                <button
                    className={`map-type-btn ${activeLayerKey === 'standard' ? 'active' : ''}`}
                    onClick={() => setActiveLayerKey('standard')}
                >
                    Map
                </button>
                <button
                    className={`map-type-btn ${activeLayerKey === 'satellite' ? 'active' : ''}`}
                    onClick={() => setActiveLayerKey('satellite')}
                >
                    Satellite
                </button>
            </div>

            {/* Status Indicators */}
            <div className="status-indicators" aria-label="Map legend">
                <div className="status-itemMap">
                    <div className="status-dot fire"></div>
                    <span className="status-text"><b>{filteredFireCount.toLocaleString()}</b> fire detections</span>
                </div>
                <div className="status-itemMap">
                    <div className="status-dot quake"></div>
                    <span className="status-text"><b>{filteredEarthquakeCount.toLocaleString()}</b> earthquakes</span>
                </div>
            </div>

            {/* Evacuation Error Modal */}
            <div className="modal-overlay" id="evacuationErrorModal">
                <div className="modal">
                    <div className="modal-header">
                        <div className="modal-title-section">
                            <span className="modal-icon">🗺️</span>
                            <h2 className="modal-title" id="errorModalTitle">ROUTE PLANNING UNAVAILABLE</h2>
                        </div>
                        <button className="modal-close" id="closeErrorModal">×</button>
                    </div>
                    <div className="modal-content">
                        <div className="route-status-section">
                            <div className="status-header">
                                <span className="warning-icon">⚠️</span>
                                <div className="status-info">
                                    <h3 id="errorModalHeading">Unable to Calculate Routes</h3>
                                    <p id="errorModalSubtext">Navigation services are currently unavailable for this area</p>
                                </div>
                            </div>
                        </div>

                        <div className="guidance-section">
                            <ul className="guidance-list">
                                <li>Call 911 immediately if you are in immediate danger</li>
                                <li>Use alternative navigation apps or GPS devices if available</li>
                                <li>Head toward major highways or well-known populated areas</li>
                                <li>Follow evacuation signs or ask local authorities for guidance</li>
                                <li>Stay informed through emergency radio broadcasts</li>
                            </ul>
                        </div>

                        <div className="emergency-actions-section">
                            <div className="section-header">
                                <span className="section-icon">📞</span>
                                <div className="section-info">
                                    <h3>Immediate Actions</h3>
                                    <p>Contact emergency services for assistance</p>
                                </div>
                            </div>
                            <div className="emergency-contacts">
                                <div className="emergency-contact">
                                    <div className="contact-info">
                                        <span className="contact-name">Emergency Services</span>
                                        <span className="contact-number">911</span>
                                    </div>
                                    <button className="call-btn" onClick={() => window.open('tel:911')}>Call Now</button>
                                </div>
                                <div className="emergency-contact">
                                    <div className="contact-info">
                                        <span className="contact-name">Fire Emergency Hotline</span>
                                        <span className="contact-number">1-800-FIRE-411</span>
                                    </div>
                                    <button className="call-btn" onClick={() => window.open('tel:18003473411')}>Call Now</button>
                                </div>
                            </div>
                        </div>

                        <div className="emergency-warning">
                            <span className="fire-icon">🔥</span>
                            <p><strong>Emergency Situation:</strong> If you are in immediate danger, evacuate immediately and call 911. Do not wait for digital route planning.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;