const mongoose = require('mongoose');

const completedTrailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    trail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trail',
      required: true,
      index: true
    },
    externalId: {
      type: String,
      index: true
    },
    trailName: {
      type: String,
      required: true
    },
    trailImage: {
      type: String,
      default: '/images/default-trail.jpg'
    },
    location: {
      type: String,
      default: 'India'
    },
    difficulty: {
      type: String,
      default: 'Moderate'
    },
    distance: {
      type: String,
      default: '5.0 km'
    },
    elevation: {
      type: String,
      default: '800 m'
    },
    rating: {
      type: Number,
      default: 4.8
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate completion records per user
completedTrailSchema.index({ user: 1, trail: 1 }, { unique: true });

module.exports = mongoose.model('CompletedTrail', completedTrailSchema);
