const mongoose = require('mongoose');

const choreSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 1
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // Can be assigned to either a User (has account) or FamilyMember (no account)
  assignedToUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    default: null
  },
  // For display purposes, we'll also store the name
  assignedToName: {
    type: String,
    required: true,
    trim: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedByName: {
    type: String,
    required: true,
    trim: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['cleaning', 'kitchen', 'yard', 'pets', 'personal', 'other'],
    default: 'other'
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    lastReset: { type: Date, default: null }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
choreSchema.index({ family: 1 });
choreSchema.index({ family: 1, isCompleted: 1 });
choreSchema.index({ assignedToUser: 1 });
choreSchema.index({ assignedToMember: 1 });
choreSchema.index({ assignedBy: 1 });
choreSchema.index({ dueDate: 1 });

// Validate that chore is assigned to either a user or member, but not both
choreSchema.pre('save', function(next) {
  if (this.assignedToUser && this.assignedToMember) {
    return next(new Error('Chore cannot be assigned to both a user and a family member'));
  }
  if (!this.assignedToUser && !this.assignedToMember) {
    return next(new Error('Chore must be assigned to either a user or a family member'));
  }
  next();
});

// Method to mark as completed
choreSchema.methods.markCompleted = function(completedByUserId) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.completedBy = completedByUserId;
  return this;
};

// Method to mark as incomplete
choreSchema.methods.markIncomplete = function() {
  this.isCompleted = false;
  this.completedAt = null;
  this.completedBy = null;
  return this;
};

// Method to check if overdue
choreSchema.methods.isOverdue = function() {
  return this.dueDate && new Date() > this.dueDate && !this.isCompleted;
};

module.exports = mongoose.model('Chore', choreSchema);