import { getHazards } from '../../../api';

export interface EarthquakeData {
    lat: number;
    lng: number;
    properties: {
        magnitude: number;
        depth: number;
        place: string;
        time: Date;
        url: string;
        tsunami: number;
        type: string;
        id: string;
    };
}

// Fetch earthquakes from the SafeRoute API (USGS data, cached in Redis)
export const fetchEarthquakeData = async (): Promise<EarthquakeData[]> => {
    try {
        const payload = await getHazards<EarthquakeData & { properties: { time: number } }>('earthquakes');
        // The API sends time as epoch milliseconds; the map expects a Date
        return payload.data.map((eq) => ({
            ...eq,
            properties: { ...eq.properties, time: new Date(eq.properties.time) },
        }));
    } catch (error) {
        console.error("Failed to load earthquake data:", error);
        return [];
    }
};

//  categorize earthquake magnitude
export const getMagnitudeCategory = (magnitude: number): string => {
    if (magnitude >= 7.0) return 'Major';
    else if (magnitude >= 6.0) return 'Strong';
    else if (magnitude >= 5.0) return 'Moderate';
    else if (magnitude >= 4.0) return 'Light';
    else if (magnitude >= 3.0) return 'Minor';
    else if (magnitude >= 2.0) return 'Micro';
    return 'Micro';
};

//  categorize earthquake depth
export const getDepthCategory = (depth: number): string => {
    if (depth > 300) return 'Deep';
    else if (depth > 70) return 'Intermediate';
    return 'Shallow';
};

// format earthquake popup content
export const formatEarthquakePopup = (eq: EarthquakeData['properties'], lat: number, lng: number): string => {
    const timeStr = eq.time.toLocaleDateString() + ' ' + eq.time.toLocaleTimeString();
    const magnitudeCategory = getMagnitudeCategory(eq.magnitude);
    const depthCategory = getDepthCategory(eq.depth);
    
    return `<div style="font-family:Roboto,Arial;padding:8px;min-width:280px;">
        <strong style="color:#1976d2;font-size:18px;font-weight:900;">🌍 Earthquake Detected</strong><br><br>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Location:</strong> ${eq.place}</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Magnitude:</strong> ${eq.magnitude.toFixed(1)} (${magnitudeCategory})</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Depth:</strong> ${eq.depth.toFixed(1)} km (${depthCategory})</div>
        <div style="font-size:15px;margin-bottom:4px;"><strong style="font-weight:900;">Date & Time:</strong> ${timeStr}</div>
        <div style="font-size:15px;margin-bottom:8px;"><strong style="font-weight:900;">Event Type:</strong> ${eq.type}</div>
        ${eq.tsunami === 1 ? '<div style="color:#ea4335;font-weight:900;font-size:16px;margin-bottom:8px;"><strong>⚠️ Tsunami Warning</strong></div>' : ''}
        <div style="margin-top:10px;padding:10px;background:#e3f2fd;border-radius:6px;font-size:14px;">
            <strong style="font-weight:900;">Coordinates:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°<br>
            <strong style="font-weight:900;">Event ID:</strong> ${eq.id}
        </div>
        ${eq.url ? `<div style="margin-top:10px;"><a href="${eq.url}" target="_blank" style="color:#1976d2;text-decoration:none;font-size:15px;font-weight:500;">📊 View USGS Details</a></div>` : ''}
    </div>`;
};