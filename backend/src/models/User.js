const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: ['parent', 'child', 'guardian'],
      default: 'parent'
    }
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null
  },
  points: {
    total: { type: Number, default: 0 },
    completedToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      familyUpdates: { type: Boolean, default: true }
    },
    privacy: {
      shareCalendar: { type: Boolean, default: true },
      shareLocation: { type: Boolean, default: false }
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      timezone: { type: String, default: 'UTC' },
      language: { type: String, default: 'en' }
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ familyId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Reset daily points if it's a new day
userSchema.methods.resetDailyPointsIfNeeded = function() {
  const today = new Date();
  const lastReset = this.points.lastResetDate;
  
  if (today.toDateString() !== lastReset.toDateString()) {
    this.points.completedToday = 0;
    this.points.lastResetDate = today;
  }
};

// Add points
userSchema.methods.addPoints = function(points) {
  this.resetDailyPointsIfNeeded();
  this.points.total += points;
  this.points.completedToday += 1;
};

// Remove points
userSchema.methods.removePoints = function(points) {
  this.resetDailyPointsIfNeeded();
  this.points.total = Math.max(0, this.points.total - points);
  this.points.completedToday = Math.max(0, this.points.completedToday - 1);
};

// Clear all points
userSchema.methods.clearPoints = function() {
  this.points.total = 0;
  this.points.completedToday = 0;
  this.points.lastResetDate = new Date();
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);