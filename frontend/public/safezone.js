// optimized-safezone.js
// Enhanced evacuation route system with multiple safety features

// Calculate haversine distance between two coordinates in KM
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate bearing between two points (for wind direction analysis)
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// Get all nearby fires to analyze fire patterns
async function getNearbyFires(centerLat, centerLng, radiusKm = 50) {
  // This would ideally connect to the same fire data source as the main map
  // For now, we'll simulate getting nearby fires from the cluster
  const nearbyFires = [];
  
  // In a real implementation, you'd query your fire data source
  // For this example, we'll return some sample data
  return nearbyFires;
}

// Enhanced safe zone finder with adaptive radius and relaxed constraints
async function findOptimalSafeZones(fireLat, fireLng, userLat = null, userLng = null) {
  // Start with conservative parameters, then expand if needed
  const searchAttempts = [
    { radius: 0.5, minDistance: 3, maxDistance: 50 },     // First try nearby areas - 3-50km
    { radius: 1.0, minDistance: 3, maxDistance: 100 },    // Expand to 3-100km  
    { radius: 1.5, minDistance: 3, maxDistance: 150 },    // Expand search area
    { radius: 2.5, minDistance: 3, maxDistance: 250 },    // Wide search for remote areas
    { radius: 4.0, minDistance: 3, maxDistance: 400 }     // Last resort - maximum search
  ];
  
  console.log(`🔍 Starting safe zone search for fire at ${fireLat}, ${fireLng}`);
  
  for (let attempt = 0; attempt < searchAttempts.length; attempt++) {
    const { radius, minDistance, maxDistance } = searchAttempts[attempt];
    
    console.log(`📍 Attempt ${attempt + 1}: Searching within ${radius}° radius (${Math.round(radius * 111)}km), min distance: ${minDistance}km`);
    
    // Get multiple types of safe destinations
    const searchQueries = [
      'hospital', 'emergency+center', 'evacuation+center', 
      'school', 'community+center', 'city+hall',
      'hotel', 'shopping+center', 'city', 'town',
      // Add more options for remote areas
      'village', 'fire+station', 'police+station',
      'gas+station', 'rest+area', 'truck+stop'
    ];
    
    const allCandidates = [];
    
    for (const query of searchQueries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?` +
          `format=geojson&q=${query}&limit=30&bounded=1&` +
          `viewbox=${fireLng - radius},${fireLat + radius},` +
          `${fireLng + radius},${fireLat - radius}`;
        
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data = await res.json();
        if (!data.features || data.features.length === 0) continue;
        
        for (const feature of data.features) {
          const [lng, lat] = feature.geometry.coordinates;
          const distance = haversine(fireLat, fireLng, lat, lng);
          
          // Use adaptive distance constraints
          if (distance >= minDistance && distance <= maxDistance) {
            const bearing = calculateBearing(fireLat, fireLng, lat, lng);
            
            allCandidates.push({
              ...feature,
              distance,
              bearing,
              priority: getPriorityScore(query, distance, userLat, userLng, lat, lng, attempt)
            });
          }
        }
        
        // Smaller delay for urgent evacuations
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.warn(`Failed to search for ${query} in attempt ${attempt + 1}:`, err);
      }
    }
    
    console.log(`🏢 Found ${allCandidates.length} potential safe locations in attempt ${attempt + 1}`);
    
    // If we found enough candidates, use them
    if (allCandidates.length >= 3) {
      // Sort by priority score and return top candidates
      allCandidates.sort((a, b) => b.priority - a.priority);
      const topCandidates = allCandidates.slice(0, 8); // More options for better routes
      
      console.log(`✅ Success! Returning ${topCandidates.length} safe locations`);
      topCandidates.forEach((candidate, i) => {
        const name = candidate.properties.display_name?.split(',')[0] || 'Unknown location';
        console.log(`  ${i + 1}. ${name} - ${candidate.distance.toFixed(1)}km away`);
      });
      
      return topCandidates;
    }
    
    // If this isn't the last attempt, wait a bit before expanding search
    if (attempt < searchAttempts.length - 1) {
      console.log(`⚠️ Only found ${allCandidates.length} locations, expanding search...`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // If we still haven't found anything, throw a more helpful error
  throw new Error(
    `No safe zones found within 400km radius. This appears to be a very remote location. ` +
    `Please manually navigate to the nearest town or city, or contact emergency services directly.`
  );
}

// Enhanced priority scoring with smart distance logic
function getPriorityScore(type, distance, userLat, userLng, destLat, destLng, attemptNumber = 0) {
  let score = 0;
  
  // Priority based on facility type
  const typePriorities = {
    'hospital': 100,
    'emergency+center': 95,
    'evacuation+center': 90,
    'fire+station': 85,        // Added for remote areas
    'police+station': 80,      // Added for remote areas
    'community+center': 70,
    'school': 65,
    'city+hall': 60,
    'hotel': 50,
    'shopping+center': 45,
    'gas+station': 40,         // Added for remote areas
    'rest+area': 35,           // Added for remote areas
    'truck+stop': 35,          // Added for remote areas
    'city': 40,
    'town': 35,
    'village': 30              // Added for remote areas
  };
  
  score += typePriorities[type] || 25;
  
  // FIXED: Smart distance scoring - prioritize closer safe locations
  // For urban areas (attempt 0-1), strongly prefer nearby safe facilities
  // Only go far when no nearby options exist (attempt 2+)
  
  if (attemptNumber <= 1) {
    // Urban/suburban logic - prefer close, safe locations
    if (distance >= 3 && distance <= 8) score += 60;      // Very close and safe - BEST
    else if (distance >= 8 && distance <= 15) score += 55; // Close and safe - EXCELLENT  
    else if (distance >= 15 && distance <= 25) score += 45; // Nearby and safe - GOOD
    else if (distance >= 25 && distance <= 40) score += 35; // Reasonable distance - OK
    else if (distance >= 40 && distance <= 60) score += 25; // Far but acceptable
    else if (distance > 60) score += 10; // Too far unless no other options
    else score += 5; // Too close to fire (under 3km)
  } else {
    // Remote area logic - more flexible distance requirements
    const distanceThresholds = [
      [20, 40, 60],  // Attempt 0: prefer 20-40km (shouldn't reach here)
      [15, 50, 80],  // Attempt 1: prefer 15-50km (shouldn't reach here)
      [10, 60, 100], // Attempt 2: prefer 10-60km
      [5, 80, 150],  // Attempt 3: prefer 5-80km
      [3, 100, 200]  // Attempt 4: prefer 3-100km
    ];
    
    const [close, good, acceptable] = distanceThresholds[Math.min(attemptNumber, 4)];
    
    if (distance >= close && distance < good) score += 40;
    else if (distance >= good && distance < acceptable) score += 35;
    else if (distance >= acceptable) score += 20;
    else if (distance >= 3) score += 15; // At least 3km from fire
    else score += 5; // Too close to fire
  }
  
  // If user location is known, prefer destinations closer to user
  if (userLat && userLng) {
    const userToDestDistance = haversine(userLat, userLng, destLat, destLng);
    
    // Give significant bonus for being close to user, especially for high-priority facilities
    const facilityBonus = (typePriorities[type] || 25) >= 80 ? 1.5 : 1.0; // Extra bonus for hospitals/emergency centers
    const proximityBonus = Math.max(0, (50 - userToDestDistance) * facilityBonus);
    score += proximityBonus;
  }
  
  // Smaller bonus for later attempts (only to break ties)
  score += attemptNumber * 2;
  
  return score;
}

// Enhanced route calculation with multiple options
async function calculateMultipleRoutes(startLat, startLng, destinations, apiKey) {
  const routes = [];
  const profiles = ['driving-car', 'driving-hgv']; // Car and emergency vehicle routes
  
  for (let i = 0; i < Math.min(destinations.length, 3); i++) {
    const dest = destinations[i];
    const [destLng, destLat] = dest.geometry.coordinates;
    
    for (const profile of profiles) {
      try {
        const coords = [[startLng, startLat], [destLng, destLat]];
        
        // OpenRouteService is called through the SafeRoute API, which adds the key server-side
        const routeRes = await fetch(
          `${window.SAFEROUTE_API || ''}/api/route/${profile}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/geo+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              coordinates: coords,
              radiuses: [5000, 2000],
              instructions: true,
              elevation: true,
              extra_info: ['surface', 'waytype']
            })
          }
        );
        
        if (!routeRes.ok) continue;
        
        const routeData = await routeRes.json();
        const summary = routeData.features[0].properties.summary;
        
        routes.push({
          destination: dest,
          routeData,
          profile,
          distance: summary.distance / 1000, // km
          duration: summary.duration / 60,    // minutes
          safety_score: calculateRouteSafetyScore(routeData, dest.distance)
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (err) {
        console.warn(`Route calculation failed for ${profile}:`, err);
      }
    }
  }
  
  return routes.sort((a, b) => b.safety_score - a.safety_score);
}

// Calculate route safety score (FIXED VERSION - Smart Distance Logic)
function calculateRouteSafetyScore(routeData, destDistance) {
  let score = 0;
  
  // FIXED: Smart distance scoring (40% of total score)
  // The key insight: if a location passed the minDistance filter (3km+), it's SAFE
  // So closer safe locations should score HIGHER, not lower
  let distanceScore = 0;
  
  if (destDistance >= 3 && destDistance <= 10) {
    // Very close and safe - EXCELLENT (hospitals in same city as fire)
    distanceScore = 40;
  } else if (destDistance > 10 && destDistance <= 20) {
    // Close and safe - VERY GOOD (neighboring cities)
    distanceScore = 38;
  } else if (destDistance > 20 && destDistance <= 35) {
    // Nearby and safe - GOOD (regional hospitals)
    distanceScore = 35;
  } else if (destDistance > 35 && destDistance <= 50) {
    // Reasonable distance - OK
    distanceScore = 30;
  } else if (destDistance > 50 && destDistance <= 80) {
    // Far but acceptable
    distanceScore = 25;
  } else {
    // Very far - last resort
    distanceScore = 20;
  }
  
  score += distanceScore;
  
  // Route duration scoring (35% of total score) - SHORTER is BETTER
  const summary = routeData.features[0].properties.summary;
  const duration = summary.duration / 60;
  let durationScore = 0;
  
  if (duration <= 15) durationScore = 35;        // Under 15 min - EXCELLENT
  else if (duration <= 25) durationScore = 32;   // 15-25 min - VERY GOOD  
  else if (duration <= 35) durationScore = 28;   // 25-35 min - GOOD
  else if (duration <= 50) durationScore = 24;   // 35-50 min - OK
  else if (duration <= 75) durationScore = 18;   // 50-75 min - Acceptable
  else if (duration <= 100) durationScore = 12;  // 75-100 min - Poor
  else durationScore = 8;                         // Over 100 min - Very Poor
  
  score += durationScore;
  
  // Road quality scoring (25% of total score)
  let roadQualityScore = 15; // Base road score
  const segments = routeData.features[0].properties.segments || [];
  let totalDistance = 0;
  let highwayDistance = 0;
  
  for (const segment of segments) {
    if (segment.extras?.waytype) {
      const wayTypes = segment.extras.waytype.values || [];
      for (const [start, end, type] of wayTypes) {
        const segmentDistance = end - start;
        totalDistance += segmentDistance;
        
        // Type 0-2 are highways/primary roads
        if (type <= 2) {
          highwayDistance += segmentDistance;
        }
      }
    }
  }
  
  // Bonus for highway percentage (up to 10 additional points)
  if (totalDistance > 0) {
    const highwayPercentage = highwayDistance / totalDistance;
    roadQualityScore += Math.floor(highwayPercentage * 10);
  }
  
  score += roadQualityScore;
  
  // Ensure score never exceeds 100
  return Math.min(Math.round(score), 100);
}

// Main evacuation function with enhanced features
async function evacuateFromFire(map, fireLat, fireLng, apiKey, userLat = null, userLng = null) {
  try {
    // Show loading indicator with progress
    const loadingPopup = L.popup()
      .setLatLng([fireLat, fireLng])
      .setContent('<div style="text-align:center;padding:8px;min-width:250px;font-family:Roboto,Arial;font-size:16px;"><strong style="font-size:18px;">🔍 Searching for safe zones...</strong><br><div id="search-progress" style="margin-top:8px;font-size:15px;color:#666;">Scanning nearby areas...</div></div>')
      .openOn(map);
    
    // Update progress indicator
    const updateProgress = (message) => {
      const progressElement = document.getElementById('search-progress');
      if (progressElement) {
        progressElement.textContent = message;
        progressElement.style.fontSize = '15px';
        progressElement.style.marginTop = '6px';
      }
    };
    
    updateProgress('Finding safe locations...');
    
    // Try to get user location if not provided
    if (!userLat || !userLng) {
      // Try to get from global variables if available
      if (window.userLat && window.userLng) {
        userLat = window.userLat;
        userLng = window.userLng;
      }
    }
    
    // Find optimal safe zones with enhanced search
    const safeZones = await findOptimalSafeZones(fireLat, fireLng, userLat, userLng);
    
    updateProgress('Calculating evacuation routes...');
    
    // Calculate multiple route options
    const routes = await calculateMultipleRoutes(fireLat, fireLng, safeZones, apiKey);
    
    if (routes.length === 0) {
      throw new Error("Routes found to safe locations, but none are accessible by road. Contact emergency services for helicopter evacuation.");
    }
    
    // Close loading popup
    map.closePopup();
    
    // Clear any existing evacuation routes first
    if (window.clearEvacuationRoutes) {
      window.clearEvacuationRoutes();
    }
    
    // Clear any existing route layers (fallback)
    map.eachLayer(layer => {
      if (layer.options && layer.options.routeLayer) {
        map.removeLayer(layer);
      }
    });
    
    // Display routes with different colors
    const routeColors = ['#ea4335', '#34a853', '#4285f4', '#fbbc04', '#9aa0a6'];
    const routeLayerGroup = L.layerGroup().addTo(map);
    
    // Filter and limit to best 3 routes
    const displayRoutes = routes.slice(0, 3);
    console.log(`Displaying ${displayRoutes.length} routes`);
    
    displayRoutes.forEach((route, index) => {
      const color = routeColors[index];
      const [destLng, destLat] = route.destination.geometry.coordinates;
      const destName = route.destination.properties.display_name || 'Safe Location';
      
      console.log(`Route ${index + 1}: ${destName.split(',')[0]}`);
      
      // Route line
      const routeLine = L.geoJSON(route.routeData, {
        style: {
          color: color,
          weight: index === 0 ? 8 : 6, // Thicker line for best route
          opacity: index === 0 ? 1.0 : 0.7,
          lineCap: 'round',
          dashArray: index === 0 ? null : '10,5' // Dashed for alternative routes
        },
        routeLayer: true
      });
      
      routeLayerGroup.addLayer(routeLine);
      
      // Destination marker
      const destMarker = L.marker([destLat, destLng], {
        icon: L.divIcon({
          className: 'evacuation-dest-marker',
          html: `<div style="background:${color};color:white;border:3px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:14px;">${index + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        }),
        routeLayer: true
      });
      
      const routeType = route.profile === 'driving-hgv' ? 'Emergency Vehicle' : 'Standard Vehicle';
      const priorityText = index === 0 ? '⭐ RECOMMENDED' : `🛣️ ROUTE ${index + 1}`;
      
      destMarker.bindPopup(`
        <div style="font-family:Roboto,Arial;max-width:380px;padding:8px;">
          <strong style="color:${color};font-size:20px;">${priorityText}</strong><br>
          <strong style="font-size:18px;">📍 ${destName.split(',')[0]}</strong><br><br>
          <div style="margin:6px 0;font-size:16px;"><strong>🚗 Route Type:</strong> ${routeType}</div>
          <div style="margin:6px 0;font-size:16px;"><strong>📏 Distance:</strong> ${route.distance.toFixed(1)} km</div>
          <div style="margin:6px 0;font-size:16px;"><strong>⏱️ Travel Time:</strong> ${route.duration.toFixed(0)} min</div>
          <div style="margin:6px 0;font-size:16px;"><strong>🛡️ Safety Score:</strong> ${route.safety_score}/100</div>
          <div style="margin-top:12px;padding:12px;background:#f0f0f0;border-radius:6px;font-size:15px;">
            <strong>Distance from fire:</strong> ${route.destination.distance.toFixed(1)} km
          </div>
        </div>
      `);
      
      routeLayerGroup.addLayer(destMarker);
      
      // Open popup for best route after a delay
      if (index === 0) {
        setTimeout(() => {
          console.log('Opening popup for best route');
          destMarker.openPopup();
        }, 1000);
      }
    });
    
    // Fire marker
    const fireMarker = L.marker([fireLat, fireLng], {
      icon: L.divIcon({
        className: 'fire-start-marker',
        html: '<div style="width:20px;height:20px;background:#ea4335;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }),
      routeLayer: true
    });
    
    fireMarker.bindPopup('🔥 Fire Location - EVACUATE IMMEDIATELY');
    routeLayerGroup.addLayer(fireMarker);
    
    // Fit map to show all routes
    const allBounds = L.latLngBounds();
    routes.slice(0, 3).forEach(route => {
      const routeBounds = L.geoJSON(route.routeData).getBounds();
      allBounds.extend(routeBounds);
    });
    
    map.fitBounds(allBounds, { padding: [50, 50] });
    
    // Add route control panel
    addRouteControlPanel(map, displayRoutes, routeLayerGroup);
    
    return routeLayerGroup;
    
  } catch (err) {
    console.error('Enhanced evacuation error:', err);
    
    // Close any loading popups
    map.closePopup();
    
    // Prepare error details for the modal
    let modalTitle = '🚨 Evacuation Route Alert';
    let modalHeading = 'Route Planning Issue';
    let modalSubtext = 'Unable to calculate safe evacuation routes';
    let errorDetails = [];
    
    if (err.message.includes('No safe zones found')) {
      modalTitle = '🌍 Remote Location Alert';
      modalHeading = 'No Safe Routes Available';
      modalSubtext = 'This location appears to be very remote with limited evacuation options';
      errorDetails = [
        '• Call 911 immediately for emergency airlift support',
        '• Head toward the nearest major road or highway if safe to do so',
        '• Look for any visible towns, settlements, or populated areas',
        '• Use satellite phone or emergency beacon if available',
        '• Signal aircraft with mirrors, bright clothing, or emergency flares'
      ];
    } else if (err.message.includes('not accessible by road')) {
      modalTitle = '🚁 Airlift Required';
      modalHeading = 'No Road Access Available';
      modalSubtext = 'Safe locations identified but not reachable by vehicle';
      errorDetails = [
        '• Call 911 immediately for helicopter evacuation assistance',
        '• Move to open areas that are visible from aircraft',
        '• Signal for help using mirrors, bright clothing, or flares',
        '• Stay in clearings away from trees and power lines',
        '• Conserve energy and water while awaiting rescue'
      ];
    } else {
      modalTitle = '🛣️ Route Planning Unavailable';
      modalHeading = 'Unable to Calculate Routes';
      modalSubtext = 'Navigation services are currently unavailable for this area';
      errorDetails = [
        '• Call 911 immediately if you are in immediate danger',
        '• Use alternative navigation apps or GPS devices if available',
        '• Head toward major highways or well-known populated areas',
        '• Follow evacuation signs or ask local authorities for guidance',
        '• Stay informed through emergency radio broadcasts'
      ];
    }
    
    // Use the custom modal instead of alert
    if (window.openEvacuationErrorModal) {
      window.openEvacuationErrorModal(modalTitle, modalHeading, modalSubtext, errorDetails);
    } else {
      // Fallback to alert if modal function is not available
      const fallbackMessage = `${modalHeading}: ${modalSubtext}\n\n${errorDetails.join('\n')}`;
      alert(fallbackMessage);
    }
    
    throw err;
  }
}

// Add control panel for route management
function addRouteControlPanel(map, routes, routeLayerGroup) {
  const controlDiv = L.DomUtil.create('div', 'route-control-panel');
  controlDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    z-index: 1000;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(100, 255, 218, 0.3);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    padding: 20px;
    font-family: Roboto, Arial, sans-serif;
    font-size: 16px;
    max-width: 380px;
    color: white;
  `;
  
  let panelHTML = '<div style="font-weight:500;margin-bottom:16px;font-size:18px;color:#64ffda;">🛣️ Evacuation Routes</div>';
  
  routes.forEach((route, index) => {
    const routeColors = ['#ea4335', '#34a853', '#4285f4'];
    const color = routeColors[index];
    const priorityText = index === 0 ? '⭐ RECOMMENDED' : `🛣️ ROUTE ${index + 1}`;
    const destName = route.destination.properties.display_name || 'Safe Location';
    
    panelHTML += `
      <div style="margin:10px 0;padding:16px;border-left:4px solid ${color};background:rgba(255, 255, 255, 0.05);border-radius:8px;">
        <div style="font-weight:500;color:${color};margin-bottom:6px;font-size:16px;">${priorityText}</div>
        <div style="font-size:15px;margin-bottom:6px;font-weight:500;color:#fff;">📍 ${destName.split(',')[0]}</div>
        <div style="font-size:14px;color:rgba(255, 255, 255, 0.8);line-height:1.4;">
          📏 ${route.distance.toFixed(1)}km • ⏱️ ${route.duration.toFixed(0)}min • 🛡️ Safety Score: ${route.safety_score}/100
        </div>
      </div>
    `;
  });
  
  panelHTML += `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(100, 255, 218, 0.2);font-size:14px;color:rgba(255, 255, 255, 0.8);">
      Click markers on map for detailed route info
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button onclick="window.toggleRoutePanel()" 
              style="background:rgba(255, 255, 255, 0.1);color:#64ffda;border:1px solid rgba(100, 255, 218, 0.3);padding:10px 14px;border-radius:8px;cursor:pointer;font-size:14px;flex:1;transition:all 0.3s ease;">
        Hide Panel ✕
      </button>
      <button onclick="window.clearEvacuationRoutes()" 
      <button onclick="window.clearEvacuationRoutes()" 
              style="background:rgba(255, 107, 107, 0.2);color:#ff6b6b;border:1px solid rgba(255, 107, 107, 0.4);padding:10px 14px;border-radius:8px;cursor:pointer;font-size:14px;flex:1;transition:all 0.3s ease;">
        Clear Routes 🗑️
      </button>
    </div>
    <div style="margin-top:10px;font-size:13px;color:rgba(255, 255, 255, 0.6);text-align:center;">
      Press ESC to show/clear routes
    </div>
  `;
  
  controlDiv.innerHTML = panelHTML;
  
  // Store reference to the route layer group for clearing
  window.currentEvacuationRoutes = routeLayerGroup;
  window.currentRoutePanel = controlDiv;
  
  // Append to map container instead of document body
  const mapContainer = map.getContainer().parentElement;
  mapContainer.appendChild(controlDiv);
}

// Global function to clear evacuation routes
function clearEvacuationRoutes() {
  if (window.currentEvacuationRoutes) {
    // Remove the route layer group from the map
    if (window.currentEvacuationRoutes._map) {
      window.currentEvacuationRoutes._map.removeLayer(window.currentEvacuationRoutes);
    }
    window.currentEvacuationRoutes = null;
  }
  
  // Remove the control panel
  if (window.currentRoutePanel && window.currentRoutePanel.parentElement) {
    window.currentRoutePanel.parentElement.removeChild(window.currentRoutePanel);
    window.currentRoutePanel = null;
  }
  
  // Remove the minimized toggle if it exists
  if (window.minimizedToggle && window.minimizedToggle.parentElement) {
    window.minimizedToggle.parentElement.removeChild(window.minimizedToggle);
    window.minimizedToggle = null;
  }
  
  console.log('✅ Evacuation routes cleared');
}

// Global function to toggle route panel visibility
function toggleRoutePanel() {
  if (!window.currentRoutePanel) return;
  
  const panel = window.currentRoutePanel;
  const isVisible = panel.style.display !== 'none';
  
  if (isVisible) {
    // Hide the panel and show minimized toggle
    panel.style.display = 'none';
    createMinimizedToggle();
  } else {
    // Show the panel and hide minimized toggle
    panel.style.display = 'block';
    if (window.minimizedToggle && window.minimizedToggle.parentElement) {
      window.minimizedToggle.parentElement.removeChild(window.minimizedToggle);
      window.minimizedToggle = null;
    }
  }
}

// Create minimized toggle button
function createMinimizedToggle() {
  if (window.minimizedToggle) return; // Already exists
  
  const toggleDiv = L.DomUtil.create('div', 'minimized-route-toggle');
  toggleDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    z-index: 1000;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(100, 255, 218, 0.3);
    border-radius: 50%;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  toggleDiv.innerHTML = '<span style="color:#64ffda;font-size:18px;">🛣️</span>';
  toggleDiv.title = 'Show Evacuation Routes Panel';
  
  // Add hover effect
  toggleDiv.addEventListener('mouseenter', () => {
    toggleDiv.style.transform = 'translateY(-50%) scale(1.1)';
    toggleDiv.style.boxShadow = '0 12px 40px rgba(100, 255, 218, 0.4)';
  });
  
  toggleDiv.addEventListener('mouseleave', () => {
    toggleDiv.style.transform = 'translateY(-50%) scale(1)';
    toggleDiv.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5)';
  });
  
  toggleDiv.addEventListener('click', () => {
    toggleRoutePanel();
  });
  
  // Store reference and append to map container
  window.minimizedToggle = toggleDiv;
  const mapContainer = window.currentRoutePanel.parentElement;
  mapContainer.appendChild(toggleDiv);
}

// Export the enhanced functions
window.evacuateFromFire = evacuateFromFire;
window.clearEvacuationRoutes = clearEvacuationRoutes;
window.toggleRoutePanel = toggleRoutePanel;
