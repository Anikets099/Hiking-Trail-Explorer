/**
 * Nominatim Geocoding Service (with Photon OSM fallback)
 * Resolves city / place names into geographic coordinates using OpenStreetMap Nominatim
 */

// Simple in-memory cache for resolved city coordinates
const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Geocodes a city/location name into latitude and longitude
 * @param {string} cityName - Name of the city (e.g., "Kolhapur", "Kolkata", "Nashik", "Jaipur")
 * @returns {Promise<Object|null>} Object containing { name, latitude, longitude, displayName } or null
 */
async function geocodeCity(cityName) {
  try {
    const cleanQuery = (cityName || '').trim();
    if (!cleanQuery) return null;

    const cacheKey = cleanQuery.toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Primary: Official OpenStreetMap Nominatim endpoint with compliant User-Agent
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQuery
    )}&format=json&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    let locationData = null;

    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TrailExplorerCollegeProject/1.0 (https://github.com/trailexplorer; student.trailexplorer@gmail.com)',
          'Accept-Language': 'en',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          const bestMatch = results[0];
          const lat = parseFloat(bestMatch.lat);
          const lon = parseFloat(bestMatch.lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            locationData = {
              name: bestMatch.name || bestMatch.display_name?.split(',')[0] || cleanQuery,
              displayName: bestMatch.display_name,
              latitude: lat,
              longitude: lon,
              city: bestMatch.address?.city || bestMatch.address?.town || bestMatch.address?.state_district || cleanQuery,
              state: bestMatch.address?.state || '',
              country: bestMatch.address?.country || 'India',
              type: bestMatch.type,
              importance: bestMatch.importance
            };
          }
        }
      }
    } catch (nomErr) {
      console.warn(`Nominatim primary request error for "${cleanQuery}":`, nomErr.message);
    }

    // 2. Secondary: Photon OpenStreetMap Geocoder Fallback
    if (!locationData) {
      try {
        const photonController = new AbortController();
        const photonTimeoutId = setTimeout(() => photonController.abort(), 5000);

        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
        const photonRes = await fetch(photonUrl, {
          signal: photonController.signal,
          headers: { 'Accept': 'application/json' }
        });

        clearTimeout(photonTimeoutId);

        if (photonRes.ok) {
          const photonJson = await photonRes.json();
          if (photonJson.features && photonJson.features.length > 0) {
            const feat = photonJson.features[0];
            const [lon, lat] = feat.geometry.coordinates;
            locationData = {
              name: feat.properties.name || cleanQuery,
              displayName: `${feat.properties.name || cleanQuery}, ${feat.properties.state || ''} ${feat.properties.country || ''}`.trim(),
              latitude: lat,
              longitude: lon,
              city: feat.properties.city || feat.properties.name || cleanQuery,
              state: feat.properties.state || '',
              country: feat.properties.country || 'India',
              type: feat.properties.osm_value
            };
          }
        }
      } catch (photonErr) {
        console.warn(`Photon fallback geocoder error for "${cleanQuery}":`, photonErr.message);
      }
    }

    if (locationData) {
      // Cache the result
      geocodeCache.set(cacheKey, {
        data: locationData,
        timestamp: Date.now()
      });
    }

    return locationData;
  } catch (error) {
    console.warn(`Geocoding error for "${cityName}":`, error.message);
    return null;
  }
}

module.exports = {
  geocodeCity
};
