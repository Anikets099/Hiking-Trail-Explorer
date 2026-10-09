const { geocodeCity } = require('../services/nominatimService');
const { fetchNearbyTrailsFromOverpass } = require('../services/overpassService');
const { searchWikimediaImage } = require('../services/wikimediaService');
const { calculateDistance } = require('../utils/distance');

const SEARCH_RADIUS_KM = parseInt(process.env.SEARCH_RADIUS_KM, 10) || 25;
const NEARBY_RADIUS_KM = 25;
const IMAGE_ENRICHMENT_TIMEOUT_MS = 3500;

/**
 * Validates whether latitude and longitude are within legitimate geographical bounds
 */
function isValidCoordinate(lat, lng) {
  if (lat == null || lng == null) return false;
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  return (
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180
  );
}

/**
 * Enriches an array of trails with authentic Wikimedia Commons imagery dynamically
 */
async function enrichTrailsWithImages(trails, cityName = '') {
  // Enrich up to 20 top trails with dynamic Wikimedia Commons imagery
  const topTrails = trails.slice(0, 20);
  const remainingTrails = trails.slice(20).map((t) => ({
    ...t,
    imageUrl: t.imageUrl || null,
    thumbnailUrl: t.thumbnailUrl || null,
    imageAuthor: t.imageAuthor || null,
    imageLicense: t.imageLicense || null,
    imageAttribution: t.imageAttribution || null
  }));

  const enrichPromises = topTrails.map(async (trail) => {
    try {
      if (trail.source === 'TrailExplorer curated') {
        return trail;
      }

      // If trail already has an authentic image (e.g. from MongoDB admin curation), keep it
      if (trail.imageUrl && !trail.imageUrl.includes('placeholder') && !trail.imageUrl.includes('rajgad')) {
        return trail;
      }

      const wikiData = await searchWikimediaImage(trail.name, trail.city || cityName);
      return {
        ...trail,
        imageUrl: wikiData.imageUrl || null,
        thumbnailUrl: wikiData.thumbnailUrl || null,
        imageAuthor: wikiData.imageAuthor || null,
        imageLicense: wikiData.imageLicense || null,
        imageAttribution: wikiData.imageAttribution || null,
        sourceUrl: trail.sourceUrl || wikiData.sourceUrl || null
      };
    } catch (e) {
      return {
        ...trail,
        imageUrl: null,
        thumbnailUrl: null,
        imageAuthor: null,
        imageLicense: null,
        imageAttribution: null
      };
    }
  });

  const enrichedTop = await Promise.all(enrichPromises);
  return [...enrichedTop, ...remainingTrails];
}

async function enrichTrailsForSearch(trails, cityName) {
  let timeoutId;
  try {
    return await Promise.race([
      enrichTrailsWithImages(trails, cityName),
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(trails), IMAGE_ENRICHMENT_TIMEOUT_MS);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// @desc    Dynamically discover hiking trails and nature places for any searched city
// @route   GET /api/explore/search
// @access  Public
exports.searchCityTrails = async (req, res, next) => {
  try {
    const { city, userLat, userLng, radius } = req.query;

    if (!city || typeof city !== 'string' || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid city or place name to search.'
      });
    }

    // Sanitize input string (max 100 chars, remove dangerous control characters)
    const cleanCity = city.trim().substring(0, 100).replace(/[<>%$^&*={}\[\]\\]/g, '');

    console.info(`[trail-search] query=${JSON.stringify(cleanCity)}`);
    const searchLocation = await geocodeCity(cleanCity);

    if (!searchLocation) {
      const responseBody = {
        success: false,
        searchLocation: null,
        location: null,
        userLocation: null,
        count: 0,
        results: [],
        data: [],
        message: `Location "${cleanCity}" not found.`
      };
      console.info(`[trail-search] geocoding returned no match query=${JSON.stringify(cleanCity)}`);
      return res.status(404).json(responseBody);
    }

    console.info(
      `[trail-search] geocoded query=${JSON.stringify(cleanCity)} location=${JSON.stringify(searchLocation.name)} latitude=${searchLocation.latitude} longitude=${searchLocation.longitude}`
    );

    const parsedRadius = Number.parseFloat(radius);
    const radiusKm = Math.min(
      100,
      Math.max(5, Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : SEARCH_RADIUS_KM)
    );
    console.info(`[trail-search] radiusKm=${radiusKm}`);

    // 2. Discover hiking-related OSM features around the resolved coordinates.
    const osmSearch = await fetchNearbyTrailsFromOverpass(
      searchLocation.latitude,
      searchLocation.longitude,
      radiusKm,
      searchLocation.name
    );
    const osmTrails = osmSearch.trails;

    if (!osmSearch.available) {
      const error = new Error(
        `OpenStreetMap trail search is temporarily unavailable for "${cleanCity}". Please try again shortly.`
      );
      error.statusCode = 503;
      error.code = 'TRAIL_SEARCH_UNAVAILABLE';
      error.searchDetails = JSON.stringify(osmSearch.errors || []);
      error.diagnostics = {
        geocoder: 'Nominatim',
        searchLocation: {
          name: searchLocation.name,
          latitude: searchLocation.latitude,
          longitude: searchLocation.longitude
        },
        searchRadiusKm: radiusKm,
        overpassEndpoint: osmSearch.endpoint || null,
        overpassStatus: osmSearch.status || null,
        overpassErrors: osmSearch.errors || [],
        osmElements: osmSearch.elementCount || 0
      };
      throw error;
    }

    // 4. Enrich trails with dynamic Wikimedia Commons imagery
    const enrichedTrails = await enrichTrailsForSearch(osmTrails, searchLocation.name);

    // 5. Compute DISTANCE B: Search Location -> Each Trail
    const formattedTrails = enrichedTrails.map((trail) => {
      const trailId = trail.id || (trail._id ? trail._id.toString() : null) || trail.slug || `trail-${trail.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const item = {
        ...trail,
        id: trailId,
        _id: trail._id || trailId,
        slug: trail.slug || trailId
      };
      if (trail.latitude != null && trail.longitude != null) {
        const distFromSearchKm = calculateDistance(
          searchLocation.latitude,
          searchLocation.longitude,
          trail.latitude,
          trail.longitude
        );
        item.distanceFromSearchKm = distFromSearchKm;
        item.distanceFromSearch = distFromSearchKm != null ? `${distFromSearchKm} km` : null;
        item.distanceFromSearchText =
          distFromSearchKm != null
            ? `${distFromSearchKm} km from ${searchLocation.name}`
            : null;
        item.searchOriginName = searchLocation.name;
      }
      return item;
    });


    // 6. Compute DISTANCE A: Current User Location -> Searched Location (only if user coordinates provided)
    let userLocationObj = null;
    let distUserToSearchKm = null;
    let distUserToSearchText = null;

    if (isValidCoordinate(userLat, userLng)) {
      const parsedUserLat = parseFloat(userLat);
      const parsedUserLng = parseFloat(userLng);
      userLocationObj = {
        latitude: parsedUserLat,
        longitude: parsedUserLng
      };

      distUserToSearchKm = calculateDistance(
        parsedUserLat,
        parsedUserLng,
        searchLocation.latitude,
        searchLocation.longitude
      );

      if (distUserToSearchKm != null) {
        distUserToSearchText = `${distUserToSearchKm} km from your location to ${searchLocation.name}`;
      }
    }

    const responseBody = {
      success: true,
      searchLocation: {
        name: searchLocation.name,
        displayName: searchLocation.displayName,
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude
      },
      location: {
        name: searchLocation.name,
        displayName: searchLocation.displayName,
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude
      },
      userLocation: userLocationObj,
      distanceFromUserToSearchKm: distUserToSearchKm,
      distanceFromUserToSearch: distUserToSearchKm != null ? `${distUserToSearchKm} km` : null,
      distanceFromUserToSearchText: distUserToSearchText,
      count: formattedTrails.length,
      sources: {
        openStreetMap: osmSearch.available
      },
      diagnostics: {
        geocoder: 'Nominatim',
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        searchRadiusKm: radiusKm,
        overpassEndpoint: osmSearch.endpoint || null,
        overpassStatus: osmSearch.status || null,
        overpassErrors: osmSearch.errors || [],
        osmElements: osmSearch.elementCount || 0,
        osmTrails: osmTrails.length
      },
      results: formattedTrails,
      data: formattedTrails
    };
    console.info(
      `[trail-search] final-json ${JSON.stringify(responseBody)}`
    );
    return res.status(200).json(responseBody);
  } catch (error) {
    console.error(
      `[trail-search] failed query=${JSON.stringify(req.query.city || '')}: ${error.searchDetails || error.message}`
    );
    next(error);
  }
};

// @desc    Dynamically discover hiking trails near given coordinates
// @route   GET /api/explore/nearby
// @access  Public
exports.getNearbyTrailsDynamic = async (req, res, next) => {
  try {
    const { lat, lng, radius = NEARBY_RADIUS_KM, userLat, userLng } = req.query;

    if (!isValidCoordinate(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude coordinates.'
      });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusKm = Math.min(100, Math.max(5, parseFloat(radius) || NEARBY_RADIUS_KM));

    // 1. Discover trails from OpenStreetMap around the center point
    const osmSearch = await fetchNearbyTrailsFromOverpass(centerLat, centerLng, radiusKm, 'Nearby Area');
    const osmTrails = osmSearch.trails;

    if (!osmSearch.available) {
      const error = new Error('Nearby trail search is temporarily unavailable because the live trail provider could not be reached.');
      error.statusCode = 503;
      error.code = 'TRAIL_SEARCH_UNAVAILABLE';
      error.searchDetails = JSON.stringify(osmSearch.errors || []);
      error.diagnostics = {
        searchLocation: {
          latitude: centerLat,
          longitude: centerLng
        },
        searchRadiusKm: radiusKm,
        overpassEndpoint: osmSearch.endpoint || null,
        overpassStatus: osmSearch.status || null,
        overpassErrors: osmSearch.errors || [],
        osmElements: osmSearch.elementCount || 0
      };
      throw error;
    }

    // 3. Enrich with dynamic Wikimedia imagery
    const enrichedTrails = await enrichTrailsForSearch(osmTrails, 'Nearby Area');

    // 4. Calculate distance from search center to each trail
    const formattedTrails = enrichedTrails
      .map((trail) => {
        const item = { ...trail };
        const distKm = calculateDistance(centerLat, centerLng, trail.latitude, trail.longitude);
        item.distanceFromSearchKm = distKm;
        item.distanceFromSearch = distKm != null ? `${distKm} km` : null;
        item.distanceFromSearchText = distKm != null ? `${distKm} km away` : null;
        return item;
      })
      .sort((a, b) => (a.distanceFromSearchKm ?? 9999) - (b.distanceFromSearchKm ?? 9999));

    res.status(200).json({
      success: true,
      searchLocation: {
        name: 'Nearby Location',
        latitude: centerLat,
        longitude: centerLng
      },
      location: {
        name: 'Nearby Location',
        latitude: centerLat,
        longitude: centerLng
      },
      count: formattedTrails.length,
      sources: { openStreetMap: osmSearch.available },
      results: formattedTrails,
      data: formattedTrails
    });
  } catch (error) {
    console.error('Explore nearby error:', error.message);
    next(error);
  }
};
