const Review = require('../models/Review');
const Trail = require('../models/Trail');

// @desc    Get reviews for a trail
// @route   GET /api/trails/:trailId/reviews
// @access  Public
exports.getTrailReviews = async (req, res, next) => {
  try {
    const { trailId } = req.params;

    // Find trail by id or slug
    let trail = await Trail.findById(trailId).catch(() => null);
    if (!trail) {
      trail = await Trail.findOne({ slug: trailId.toLowerCase().trim() });
    }

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

    if (!rating || !comment) {
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

    let trail = await Trail.findById(trailId).catch(() => null);
    if (!trail) {
      trail = await Trail.findOne({ slug: trailId.toLowerCase().trim() });
    }

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
    const allReviews = await Review.find({ trail: trail._id });
    const avgRating = (
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    ).toFixed(1);

    trail.rating = parseFloat(avgRating);
    trail.reviewCount = allReviews.length;
    await trail.save();

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
    if (rating) review.rating = parseInt(rating, 10);
    if (comment) review.comment = comment.trim();

    await review.save();

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
    const remainingReviews = await Review.find({ trail: trailId });
    if (remainingReviews.length > 0) {
      const avg = (
        remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
      ).toFixed(1);
      await Trail.findByIdAndUpdate(trailId, {
        rating: parseFloat(avg),
        reviewCount: remainingReviews.length
      });
    } else {
      await Trail.findByIdAndUpdate(trailId, {
        rating: 4.5,
        reviewCount: 0
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
