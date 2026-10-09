/**
 * Overpass API Service
 * Queries OpenStreetMap data to dynamically discover hiking trails, paths, peaks,
 * viewpoints, forts, and nature places around a given coordinate point.
 */

const { calculateDistance } = require('../utils/distance');

// In-memory cache for Overpass query results
const overpassCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
// Public instances fail transiently (HTTP 429/504) and recover within seconds, so only
// back off briefly instead of answering every search with a cached failure.
const FAILURE_CACHE_TTL_MS = 30 * 1000;
// Each instance gets a bounded sequential window so the aggregate wait stays limited.
// The first instance gets the longest one: a dense area such as Pune takes it 5-6s,
// and the fallbacks are frequently unreachable, so cutting it short fails the search.
const ENDPOINT_TIMEOUTS_MS = [15000, 5000, 3500, 3500, 3500];
const MAX_UPSTREAM_WAIT_MS = 30000;

// Ordered by observed reliability: the French instance answers the trail query in ~3s,
// while overpass-api.de rate-limits per IP and refuses connections from some hosts.
const OVERPASS_ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
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
 * Bounding box (south,west,north,east) that fully contains a circle around a point
 */
function getBoundingBox(latitude, longitude, radiusKm) {
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));
  return [
    Math.max(-90, latitude - latDelta),
    Math.max(-180, longitude - lonDelta),
    Math.min(90, latitude + latDelta),
    Math.min(180, longitude + lonDelta)
  ]
    .map((value) => value.toFixed(5))
    .join(',');
}

/**
 * Normalizes OpenStreetMap tags into standardized Trail/Nature entity
 */
function normalizeOsmElement(element, cityName = '') {
  const tags = element.tags || {};
  const rawName = tags.name || tags['name:en'] || tags.int_name || tags.alt_name;
  if (typeof rawName !== 'string' || rawName.trim().length < 2) return null;

  const cleanName = rawName.trim();
  const lowerName = cleanName.toLowerCase();

  // Filter out generic nameless roads or utility paths
  if (GENERIC_EXCLUDED_NAMES.has(lowerName)) {
    return null;
  }

  // Nodes expose lat/lon; ways and relations usually expose center coordinates.
  let lat = element.lat ?? element.center?.lat;
  let lon = element.lon ?? element.center?.lon;

  if ((lat == null || lon == null) && Array.isArray(element.geometry) && element.geometry.length > 0) {
    const points = element.geometry.filter(
      (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon)
    );
    if (points.length > 0) {
      lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
      lon = points.reduce((sum, point) => sum + point.lon, 0) / points.length;
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

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
    distance,
    distanceNum,
    elevation,
    elevationNum,
    hikingTime: tags.duration || null,
    bestTime: null,
    description,
    safetyTips: [
      'Carry adequate drinking water and energy snacks',
      'Wear sturdy hiking footwear with reliable traction',
      'Follow marked trails and respect the local ecosystem'
    ],
    rating: null,
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
 * @returns {Promise<{trails: Array, available: boolean}>} Search results and provider status
 */
async function fetchNearbyTrailsFromOverpass(latitude, longitude, radiusKm = 25, cityName = '') {
  try {
    const radiusMeters = Math.round(Math.max(5, Math.min(radiusKm, 100)) * 1000);
    // cityName is stamped onto every cached trail, so it must be part of the key
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${radiusMeters}_${cityName.trim().toLowerCase()}`;

    const cached = overpassCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (cached.ttl || CACHE_TTL_MS)) {
      return cached.data;
    }

    // Fast, targeted Overpass QL query. A bounding box is used instead of around: filters
    // because a 25 km around: search over this many tags does not finish within the
    // timeout on public instances. Results are trimmed back to the radius below.
    // Routes and paths are output first so the element limit never drops them in favour
    // of the far more numerous points of interest.
    const searchRadiusKm = radiusMeters / 1000;
    const overpassQuery = `[out:json][timeout:14][bbox:${getBoundingBox(latitude, longitude, searchRadiusKm)}];
(
  relation["route"~"^(hiking|foot)$"]["name"];
  way["highway"~"^(path|track)$"]["name"]["sac_scale"];
  way["highway"~"^(path|track)$"]["name"]["trail_visibility"];
);
out center 40;
(
  nwr["natural"~"^(peak|cliff)$"]["name"];
  nwr["historic"~"^(fort|castle|ruins)$"]["name"];
  nwr["tourism"~"^(viewpoint|attraction)$"]["name"];
  nwr["leisure"~"^(nature_reserve|park)$"]["name"];
);
out center 80;`;

    let data = null;
    const endpointFailures = [];
    const requestDeadline = Date.now() + MAX_UPSTREAM_WAIT_MS;
    let successfulEndpoint = null;
    let responseStatus = null;

    console.info(
      `[overpass] request query=${JSON.stringify(cityName)} latitude=${latitude} longitude=${longitude} radiusKm=${radiusKm} queryQL=${JSON.stringify(overpassQuery)}`
    );

    for (const [endpointIndex, endpoint] of OVERPASS_ENDPOINTS.entries()) {
      const remainingMs = requestDeadline - Date.now();
      if (remainingMs <= 0) break;

      let timeoutId;
      try {
        const endpointTimeoutMs = ENDPOINT_TIMEOUTS_MS[endpointIndex] || 3500;
        const requestTimeoutMs = Math.min(endpointTimeoutMs, remainingMs);
        console.info(
          `[overpass] requesting endpoint=${endpoint} query=${JSON.stringify(cityName)} timeoutMs=${requestTimeoutMs}`
        );
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'TrailExplorer/1.0 (+https://github.com/Anikets099/Hiking-Trail-Explorer)',
            'Referer': 'https://github.com/Anikets099/Hiking-Trail-Explorer/'
          },
          signal: controller.signal
        });

        responseStatus = response.status;
        console.info(`[overpass] HTTP ${response.status} endpoint=${endpoint} query=${JSON.stringify(cityName)}`);
        if (response.ok) {
          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            endpointFailures.push(`${new URL(endpoint).hostname}: invalid JSON response: ${parseError.message}; ${responseText.slice(0, 500)}`);
            console.error(`[overpass] invalid JSON endpoint=${endpoint} response=${responseText.slice(0, 500)}`);
            data = null;
            continue;
          }
          if (data && Array.isArray(data.elements)) {
            if (
              data.elements.length === 0 &&
              typeof data.remark === 'string' &&
              /runtime error|timed?\s*out|parse error/i.test(data.remark)
            ) {
              endpointFailures.push(`${new URL(endpoint).hostname}: ${data.remark}`);
              console.error(`[overpass] query failed endpoint=${endpoint} status=${response.status} remark=${JSON.stringify(data.remark)}`);
              data = null;
              continue;
            }
            successfulEndpoint = endpoint;
            console.info(
              `[overpass] response endpoint=${endpoint} status=${response.status} elements=${data.elements.length} remark=${JSON.stringify(data.remark || null)} names=${JSON.stringify(data.elements.slice(0, 20).map((element) => element.tags?.name).filter(Boolean))}`
            );
            break;
          }
          endpointFailures.push(`${new URL(endpoint).hostname}: JSON response did not include an elements array`);
          data = null;
        } else {
          const responseText = await response.text();
          const failure = `${new URL(endpoint).hostname}: HTTP ${response.status}: ${responseText.slice(0, 500)}`;
          endpointFailures.push(failure);
          console.error(`[overpass] provider error endpoint=${endpoint} status=${response.status} body=${responseText.slice(0, 500)}`);
        }
      } catch (err) {
        // fetch() reports network failures as "fetch failed"; the real reason is on err.cause
        const reason = err.name === 'AbortError' ? 'timeout' : [err.message, err.cause?.code].filter(Boolean).join(' ');
        const failure = `${new URL(endpoint).hostname}: ${reason}`;
        endpointFailures.push(failure);
        console.error(`[overpass] request failed endpoint=${endpoint} error=${failure}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!data || !Array.isArray(data.elements)) {
      const result = {
        trails: [],
        available: false,
        endpoint: null,
        status: responseStatus,
        errors: endpointFailures,
        elementCount: 0
      };
      overpassCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: FAILURE_CACHE_TTL_MS
      });
      console.error(`[overpass] all endpoints failed query=${JSON.stringify(cityName)} errors=${JSON.stringify(endpointFailures)}`);
      return result;
    }

    // Normalize and filter valid named trails
    const rawTrails = [];
    const seenIds = new Set();
    for (const el of data.elements) {
      const normalized = normalizeOsmElement(el, cityName);
      if (!normalized || seenIds.has(normalized.id)) continue;
      // The bounding box is larger than the search circle, so drop its corners
      if (calculateDistance(latitude, longitude, normalized.latitude, normalized.longitude) > searchRadiusKm) {
        continue;
      }
      seenIds.add(normalized.id);
      rawTrails.push(normalized);
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
    const result = {
      trails: uniqueTrails,
      available: true,
      endpoint: successfulEndpoint,
      status: responseStatus,
      errors: [],
      elementCount: data.elements.length,
      remark: data.remark || null
    };

    overpassCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: CACHE_TTL_MS
    });

    console.info(
      `[overpass] normalized query=${JSON.stringify(cityName)} elements=${data.elements.length} trails=${uniqueTrails.length}`
    );
    return result;
  } catch (error) {
    console.error(`[overpass] service error query=${JSON.stringify(cityName)} message=${error.message}`);
    return { trails: [], available: false, endpoint: null, status: null, errors: [error.message], elementCount: 0 };
  }
}

module.exports = {
  fetchNearbyTrailsFromOverpass
};
