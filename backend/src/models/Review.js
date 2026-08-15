const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trail',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating between 1 and 5 is required'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Review', reviewSchema);
