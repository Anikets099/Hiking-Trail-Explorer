/**
 * Nominatim Geocoding Service (with Photon OSM fallback)
 * Resolves city / place names into geographic coordinates using OpenStreetMap Nominatim
 */

// Simple in-memory cache for resolved city coordinates
const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EMPTY_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Geocodes a city/location name into latitude and longitude
 * @param {string} cityName - Name of the city (e.g., "Kolhapur", "Kolkata", "Nashik", "Jaipur")
 * @returns {Promise<Object|null>} Object containing { name, latitude, longitude, displayName } or null
 */
async function geocodeCity(cityName) {
  const cleanQuery = (cityName || '').trim();
  if (!cleanQuery) return null;

  const cacheKey = cleanQuery.toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.info(`[geocoding] cache hit query=${JSON.stringify(cleanQuery)} matched=${Boolean(cached.data)}`);
    return cached.data;
  }

  // 1. Primary: Official OpenStreetMap Nominatim endpoint with compliant User-Agent
  const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    cleanQuery
  )}&format=json&limit=1&addressdetails=1`;
  console.info(`[geocoding] Nominatim request query=${JSON.stringify(cleanQuery)} url=${endpoint}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  let locationData = null;
  let successfulProviders = 0;
  const providerFailures = [];

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TrailExplorer/1.0 (+https://github.com/Anikets099/Hiking-Trail-Explorer)',
        'Referer': 'https://github.com/Anikets099/Hiking-Trail-Explorer/',
        'Accept-Language': 'en',
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    console.info(`[geocoding] Nominatim HTTP ${response.status} query=${JSON.stringify(cleanQuery)}`);
    if (!response.ok) {
      providerFailures.push(`Nominatim returned HTTP ${response.status}: ${responseText.slice(0, 500)}`);
    } else {
      let results;
      try {
        results = JSON.parse(responseText);
        successfulProviders += 1;
      } catch (parseError) {
        providerFailures.push(`Nominatim returned invalid JSON: ${parseError.message}`);
        results = [];
      }
      console.info(`[geocoding] Nominatim response query=${JSON.stringify(cleanQuery)} body=${responseText.slice(0, 2000)}`);
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
          console.info(
            `[geocoding] resolved query=${JSON.stringify(cleanQuery)} provider=Nominatim latitude=${lat} longitude=${lon}`
          );
        }
      }
    }
  } catch (nomErr) {
    providerFailures.push(`Nominatim request failed: ${nomErr.name === 'AbortError' ? 'timeout' : nomErr.message}`);
    console.error(`[geocoding] Nominatim error query=${JSON.stringify(cleanQuery)} error=${nomErr.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Secondary: Photon OpenStreetMap Geocoder Fallback
  if (!locationData) {
    const photonController = new AbortController();
    const photonTimeoutId = setTimeout(() => photonController.abort(), 3000);

    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
      console.info(`[geocoding] Photon fallback request query=${JSON.stringify(cleanQuery)} url=${photonUrl}`);
      const photonRes = await fetch(photonUrl, {
        signal: photonController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrailExplorer/1.0 (+https://github.com/Anikets099/Hiking-Trail-Explorer)',
          'Referer': 'https://github.com/Anikets099/Hiking-Trail-Explorer/'
        }
      });

      if (!photonRes.ok) {
        const body = await photonRes.text();
        providerFailures.push(`Photon returned HTTP ${photonRes.status}: ${body.slice(0, 500)}`);
        console.error(`[geocoding] Photon HTTP ${photonRes.status} query=${JSON.stringify(cleanQuery)} body=${body.slice(0, 500)}`);
      } else {
        const photonText = await photonRes.text();
        console.info(`[geocoding] Photon HTTP ${photonRes.status} query=${JSON.stringify(cleanQuery)} body=${photonText.slice(0, 2000)}`);
        let photonJson;
        try {
          photonJson = JSON.parse(photonText);
          successfulProviders += 1;
        } catch (parseError) {
          providerFailures.push(`Photon returned invalid JSON: ${parseError.message}`);
          photonJson = { features: [] };
        }
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
          console.info(
            `[geocoding] resolved query=${JSON.stringify(cleanQuery)} provider=Photon latitude=${lat} longitude=${lon}`
          );
        }
      }
    } catch (photonErr) {
      providerFailures.push(`Photon request failed: ${photonErr.name === 'AbortError' ? 'timeout' : photonErr.message}`);
      console.error(`[geocoding] Photon error query=${JSON.stringify(cleanQuery)} error=${photonErr.message}`);
    } finally {
      clearTimeout(photonTimeoutId);
    }
  }

  if (!locationData && successfulProviders === 0) {
    const error = new Error('Location lookup is temporarily unavailable. Please try again shortly.');
    error.statusCode = 503;
    error.code = 'GEOCODING_UNAVAILABLE';
    error.searchDetails = providerFailures.join('; ');
    error.diagnostics = {
      geocoder: 'Nominatim with Photon fallback',
      providers: providerFailures
    };
    throw error;
  }

  geocodeCache.set(cacheKey, {
    data: locationData,
    timestamp: Date.now(),
    ttl: locationData ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS
  });

  return locationData;
}

module.exports = {
  geocodeCity
};
