// src/Components/Homepage/StatusBar/StatusBar.tsx

import { useState, useEffect } from 'react';
import './StatusBar.css';
import { API_BASE } from '../../../api';

function StatusBar() {


    const [temperature, setTemperature] = useState('...');
    const [windSpeed, setWindSpeed] = useState('...');
    const [sunsetTime, setSunsetTime] = useState('...');
    const [weatherCondition, setWeatherCondition] = useState('...');
    const [error, setError] = useState<string | null>(null);

    // Fetch weather data
    async function fetchWeather(latitude:number, longitude:number) {
        setError(null); // clear any previous errors
        setTemperature('...');
        setWindSpeed('...');
        setSunsetTime('...');
        setWeatherCondition('...');

        // Weather goes through the SafeRoute API so the OpenWeather key stays on the server
        const url = `${API_BASE}/api/weather?lat=${latitude}&lon=${longitude}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                // HTTP errors
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message ?? errorData.error}`);
            }
            const data = await response.json();

            // extract and display the weather data
            const currentTemperature = data.main.temp;
            const currentWindSpeed = data.wind.speed; // m/s
            const currentSunsetTimestamp = data.sys.sunset;
            const currentWeatherMain = data.weather[0].main;

            // convert wind speed from m/s to km/h
            const windSpeedKmh = (currentWindSpeed * 3.6).toFixed(1);

            // convert Unix timestamp to a readable time (i.e 12:00 pm)
            const sunsetData = new Date(currentSunsetTimestamp * 1000); // milliseconds
            const sunsetTime = sunsetData.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // update state variables
            setTemperature(`${currentTemperature.toFixed(1)}°C`);
            setWindSpeed(`${windSpeedKmh} Km/h`);
            setSunsetTime(`${sunsetTime}`);
            setWeatherCondition(`${currentWeatherMain}`);

            console.log("Weather data fetched: ", data);
        }
        catch (error) {
            console.error("Failed to fetch weather data:", error);
            setError("Error fetching weather.");
            setTemperature('Error');
            setWindSpeed('Error');
            setSunsetTime('Error');
            setWeatherCondition('Error')
        }
    }


    /*########################################################################*/

    // Geolocation
    function getUserLocation() {
        if (navigator.geolocation) {
            setError(null);
            setTemperature('...');
            setWindSpeed('...');
            setSunsetTime('...');
            setWeatherCondition('...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    fetchWeather(latitude, longitude);
                    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                },
                (error) => {
                    let errorMessage = 'Error';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Denied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'N/A';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Timeout';
                            break;
                        default:
                            errorMessage = 'Unknown';
                    }
                    setError(`Geolocation: ${errorMessage}`);
                    setTemperature('Error');
                    setWindSpeed('Error');
                    setSunsetTime('Error');
                    setWeatherCondition('Error');
                    console.error("Geolocation error: ", error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
        else {
            setError("Geolocation not supported.");
            setTemperature('N/A');
            setWindSpeed('N/A');
            setSunsetTime('N/A');
            setWeatherCondition('N/A');
        }
    };

    // useEffect to call getUserLocation
    useEffect(() => {
        getUserLocation();
    }, []);

    // useEffect to log weather condition when it changes
    useEffect(() => {
        if ((weatherCondition !== '...')) {
            console.log("weather condition updated from state: ", weatherCondition);        }
    }, [weatherCondition]);

    return(
        <div className="status-bar">
            {error && (
                <div className="status-error-message">
                    {error}
                </div>
            )}

            <div className="status-item">
                <div className="status-icon">🌡️</div>
                <div className="status-text">
                    <div className="status-value">{temperature}</div>
                    <div className="status-label">{weatherCondition}</div>
                </div>
            </div>
            <div className="status-item">
                <div className="status-icon">🌬️</div>
                <div className="status-text">
                    <div className="status-value">{windSpeed}</div>
                    <div className="status-label">Wind Speed</div>
                </div>
            </div>
            <div className="status-item">
                <div className="status-icon">🌅</div>
                <div className="status-text">
                    <div className="status-value">{sunsetTime}</div>
                    <div className="status-label">Sunset</div>
                </div>
            </div>
        </div>
    );
}

export default StatusBar;