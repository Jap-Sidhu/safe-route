import { getHazards } from '../../../api';

export interface FireData {
    lat: number;
    lng: number;
    properties: {
        brightness: string;
        fp: number;
        confidence: string;
        date: string;
        time: string;
        satellite: string;
        daynight: string;
    };
}

// Fetch wildfire detections from the SafeRoute API (NASA FIRMS data, cached on the server)
export const fetchWildfireData = async (): Promise<FireData[]> => {
    try {
        const payload = await getHazards<FireData>('fires');
        return payload.data;
    } catch (error) {
        console.error('Failed to load wildfire data:', error);
        return [];
    }
};
