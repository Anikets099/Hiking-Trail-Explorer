const Review = require('../models/Review');
const Trail = require('../models/Trail');

// Recalculates a trail's average rating & review count from its current reviews
const syncTrailRating = async (trailId) => {
  const reviews = await Review.find({ trail: trailId }).select('rating');
  if (reviews.length === 0) {
    await Trail.findByIdAndUpdate(trailId, { rating: 4.5, reviewCount: 0 });
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Trail.findByIdAndUpdate(trailId, {
    rating: parseFloat(avg.toFixed(1)),
    reviewCount: reviews.length
  });
};

// Finds a trail by Mongo id, slug, or OpenStreetMap identifier
const findTrailByIdentifier = async (identifier) => {
  const cleanId = String(identifier || '').trim();
  if (!cleanId) return null;
  if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
    const byId = await Trail.findById(cleanId);
    if (byId) return byId;
  }
  return Trail.findOne({
    $or: [{ slug: cleanId.toLowerCase() }, { externalId: cleanId }]
  });
};

// @desc    Get reviews for a trail
// @route   GET /api/trails/:trailId/reviews
// @access  Public
exports.getTrailReviews = async (req, res, next) => {
  try {
    const { trailId } = req.params;

    // Find trail by id or slug
    const trail = await findTrailByIdentifier(trailId);

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found.'
      });
    }

    const reviews = await Review.find({ trail: trail._id })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for a trail
// @route   POST /api/trails/:trailId/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { trailId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both rating (1-5) and review comment.'
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const trail = await findTrailByIdentifier(trailId);

    if (!trail) {
      return res.status(404).json({
        success: false,
        message: 'Trail not found.'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      trail: trail._id,
      rating: ratingNum,
      comment: comment.trim()
    });

    // Recalculate trail average rating & review count
    await syncTrailRating(trail._id);

    const populatedReview = await Review.findById(review._id).populate('user', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Review added successfully.',
      data: populatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:reviewId
// @access  Private (Owner or Admin)
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit another user review.'
      });
    }

    const { rating, comment } = req.body;
    if (rating != null && rating !== '') {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5.'
        });
      }
      review.rating = ratingNum;
    }
    if (typeof comment === 'string' && comment.trim()) review.comment = comment.trim();

    await review.save();
    await syncTrailRating(review.trail);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review.'
      });
    }

    const trailId = review.trail;
    await review.deleteOne();

    // Recalculate trail average rating
    await syncTrailRating(trailId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
