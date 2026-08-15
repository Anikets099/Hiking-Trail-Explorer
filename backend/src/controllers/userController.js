const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const ExploredTrail = require('../models/ExploredTrail');
const CompletedTrail = require('../models/CompletedTrail');
const Trail = require('../models/Trail');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile and statistics (calculated from MongoDB)
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const favoritesCount = await Favorite.countDocuments({ user: user._id });
    const reviewsCount = await Review.countDocuments({ user: user._id });
    const trailsExplored = await ExploredTrail.countDocuments({ user: user._id });
    const completionsCount = await CompletedTrail.countDocuments({ user: user._id });

    // Sync trailsExplored count on user document if needed
    if (user.trailsExplored !== trailsExplored) {
      user.trailsExplored = trailsExplored;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        favoritesCount,
        reviewsCount,
        trailsExplored,
        completionsCount
      }
    });
  } catch (error) {
    next(error);
  }
};


const formatLocationString = (loc, city, state, country) => {
  if (typeof loc === 'string' && loc.trim() && loc.trim() !== 'India' && loc.trim() !== '[object Object]') {
    return loc.trim();
  }
  const cleanCity = city && city !== 'India' ? city : '';
  const parts = [cleanCity, state, country || 'India'].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'India';
};


// @desc    Get all explored trails for current logged-in user
// @route   GET /api/users/me/explored
// @access  Private
exports.getExploredTrails = async (req, res, next) => {
  try {
    const exploredRecords = await ExploredTrail.find({ user: req.user._id })
      .populate('trail')
      .sort({ exploredAt: -1 });

    const formattedList = exploredRecords
      .filter((rec) => rec.trail != null)
      .map((rec) => ({
        _id: rec.trail._id,
        id: rec.trail.slug || rec.trail._id,
        slug: rec.trail.slug,
        name: rec.trail.name,
        location: formatLocationString(rec.trail.location, rec.trail.city),
        city: rec.trail.city,
        difficulty: rec.trail.difficulty || 'Moderate',
        distance: rec.trail.distance || '5.0 km',
        elevation: rec.trail.elevation || '800 m',
        hikingTime: rec.trail.hikingTime || '2-3 hrs',
        imageUrl: rec.trail.imageUrl || rec.trail.image || '/images/default-trail.jpg',
        image: rec.trail.imageUrl || rec.trail.image || '/images/default-trail.jpg',
        rating: rec.trail.rating || 4.8,
        exploredAt: rec.exploredAt || rec.createdAt
      }));

    res.status(200).json({
      success: true,
      count: formattedList.length,
      data: formattedList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews written by current logged-in user
// @route   GET /api/users/me/reviews
// @access  Private
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('trail', 'name slug imageUrl image location city difficulty distance elevation')
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((rev) => ({
      _id: rev._id,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: rev.createdAt,
      date: rev.createdAt,
      trail: rev.trail
        ? {
            _id: rev.trail._id,
            id: rev.trail.slug || rev.trail._id,
            slug: rev.trail.slug,
            name: rev.trail.name,
            location: formatLocationString(rev.trail.location, rev.trail.city),
            city: rev.trail.city,
            difficulty: rev.trail.difficulty || 'Moderate',
            distance: rev.trail.distance || '5.0 km',
            imageUrl: rev.trail.imageUrl || rev.trail.image || '/images/default-trail.jpg',
            image: rev.trail.imageUrl || rev.trail.image || '/images/default-trail.jpg'
          }
        : null
    }));


    res.status(200).json({
      success: true,
      count: formattedReviews.length,
      data: formattedReviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a trail explored/viewed by the user
// @route   POST /api/users/explored/:trailId
// @access  Private
exports.recordTrailExplored = async (req, res, next) => {
  try {
    const { trailId } = req.params;
    if (!trailId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a trailId.'
      });
    }

    const cleanId = String(trailId).trim();
    const incoming = req.body || {};

    let trail = await Trail.findById(cleanId).catch(() => null);
    if (!trail) {
      trail = await Trail.findOne({
        $or: [
          { slug: cleanId.toLowerCase() },
          { externalId: cleanId }
        ]
      });
    }

    const rawName = incoming.name || incoming.title || (trail ? trail.name : '');
    const cleanName = (/^osm\s*node/i.test(rawName) || /^osm-node/i.test(rawName))
      ? (incoming.city ? `${incoming.city} Scenic Trail` : 'Scenic Nature Trail')
      : (rawName || 'Scenic Nature Trail');

    const cleanCity = incoming.city || (trail ? trail.city : '') || 'India';
    const cleanState = incoming.state || (trail ? trail.state : '') || '';
    const cleanCountry = incoming.country || (trail ? trail.country : '') || 'India';
    const cleanImg = incoming.imageUrl || incoming.image || (trail ? trail.imageUrl : '') || '/images/default-trail.jpg';
    const cleanLat = incoming.latitude != null ? incoming.latitude : (trail ? trail.latitude : 18.5204);
    const cleanLng = incoming.longitude != null ? incoming.longitude : (trail ? trail.longitude : 73.8567);

    // If dynamic OSM trail not yet stored, initialize lightweight record
    if (!trail) {
      const slug = cleanId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      try {
        trail = await Trail.create({
          name: cleanName,
          slug: slug,
          externalId: cleanId,
          city: cleanCity,
          state: cleanState,
          country: cleanCountry,
          location: {
            type: 'Point',
            coordinates: [cleanLng, cleanLat]
          },
          latitude: cleanLat,
          longitude: cleanLng,
          distance: incoming.distance || '5.0 km',
          difficulty: incoming.difficulty || 'Moderate',
          elevation: incoming.elevation || '800 m',
          imageUrl: cleanImg,
          description: incoming.description || `Outdoor hiking and trekking trail at ${cleanName}.`,
          source: incoming.source || 'OpenStreetMap'
        });
      } catch (err) {
        trail = await Trail.findOne({ slug });
      }
    } else if (/^osm/i.test(trail.name) && cleanName && !/^osm/i.test(cleanName)) {
      trail.name = cleanName;
      if (cleanCity && cleanCity !== 'India') trail.city = cleanCity;
      if (cleanImg && !cleanImg.includes('rajgad') && (!trail.imageUrl || trail.imageUrl.includes('rajgad') || trail.imageUrl.includes('default'))) {
        trail.imageUrl = cleanImg;
      }
      await trail.save();
    }


    if (trail) {
      await ExploredTrail.findOneAndUpdate(
        { user: req.user._id, trail: trail._id },
        { exploredAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const totalExplored = await ExploredTrail.countDocuments({ user: req.user._id });
      await User.findByIdAndUpdate(req.user._id, { trailsExplored: totalExplored });

      return res.status(200).json({
        success: true,
        message: 'Trail exploration recorded.',
        trailsExplored: totalExplored
      });
    }

    res.status(200).json({
      success: true,
      trailsExplored: await ExploredTrail.countDocuments({ user: req.user._id })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details (Name, Bio)
// @route   PUT /api/users/me
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (bio !== undefined) fieldsToUpdate.bio = bio.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    const favoritesCount = await Favorite.countDocuments({ user: req.user._id });
    const reviewsCount = await Review.countDocuments({ user: req.user._id });
    const trailsExplored = await ExploredTrail.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        ...updatedUser.toObject(),
        favoritesCount,
        reviewsCount,
        trailsExplored
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new profile picture
// @route   POST /api/users/me/profile-image
// @access  Private
exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file (JPG, PNG, or WEBP).'
      });
    }

    const relativeImagePath = `/uploads/profiles/${req.file.filename}`;
    const user = await User.findById(req.user._id);

    // Clean up old file if uploaded
    if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {}
      }
    }

    user.profileImage = relativeImagePath;
    user.profileImageSource = 'upload';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      data: {
        profileImage: user.profileImage,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          bio: user.bio,
          trailsExplored: user.trailsExplored || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom profile image & revert to default avatar
// @route   DELETE /api/users/me/profile-image
// @access  Private
exports.deleteProfilePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {}
      }
    }

    user.profileImage = '/images/avatar.png';
    user.profileImageSource = 'default';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo removed.',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    next(error);
  }
};
