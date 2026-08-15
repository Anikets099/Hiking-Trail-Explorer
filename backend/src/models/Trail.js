const mongoose = require('mongoose');

const trailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trail name is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City/Region is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      default: '',
      trim: true,
      index: true
    },

    country: {
      type: String,
      default: 'India'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [73.8567, 18.5204]
      }
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard'],
      default: 'Moderate',
      index: true
    },
    distance: {
      type: String,
      default: '5.0 km'
    },
    distanceNum: {
      type: Number,
      default: 5.0
    },
    elevation: {
      type: String,
      default: '1,200 m'
    },
    elevationNum: {
      type: Number,
      default: 1200
    },
    hikingTime: {
      type: String,
      default: '2-3 hrs'
    },
    bestTime: {
      type: String,
      default: 'Oct - Mar'
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      required: [true, 'Trail description is required']
    },
    safetyTips: {
      type: [String],
      default: [
        'Carry enough water (at least 2-3 liters)',
        'Wear proper trekking shoes with grip',
        'Avoid plastic and pack out your trash',
        'Start early in the morning'
      ]
    },
    imageUrl: {
      type: String,
      default: '/images/default-trail.jpg'
    },
    galleryUrls: {
      type: [String],
      default: []
    },
    imageSource: {
      type: String,
      default: 'Wikimedia Commons'
    },
    imageAuthor: {
      type: String,
      default: ''
    },
    imageLicense: {
      type: String,
      default: ''
    },
    imageAttribution: {
      type: String,
      default: ''
    },
    sourceUrl: {
      type: String,
      default: ''
    },
    externalId: {
      type: String,
      index: true,
      sparse: true
    },
    source: {
      type: String,
      default: 'OpenStreetMap'
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);


// Pre-save to generate slug & sync GeoJSON coordinates
trailSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');
  }
  if (this.latitude != null && this.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

// Indexes for Geospatial and fast text search
trailSchema.index({ location: '2dsphere' });
trailSchema.index({ name: 'text', city: 'text', state: 'text', description: 'text' });

module.exports = mongoose.model('Trail', trailSchema);
