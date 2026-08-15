const Trail = require('../models/Trail');
const { calculateDistance } = require('../utils/distance');
const { searchWikimediaImage } = require('../services/wikimediaService');

// @desc    Get all trails with search, filters, sorting and distance calculation
// @route   GET /api/trails
// @access  Public
exports.getTrails = async (req, res, next) => {
  try {
    const { search, difficulty, distance, sortBy, lat, lng } = req.query;

    const query = {};

    // Dynamic database search across name, city, state, description
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { name: regex },
        { city: regex },
        { state: regex },
        { description: regex }
      ];
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      query.difficulty = new RegExp(`^${difficulty}$`, 'i');
    }

    // Distance filter
    if (distance === 'under5') {
      query.distanceNum = { $lt: 5.0 };
    } else if (distance === '5to10') {
      query.distanceNum = { $gte: 5.0, $lte: 10.0 };
    } else if (distance === 'above10') {
      query.distanceNum = { $gt: 10.0 };
    }

    let trails = await Trail.find(query);

    // If user coordinates provided, calculate geodesic distance
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    let processedTrails = trails.map((trail) => {
      const trailObj = trail.toObject();
      if (userLat != null && userLng != null && trail.latitude && trail.longitude) {
        const distKm = calculateDistance(userLat, userLng, trail.latitude, trail.longitude);
        trailObj.distanceFromUserKm = distKm;
        trailObj.distanceFromUser = distKm != null ? `${distKm} km` : null;
      }
      return trailObj;
    });

    // Sorting
    if (sortBy === 'distance') {
      if (userLat != null && userLng != null) {
        processedTrails.sort((a, b) => (a.distanceFromUserKm || 99999) - (b.distanceFromUserKm || 99999));
      } else {
        processedTrails.sort((a, b) => (a.distanceNum || 0) - (b.distanceNum || 0));
      }
    } else if (sortBy === 'name') {
      processedTrails.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: sort by rating descending
      processedTrails.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    res.status(200).json({
      success: true,
      count: processedTrails.length,
      data: processedTrails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular trails from database
// @route   GET /api/trails/popular
// @access  Public
exports.getPopularTrails = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    let popularTrails = await Trail.find({ isPopular: true }).limit(8);

    // If fewer than 4 marked popular, fallback to highest rated
    if (popularTrails.length < 4) {
      popularTrails = await Trail.find({}).sort({ rating: -1, reviewCount: -1 }).limit(6);
    }

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const data = popularTrails.map((t) => {
      const obj = t.toObject();
      if (userLat != null && userLng != null && t.latitude && t.longitude) {
        const distKm = calculateDistance(userLat, userLng, t.latitude, t.longitude);
        obj.distanceFromUserKm = distKm;
        obj.distanceFromUser = distKm != null ? `${distKm} km` : null;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby trails based on user latitude & longitude
// @route   GET /api/trails/nearby
// @access  Public
exports.getNearbyTrails = async (req, res, next) => {
  try {
    const { lat, lng, radius = 500 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user latitude and longitude coordinates.'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate format.'
      });
    }

    // Retrieve all trails to calculate exact straight-line distance
    const allTrails = await Trail.find({});

    const nearbyList = allTrails
      .map((trail) => {
        const distKm = calculateDistance(userLat, userLng, trail.latitude, trail.longitude);
        const obj = trail.toObject();
        obj.distanceFromUserKm = distKm;
        obj.distanceFromUser = `${distKm} km`;
        return obj;
      })
      .filter((t) => t.distanceFromUserKm <= parseFloat(radius))
      .sort((a, b) => a.distanceFromUserKm - b.distanceFromUserKm);

    res.status(200).json({
      success: true,
      count: nearbyList.length,
      userLocation: { latitude: userLat, longitude: userLng },
      data: nearbyList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trail by ID, Slug, or OSM Identifier
// @route   GET /api/trails/:id
// @access  Public
exports.getTrailById = async (req, res, next) => {
  try {
    const identifier = req.params.id;

    // Handle OSM Dynamic Trail identifier
    if (identifier.startsWith('osm-')) {
      const parts = identifier.split('-');
      const osmType = parts[1];
      const osmId = parts[2];

      const cleanName = req.query.name || 'Scenic Trail';
      const city = req.query.city || '';

      const wikiInfo = await searchWikimediaImage(cleanName, city);

      const dynamicTrail = {
        _id: identifier,
        id: identifier,
        slug: identifier,
        name: cleanName,
        city: city || 'Local Region',
        state: 'India',
        country: 'India',
        difficulty: 'Moderate',
        distance: '5.0 km',
        distanceNum: 5.0,
        elevation: '800 m',
        elevationNum: 800,
        hikingTime: '2-3 hrs',
        bestTime: 'Oct - Mar',
        description: `Discovered trail and outdoor nature spot near ${city || 'the area'} via OpenStreetMap.`,
        safetyTips: [
          'Carry enough water and energy snacks',
          'Wear proper trekking shoes with grip',
          'Follow the designated paths and respect nature'
        ],
        imageUrl: wikiInfo.imageUrl,
        imageAuthor: wikiInfo.imageAuthor,
        imageLicense: wikiInfo.imageLicense,
        imageAttribution: wikiInfo.imageAttribution,
        sourceUrl: wikiInfo.sourceUrl || `https://www.openstreetmap.org/${osmType}/${osmId}`,
        source: 'OpenStreetMap',
        rating: 4.8,
        reviewCount: 0
      };

      return res.status(200).json({
        success: true,
        data: dynamicTrail
      });
    }

    let trail;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      trail = await Trail.findById(identifier);
    } else {
      trail = await Trail.findOne({ slug: identifier.toLowerCase().trim() });
    }

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Hiking trail not found.'
      });
    }

    // Wikimedia lookup & cache if trail has no custom image
    if (!trail.imageUrl || trail.imageUrl.includes('placeholder')) {
      try {
        const wikiInfo = await searchWikimediaImage(trail.name, trail.city);
        if (wikiInfo && wikiInfo.imageUrl) {
          trail.imageUrl = wikiInfo.imageUrl;
          trail.imageAuthor = wikiInfo.imageAuthor;
          trail.imageLicense = wikiInfo.imageLicense;
          trail.imageAttribution = wikiInfo.imageAttribution;
          trail.sourceUrl = wikiInfo.sourceUrl;
          await trail.save();
        }
      } catch (e) {
        // Safe non-blocking fallback
      }
    }

    res.status(200).json({
      success: true,
      data: trail
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Create new trail (Admin only)
// @route   POST /api/trails
// @access  Private/Admin
exports.createTrail = async (req, res, next) => {
  try {
    const {
      name,
      city,
      state,
      country,
      latitude,
      longitude,
      difficulty,
      distance,
      elevation,
      hikingTime,
      bestTime,
      description,
      safetyTips,
      imageUrl,
      isPopular
    } = req.body;

    if (!name || !description || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide trail name, description, latitude, and longitude.'
      });
    }

    const distNum = parseFloat(distance) || 5.0;
    const elevNum = parseInt(elevation) || 1200;

    let finalImageUrl = imageUrl;
    let imageAuthor = 'TrailExplorer';
    let imageLicense = 'CC BY-SA';
    let imageAttribution = 'Photo via TrailExplorer';
    let sourceUrl = '';

    // If image not provided, fetch from Wikimedia Commons
    if (!finalImageUrl || finalImageUrl.trim() === '') {
      const wikiData = await searchWikimediaImage(name, city || 'Maharashtra');
      finalImageUrl = wikiData.imageUrl;
      imageAuthor = wikiData.author;
      imageLicense = wikiData.license;
      imageAttribution = wikiData.attribution;
      sourceUrl = wikiData.sourceUrl;
    }

    const trail = await Trail.create({
      name: name.trim(),
      city: city ? city.trim() : 'Maharashtra',
      state: state ? state.trim() : 'Maharashtra',
      country: country || 'India',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      difficulty: difficulty || 'Moderate',
      distance: distance || `${distNum} km`,
      distanceNum: distNum,
      elevation: elevation || `${elevNum} m`,
      elevationNum: elevNum,
      hikingTime: hikingTime || '2-3 hrs',
      bestTime: bestTime || 'Oct - Mar',
      description: description.trim(),
      safetyTips: safetyTips || [
        'Carry enough water (at least 2-3 liters)',
        'Wear proper trekking shoes with grip',
        'Start early in the morning'
      ],
      imageUrl: finalImageUrl || '/images/rajgad.png',
      imageAuthor,
      imageLicense,
      imageAttribution,
      sourceUrl,
      isPopular: Boolean(isPopular)
    });

    res.status(201).json({
      success: true,
      message: 'Trail created successfully.',
      data: trail
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trail (Admin only)
// @route   PUT /api/trails/:id
// @access  Private/Admin
exports.updateTrail = async (req, res, next) => {
  try {
    let trail = await Trail.findById(req.params.id);
    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found.'
      });
    }

    if (req.body.distance) {
      req.body.distanceNum = parseFloat(req.body.distance) || trail.distanceNum;
    }
    if (req.body.elevation) {
      req.body.elevationNum = parseInt(req.body.elevation) || trail.elevationNum;
    }
    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    trail = await Trail.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Trail updated successfully.',
      data: trail
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trail (Admin only)
// @route   DELETE /api/trails/:id
// @access  Private/Admin
exports.deleteTrail = async (req, res, next) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found.'
      });
    }

    await trail.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trail deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
