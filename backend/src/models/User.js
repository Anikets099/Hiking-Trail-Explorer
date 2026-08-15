const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    profileImage: {
      type: String,
      default: '/images/avatar.png'
    },
    profileImageSource: {
      type: String,
      default: 'local'
    },
    bio: {
      type: String,
      default: ''
    },
    trailsExplored: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
