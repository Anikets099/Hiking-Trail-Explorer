const mongoose = require('mongoose');
const CompletedTrail = require('../models/CompletedTrail');
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

// Achievement Badges Configuration
const BADGES_CONFIG = [
  {
    id: 'first-adventure',
    title: 'First Adventure',
    icon: '🥾',
    requiredCount: 1,
    description: 'Completed your first hiking trail!'
  },
  {
    id: 'explorer',
    title: 'Explorer',
    icon: '🌄',
    requiredCount: 5,
    description: 'Conquered 5 scenic hiking trails!'
  },
  {
    id: 'mountain-trekker',
    title: 'Mountain Trekker',
    icon: '🏔️',
    requiredCount: 10,
    description: 'Mastered 10 high-altitude mountain trails!'
  },
  {
    id: 'adventure-master',
    title: 'Adventure Master',
    icon: '🔥',
    requiredCount: 25,
    description: 'Experienced trekker with 25 trails completed!'
  },
  {
    id: 'legendary-explorer',
    title: 'Legendary Explorer',
    icon: '👑',
    requiredCount: 50,
    description: 'Legendary hiker with 50+ trails conquered!'
  }
];

// @desc    Get all completed trails & achievements for authenticated user
// @route   GET /api/completions
// @access  Private
exports.getCompletions = async (req, res, next) => {
  try {
    const completedRecords = await CompletedTrail.find({ user: req.user._id })
      .populate('trail')
      .sort({ completedAt: -1 });

    const formattedList = completedRecords.map((rec) => {
      const t = rec.trail ? (rec.trail.toObject ? rec.trail.toObject() : rec.trail) : null;
      const rawName = t?.name || rec.trailName || '';
      const cleanName = cleanTrailName(rawName, rec.location ? `${rec.location} Trail` : 'Completed Trail');
      const cleanImg = rec.trailImage || t?.imageUrl || t?.image || '/images/default-trail.jpg';
      const cleanLoc = formatLocationString(rec.location || t?.location, t?.city, t?.state, t?.country);

      return {
        _id: rec._id,
        trailId: rec.trail?._id || rec.externalId,
        id: rec.trail?.slug || rec.externalId || (rec.trail?._id ? rec.trail._id.toString() : rec._id),
        slug: rec.trail?.slug || rec.externalId,
        name: cleanName,
        trailName: cleanName,
        imageUrl: cleanImg,
        trailImage: cleanImg,
        image: cleanImg,
        location: cleanLoc,
        city: t?.city || '',
        state: t?.state || '',
        difficulty: rec.difficulty || t?.difficulty || 'Moderate',
        distance: rec.distance || t?.distance || '5.0 km',
        elevation: rec.elevation || t?.elevation || '800 m',
        rating: rec.rating || t?.rating || 4.8,
        completedAt: rec.completedAt || rec.createdAt,
        completed: true
      };
    });

    const totalCompleted = formattedList.length;

    // Evaluate badges
    const badges = BADGES_CONFIG.map((badge) => {
      const unlocked = totalCompleted >= badge.requiredCount;
      const progress = Math.min(totalCompleted, badge.requiredCount);
      return {
        ...badge,
        unlocked,
        progress,
        progressPercent: Math.round((progress / badge.requiredCount) * 100)
      };
    });

    res.status(200).json({
      success: true,
      count: totalCompleted,
      totalCompleted,
      badges,
      data: formattedList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a trail as completed
// @route   POST /api/completions or POST /api/completions/:trailId
// @access  Private
exports.markCompleted = async (req, res, next) => {
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

    // 1. Find or create Trail document in MongoDB
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

    const rawName = incoming.name || incoming.title || (trail ? trail.name : '');
    const cleanName = cleanTrailName(rawName, incoming.city ? `${incoming.city} Scenic Trail` : 'Scenic Nature Trail');
    const cleanCity = incoming.city || (trail ? trail.city : '') || 'India';
    const cleanState = incoming.state || (trail ? trail.state : '') || '';
    const cleanCountry = incoming.country || (trail ? trail.country : '') || 'India';
    const cleanLoc = formatLocationString(incoming.location, cleanCity, cleanState, cleanCountry);
    const cleanImg = incoming.imageUrl || incoming.image || (trail ? trail.imageUrl : '') || '/images/default-trail.jpg';
    const cleanDiff = incoming.difficulty || (trail ? trail.difficulty : '') || 'Moderate';
    const cleanDist = incoming.distance || (trail ? trail.distance : '') || '5.0 km';
    const cleanEle = incoming.elevation || (trail ? trail.elevation : '') || '800 m';
    const cleanRating = incoming.rating || (trail ? trail.rating : 4.8) || 4.8;
    const cleanLat = incoming.latitude != null ? incoming.latitude : (trail ? trail.latitude : 18.5204);
    const cleanLng = incoming.longitude != null ? incoming.longitude : (trail ? trail.longitude : 73.8567);

    if (!trail) {
      const slug = externalId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      try {
        trail = await Trail.create({
          name: cleanName,
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
          imageUrl: cleanImg,
          imageSource: incoming.imageSource || 'Wikimedia Commons',
          description: incoming.description || `Scenic hiking trail at ${cleanLoc}.`,
          source: incoming.source || 'OpenStreetMap'
        });
      } catch (err) {
        trail = await Trail.findOne({ slug });
      }
    } else if (
      (/^osm/i.test(trail.name) || trail.name === 'Scenic Nature Trail') &&
      cleanName && cleanName !== trail.name && !/^osm/i.test(cleanName)
    ) {
      trail.name = cleanName;
      if (cleanCity && cleanCity !== 'India') trail.city = cleanCity;
      if (cleanImg && !cleanImg.includes('default') && (!trail.imageUrl || trail.imageUrl.includes('default'))) {
        trail.imageUrl = cleanImg;
      }
      await trail.save();
    }

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Could not create or find trail record.'
      });
    }

    // 2. Check if already completed by this user (prevent duplicate)
    const existing = await CompletedTrail.findOne({
      user: req.user._id,
      $or: [
        { trail: trail._id },
        { externalId: externalId }
      ]
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Trail is already marked as completed.',
        data: existing,
        completed: true
      });
    }

    // 3. Create CompletedTrail record
    const completedRecord = await CompletedTrail.create({
      user: req.user._id,
      trail: trail._id,
      externalId: externalId,
      trailName: cleanName,
      trailImage: cleanImg,
      location: cleanLoc,
      difficulty: cleanDiff,
      distance: cleanDist,
      elevation: cleanEle,
      rating: cleanRating,
      completedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Trail marked as completed successfully!',
      data: completedRecord,
      completed: true
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Trail is already marked as completed.',
        completed: true
      });
    }
    next(error);
  }
};

// @desc    Remove completion for a trail
// @route   DELETE /api/completions/:trailId
// @access  Private
exports.removeCompletion = async (req, res, next) => {
  try {
    const targetId = req.params.trailId;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid trailId.'
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

    await CompletedTrail.findOneAndDelete({
      user: req.user._id,
      $or: orConditions
    });

    res.status(200).json({
      success: true,
      message: 'Trail completion removed.',
      completed: false
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check completion status of a trail for authenticated user
// @route   GET /api/completions/check/:trailId
// @access  Private
exports.checkCompletion = async (req, res, next) => {
  try {
    const targetId = req.params.trailId;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid trailId.'
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

    const record = await CompletedTrail.findOne({
      user: req.user._id,
      $or: orConditions
    });

    res.status(200).json({
      success: true,
      completed: Boolean(record),
      completedAt: record ? record.completedAt : null
    });
  } catch (error) {
    next(error);
  }
};
