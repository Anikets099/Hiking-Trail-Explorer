/**
 * Overpass API Service
 * Queries OpenStreetMap data to dynamically discover hiking trails, paths, peaks,
 * viewpoints, forts, and nature places around a given coordinate point.
 */

const { calculateDistance } = require('../utils/distance');

// In-memory cache for Overpass query results
const overpassCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FAILURE_CACHE_TTL_MS = 2 * 60 * 1000; // avoid repeatedly hitting overloaded public instances
const ENDPOINT_TIMEOUT_MS = 9000;
const MAX_UPSTREAM_WAIT_MS = 20000;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const GENERIC_EXCLUDED_NAMES = new Set([
  'road',
  'farm road',
  'farmland road',
  'ground road',
  'path',
  'track',
  'footpath',
  'trail',
  'service road',
  'residential',
  'unnamed',
  'street',
  'lane'
]);

/**
 * Normalizes OpenStreetMap tags into standardized Trail/Nature entity
 */
function normalizeOsmElement(element, cityName = '') {
  const tags = element.tags || {};
  const rawName = tags.name || tags['name:en'] || tags.int_name || tags.alt_name;
  if (!rawName || rawName.trim().length < 2) return null;

  const cleanName = rawName.trim();
  const lowerName = cleanName.toLowerCase();

  // Filter out generic nameless roads or utility paths
  if (GENERIC_EXCLUDED_NAMES.has(lowerName)) {
    return null;
  }

  // Extract coordinates (nodes have lat/lon, ways/relations have center.lat/lon)
  const lat = element.lat != null ? element.lat : element.center?.lat;
  const lon = element.lon != null ? element.lon : element.center?.lon;

  if (lat == null || lon == null) return null;

  // Classify accurate type based on OSM tags
  let type = 'Trail/Path';
  if (tags.route === 'hiking' || tags.route === 'foot') {
    type = 'Hiking Route';
  } else if (tags.historic === 'fort' || lowerName.includes('fort') || lowerName.includes('gad') || lowerName.includes('durg')) {
    type = 'Historic Fort';
  } else if (tags.natural === 'peak' || lowerName.includes('peak') || lowerName.includes('shikhar')) {
    type = 'Peak';
  } else if (tags.tourism === 'viewpoint' || lowerName.includes('point')) {
    type = 'Viewpoint';
  } else if (tags.leisure === 'nature_reserve' || lowerName.includes('sanctuary') || lowerName.includes('forest')) {
    type = 'Nature Reserve';
  } else if (tags.natural === 'cliff') {
    type = 'Cliff';
  } else if (tags.tourism === 'attraction' || tags.historic) {
    type = 'Scenic Outdoor Spot';
  } else if (tags.highway === 'path' || tags.highway === 'track') {
    type = 'Hiking Trail';
  }

  // Difficulty mapping from sac_scale
  let difficulty = null;
  if (tags.sac_scale) {
    const scale = tags.sac_scale.toLowerCase();
    if (scale.includes('hiking') && !scale.includes('mountain')) {
      difficulty = 'Easy';
    } else if (scale.includes('mountain') && !scale.includes('demanding') && !scale.includes('alpine')) {
      difficulty = 'Moderate';
    } else if (scale.includes('demanding') || scale.includes('alpine') || scale.includes('difficult')) {
      difficulty = 'Hard';
    } else {
      difficulty = 'Moderate';
    }
  }

  // Distance formatting if present
  let distance = null;
  let distanceNum = null;
  if (tags.distance) {
    const parsedDist = parseFloat(tags.distance);
    if (!isNaN(parsedDist)) {
      distanceNum = parsedDist;
      distance = `${parsedDist} km`;
    }
  }

  // Elevation
  let elevation = null;
  let elevationNum = null;
  if (tags.ele) {
    const parsedEle = parseInt(tags.ele, 10);
    if (!isNaN(parsedEle)) {
      elevationNum = parsedEle;
      elevation = `${parsedEle} m`;
    }
  }

  // Description / Note
  const description =
    tags.description ||
    tags['description:en'] ||
    tags.note ||
    tags.wikipedia ||
    `${type} located in ${cityName || 'the region'}, discovered via OpenStreetMap.`;

  const osmId = `osm-${element.type}-${element.id}`;

  return {
    _id: osmId,
    id: osmId,
    slug: osmId,
    name: cleanName,
    type,
    city: cityName || tags['addr:city'] || '',
    state: tags['addr:state'] || '',
    country: tags['addr:country'] || 'India',
    latitude: lat,
    longitude: lon,
    difficulty: difficulty || 'Moderate',
    distance: distance || '5.0 km',
    distanceNum: distanceNum || 5.0,
    elevation: elevation || (elevationNum ? `${elevationNum} m` : '800 m'),
    elevationNum: elevationNum || 800,
    hikingTime: tags.duration || '2-3 hrs',
    bestTime: 'Oct - Mar',
    description,
    safetyTips: [
      'Carry adequate drinking water and energy snacks',
      'Wear sturdy hiking footwear with reliable traction',
      'Follow marked trails and respect the local ecosystem'
    ],
    rating: 4.8,
    reviewCount: 0,
    source: 'OpenStreetMap',
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    imageUrl: null,
    imageAuthor: null,
    imageLicense: null,
    imageAttribution: null
  };
}

/**
 * Queries Overpass API for nearby hiking/nature features around given coordinates
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusKm - Search radius in kilometers (default 25 km)
 * @param {string} cityName - Name of the searched city for metadata
 * @returns {Promise<Array>} Array of normalized trail objects
 */
async function fetchNearbyTrailsFromOverpass(latitude, longitude, radiusKm = 25, cityName = '') {
  try {
    const radiusMeters = Math.round(Math.max(5, Math.min(radiusKm, 100)) * 1000);
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${radiusMeters}`;

    const cached = overpassCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (cached.ttl || CACHE_TTL_MS)) {
      return cached.data;
    }

    // Fast, targeted Overpass QL query
    const overpassQuery = `[out:json][timeout:15];
(
  nwr["natural"~"^(peak|cliff)$"]["name"](around:${radiusMeters},${latitude},${longitude});
  nwr["historic"~"^(fort|castle)$"]["name"](around:${radiusMeters},${latitude},${longitude});
  nwr["tourism"~"^(viewpoint|attraction)$"]["name"](around:${radiusMeters},${latitude},${longitude});
  nwr["leisure"="nature_reserve"]["name"](around:${radiusMeters},${latitude},${longitude});
  way["highway"="path"]["name"](around:${radiusMeters},${latitude},${longitude});
  way["highway"="track"]["name"](around:${radiusMeters},${latitude},${longitude});
  relation["route"~"^(hiking|foot)$"]["name"](around:${radiusMeters},${latitude},${longitude});
);
out center 35;`;

    let data = null;
    const endpointFailures = [];
    const requestDeadline = Date.now() + MAX_UPSTREAM_WAIT_MS;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      const remainingMs = requestDeadline - Date.now();
      if (remainingMs <= 0) break;

      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), Math.min(ENDPOINT_TIMEOUT_MS, remainingMs));

        const response = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TrailExplorer/1.0 (+https://github.com/Anikets099/Hiking-Trail-Explorer)'
          },
          signal: controller.signal
        });

        if (response.ok) {
          data = await response.json();
          if (data && Array.isArray(data.elements)) {
            break;
          }
          endpointFailures.push(`${new URL(endpoint).hostname}: invalid JSON response`);
        } else {
          endpointFailures.push(`${new URL(endpoint).hostname}: HTTP ${response.status}`);
        }
      } catch (err) {
        endpointFailures.push(`${new URL(endpoint).hostname}: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!data || !Array.isArray(data.elements)) {
      overpassCache.set(cacheKey, {
        data: [],
        timestamp: Date.now(),
        ttl: FAILURE_CACHE_TTL_MS
      });
      console.warn(`Overpass unavailable; using curated trail results only. ${endpointFailures.join('; ')}`);
      return [];
    }

    // Normalize and filter valid named trails
    const rawTrails = [];
    for (const el of data.elements) {
      const normalized = normalizeOsmElement(el, cityName);
      if (normalized) {
        rawTrails.push(normalized);
      }
    }

    // Deduplicate trails with the exact same name within close proximity
    const uniqueTrails = [];
    const seenNames = new Set();

    for (const trail of rawTrails) {
      const nameKey = trail.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueTrails.push(trail);
      } else {
        const isFarApart = uniqueTrails.some(
          (t) =>
            t.name.toLowerCase() === nameKey &&
            calculateDistance(t.latitude, t.longitude, trail.latitude, trail.longitude) > 3.0
        );
        if (isFarApart) {
          uniqueTrails.push(trail);
        }
      }
    }

    // Cache the normalized results
    overpassCache.set(cacheKey, {
      data: uniqueTrails,
      timestamp: Date.now(),
      ttl: CACHE_TTL_MS
    });

    return uniqueTrails;
  } catch (error) {
    console.error('Overpass service error:', error.message);
    return [];
  }
}

module.exports = {
  fetchNearbyTrailsFromOverpass
};
