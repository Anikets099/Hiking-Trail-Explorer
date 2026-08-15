const mongoose = require('mongoose');

const exploredTrailSchema = new mongoose.Schema(
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
    exploredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique entry per user and trail
exploredTrailSchema.index({ user: 1, trail: 1 }, { unique: true });

module.exports = mongoose.model('ExploredTrail', exploredTrailSchema);
