const { geocodeCity } = require('../services/nominatimService');
const { fetchNearbyTrailsFromOverpass } = require('../services/overpassService');
const { searchWikimediaImage } = require('../services/wikimediaService');
const { calculateDistance } = require('../utils/distance');
const Trail = require('../models/Trail');

const SEARCH_RADIUS_KM = parseInt(process.env.SEARCH_RADIUS_KM, 10) || 25;

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

    // 1. Resolve city to geographic coordinates using Nominatim
    const searchLocation = await geocodeCity(cleanCity);

    if (!searchLocation) {
      return res.status(200).json({
        success: true,
        searchLocation: null,
        location: null,
        userLocation: null,
        count: 0,
        results: [],
        data: [],
        message: `Location "${cleanCity}" not found.`
      });
    }

    const radiusKm = radius ? Math.min(100, Math.max(5, parseFloat(radius) || SEARCH_RADIUS_KM)) : SEARCH_RADIUS_KM;

    // 2. Discover nearby trails, paths, viewpoints, peaks, and nature places via Overpass
    const osmTrails = await fetchNearbyTrailsFromOverpass(
      searchLocation.latitude,
      searchLocation.longitude,
      radiusKm,
      searchLocation.name
    );

    // 3. Optional: Check if MongoDB has any curated trails near these coordinates
    let dbTrails = [];
    try {
      const allDbTrails = await Trail.find({});
      dbTrails = allDbTrails
        .map((t) => {
          const distFromSearch = calculateDistance(
            searchLocation.latitude,
            searchLocation.longitude,
            t.latitude,
            t.longitude
          );
          const obj = t.toObject();
          obj.distFromSearch = distFromSearch;
          return obj;
        })
        .filter((t) => t.distFromSearch <= radiusKm);
    } catch (dbErr) {
      // MongoDB optional check
    }

    // Merge: Put DB curated trails first, then OSM trails not already in DB
    const mergedTrails = [...dbTrails];
    const dbNames = new Set(dbTrails.map((t) => t.name.toLowerCase()));

    for (const osmTrail of osmTrails) {
      if (!dbNames.has(osmTrail.name.toLowerCase())) {
        if (!osmTrail.state && searchLocation.state) {
          osmTrail.state = searchLocation.state;
        }
        mergedTrails.push(osmTrail);
      }
    }


    // 4. Enrich trails with dynamic Wikimedia Commons imagery
    const enrichedTrails = await enrichTrailsWithImages(mergedTrails, searchLocation.name);

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

    res.status(200).json({
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
      results: formattedTrails,
      data: formattedTrails
    });
  } catch (error) {
    console.error('Explore search error:', error.message);
    next(error);
  }
};

// @desc    Dynamically discover hiking trails near given coordinates
// @route   GET /api/explore/nearby
// @access  Public
exports.getNearbyTrailsDynamic = async (req, res, next) => {
  try {
    const { lat, lng, radius = 25, userLat, userLng } = req.query;

    if (!isValidCoordinate(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude coordinates.'
      });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const radiusKm = Math.min(100, Math.max(5, parseFloat(radius) || SEARCH_RADIUS_KM));

    // 1. Discover trails from OpenStreetMap around the center point
    const osmTrails = await fetchNearbyTrailsFromOverpass(centerLat, centerLng, radiusKm, 'Nearby Area');

    // 2. Optional: Curated trails from MongoDB
    let dbTrails = [];
    try {
      const allDbTrails = await Trail.find({});
      dbTrails = allDbTrails
        .map((t) => {
          const distFromCenter = calculateDistance(centerLat, centerLng, t.latitude, t.longitude);
          const obj = t.toObject();
          obj.distFromCenter = distFromCenter;
          return obj;
        })
        .filter((t) => t.distFromCenter <= radiusKm);
    } catch (e) {}

    // Merge curated and dynamic trails
    const mergedTrails = [...dbTrails];
    const dbNames = new Set(dbTrails.map((t) => t.name.toLowerCase()));

    for (const osmTrail of osmTrails) {
      if (!dbNames.has(osmTrail.name.toLowerCase())) {
        mergedTrails.push(osmTrail);
      }
    }

    // 3. Enrich with dynamic Wikimedia imagery
    const enrichedTrails = await enrichTrailsWithImages(mergedTrails);

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
      .sort((a, b) => (a.distanceFromSearchKm || 9999) - (b.distanceFromSearchKm || 9999));

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
      results: formattedTrails,
      data: formattedTrails
    });
  } catch (error) {
    console.error('Explore nearby error:', error.message);
    next(error);
  }
};
