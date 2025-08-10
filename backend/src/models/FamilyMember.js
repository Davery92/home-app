const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: '👤',
    maxlength: 10
  },
  color: {
    type: String,
    default: 'from-blue-400 to-indigo-400',
    maxlength: 100
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  completedToday: {
    type: Number,
    default: 0,
    min: 0
  },
  hasAccount: {
    type: Boolean,
    default: false
  },
  // If this member gets a user account later, link it
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
familyMemberSchema.index({ family: 1 });
familyMemberSchema.index({ family: 1, name: 1 });
familyMemberSchema.index({ linkedUserId: 1 });

// Method to reset daily points
familyMemberSchema.methods.resetDailyPoints = function() {
  this.completedToday = 0;
  return this;
};

// Method to add points
familyMemberSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.completedToday += 1;
  return this;
};

// Method to remove points
familyMemberSchema.methods.removePoints = function(points) {
  this.totalPoints = Math.max(0, this.totalPoints - points);
  this.completedToday = Math.max(0, this.completedToday - 1);
  return this;
};

// Method to clear all points
familyMemberSchema.methods.clearPoints = function() {
  this.totalPoints = 0;
  this.completedToday = 0;
  return this;
};

module.exports = mongoose.model('FamilyMember', familyMemberSchema);