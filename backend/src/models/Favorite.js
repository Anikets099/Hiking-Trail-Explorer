const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
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
      required: true
    },
    externalId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate favorites per user
favoriteSchema.index({ user: 1, trail: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
