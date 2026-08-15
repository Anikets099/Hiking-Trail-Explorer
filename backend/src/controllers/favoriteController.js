const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Trail = require('../models/Trail');

// Helper to format clean, specific location strings
const formatLocationString = (loc, city, state, country) => {
  if (typeof loc === 'string' && loc.trim() && loc.trim() !== 'India' && loc.trim() !== '[object Object]') {
    return loc.trim();
  }
  const cleanCity = city && city !== 'India' ? city : '';
  const parts = [cleanCity, state, country || 'India'].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'India';
};

// Helper to clean up trail names
const cleanTrailName = (name, fallback) => {
  if (!name || typeof name !== 'string') return fallback || 'Scenic Nature Trail';
  const trimmed = name.trim();
  if (/^osm\s*node/i.test(trimmed) || /^osm-node/i.test(trimmed) || /^node\s*\d+/i.test(trimmed)) {
    return fallback || 'Scenic Nature Trail';
  }
  return trimmed;
};

// @desc    Get logged-in user's favorites
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('trail')
      .sort({ createdAt: -1 });

    const validTrails = favorites
      .filter((fav) => fav.trail != null)
      .map((fav) => {
        const t = fav.trail.toObject ? fav.trail.toObject() : fav.trail;
        
        let displayName = t.name;
        if (!displayName || /^osm\s*node/i.test(displayName) || /^osm-node/i.test(displayName)) {
          displayName = t.city && t.city !== 'India' ? `${t.city} Scenic Trail` : 'Trail information unavailable';
        }

        const formattedLoc = formatLocationString(t.location, t.city, t.state, t.country);

        return {
          ...t,
          id: t.slug || t.externalId || (t._id ? t._id.toString() : null),
          name: displayName,
          location: formattedLoc,
          city: t.city || 'India',
          state: t.state || '',
          imageUrl: t.imageUrl || t.image || '/images/default-trail.jpg',
          image: t.imageUrl || t.image || '/images/default-trail.jpg',
          difficulty: t.difficulty || 'Moderate',
          distance: t.distance || '5.0 km',
          elevation: t.elevation || '800 m',
          rating: t.rating || 4.8,
          savedAt: fav.createdAt
        };
      });

    res.status(200).json({
      success: true,
      count: validTrails.length,
      data: validTrails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add trail to user favorites with complete trail data
// @route   POST /api/favorites or POST /api/favorites/:trailId
// @access  Private
exports.addFavorite = async (req, res, next) => {
  try {
    const targetId = req.params.trailId || req.body.trailId || req.body.id || req.body._id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid trailId.'
      });
    }

    const externalId = String(targetId).trim();
    const incoming = req.body || {};

    // 1. Try finding existing trail by Mongo _id, slug, or externalId
    let trail = null;
    if (mongoose.Types.ObjectId.isValid(externalId)) {
      trail = await Trail.findById(externalId);
    }
    if (!trail) {
      trail = await Trail.findOne({
        $or: [
          { slug: externalId.toLowerCase() },
          { externalId: externalId }
        ]
      });
    }

    // Determine clean place name
    const rawIncomingName = incoming.name || incoming.title || '';
    const cleanIncomingName = cleanTrailName(rawIncomingName, null);

    const cleanCity = (incoming.city && incoming.city !== 'India')
      ? incoming.city
      : (trail && trail.city !== 'India' ? trail.city : 'India');
    const cleanState = incoming.state || (trail ? trail.state : '') || '';
    const cleanCountry = incoming.country || (trail ? trail.country : '') || 'India';
    const cleanLoc = formatLocationString(incoming.location, cleanCity, cleanState, cleanCountry);
    const cleanImg = incoming.imageUrl || incoming.image || (trail ? trail.imageUrl : '') || '/images/default-trail.jpg';
    const cleanDiff = incoming.difficulty || (trail ? trail.difficulty : '') || 'Moderate';
    const cleanDist = incoming.distance || (trail ? trail.distance : '') || '5.0 km';
    const cleanEle = incoming.elevation || (trail ? trail.elevation : '') || '800 m';
    const cleanRating = incoming.rating || (trail ? trail.rating : 4.8) || 4.8;
    const cleanReviewCount = incoming.reviewCount || (trail ? trail.reviewCount : 0) || 0;
    const cleanLat = incoming.latitude != null ? incoming.latitude : (trail ? trail.latitude : 18.5204);
    const cleanLng = incoming.longitude != null ? incoming.longitude : (trail ? trail.longitude : 73.8567);

    // 2. If trail exists, update with incoming rich details
    if (trail) {
      if (cleanIncomingName) {
        trail.name = cleanIncomingName;
      } else if (/^osm/i.test(trail.name)) {
        trail.name = cleanCity && cleanCity !== 'India' ? `${cleanCity} Scenic Trail` : 'Scenic Nature Trail';
      }

      if (cleanCity && cleanCity !== 'India') trail.city = cleanCity;
      if (cleanState) trail.state = cleanState;
      if (cleanImg && !cleanImg.includes('rajgad') && (!trail.imageUrl || trail.imageUrl.includes('rajgad') || trail.imageUrl.includes('default'))) {
        trail.imageUrl = cleanImg;
      }
      if (cleanLat && cleanLng) {
        trail.latitude = cleanLat;
        trail.longitude = cleanLng;
      }
      trail.externalId = externalId;
      await trail.save();
    } else {
      // 3. Create complete Trail document
      const fallbackName = cleanCity && cleanCity !== 'India' ? `${cleanCity} Scenic Trail` : 'Scenic Nature Trail';
      const finalName = cleanIncomingName || fallbackName;
      const slug = externalId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      try {
        trail = await Trail.create({
          name: finalName,
          slug: slug,
          externalId: externalId,
          city: cleanCity,
          state: cleanState,
          country: cleanCountry,
          location: {
            type: 'Point',
            coordinates: [cleanLng, cleanLat]
          },
          latitude: cleanLat,
          longitude: cleanLng,
          difficulty: cleanDiff,
          distance: cleanDist,
          elevation: cleanEle,
          rating: cleanRating,
          reviewCount: cleanReviewCount,
          imageUrl: cleanImg,
          imageSource: incoming.imageSource || 'Wikimedia Commons',
          description: incoming.description || `Scenic outdoor hiking and trekking trail located in ${cleanLoc}.`,
          source: incoming.source || 'OpenStreetMap'
        });
      } catch (err) {
        trail = await Trail.findOne({ slug });
      }
    }

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Could not create or find trail record.'
      });
    }

    // 4. Upsert Favorite record for current user
    const existing = await Favorite.findOne({ user: req.user._id, trail: trail._id });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Trail already saved in favorites.',
        data: trail
      });
    }

    await Favorite.create({
      user: req.user._id,
      trail: trail._id,
      externalId: externalId
    });

    res.status(201).json({
      success: true,
      message: 'Trail saved to favorites with complete details.',
      data: trail
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Trail already saved in favorites.'
      });
    }
    next(error);
  }
};

// @desc    Remove trail from user favorites
// @route   DELETE /api/favorites/:trailId
// @access  Private
exports.removeFavorite = async (req, res, next) => {
  try {
    const targetId = req.params.trailId || req.body?.trailId;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid trailId to remove.'
      });
    }

    const cleanTargetId = String(targetId).trim();

    let trail = null;
    if (mongoose.Types.ObjectId.isValid(cleanTargetId)) {
      trail = await Trail.findById(cleanTargetId);
    }
    if (!trail) {
      trail = await Trail.findOne({
        $or: [
          { slug: cleanTargetId.toLowerCase() },
          { externalId: cleanTargetId }
        ]
      });
    }

    const orConditions = [{ externalId: cleanTargetId }];
    if (mongoose.Types.ObjectId.isValid(cleanTargetId)) {
      orConditions.push({ trail: cleanTargetId });
    }
    if (trail) {
      orConditions.push({ trail: trail._id });
    }

    await Favorite.findOneAndDelete({
      user: req.user._id,
      $or: orConditions
    });

    res.status(200).json({
      success: true,
      message: 'Trail removed from favorites.'
    });
  } catch (error) {
    next(error);
  }
};
