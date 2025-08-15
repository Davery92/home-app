const mongoose = require('mongoose');

const giftEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  eventDate: {
    type: Date
  },
  totalBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  totalSpent: {
    type: Number,
    min: 0,
    default: 0
  },
  recipientCount: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['planning', 'shopping', 'completed', 'archived'],
    default: 'planning'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fast queries by user
giftEventSchema.index({ userId: 1, createdAt: -1 });
giftEventSchema.index({ userId: 1, isArchived: 1 });

const GiftEvent = mongoose.model('GiftEvent', giftEventSchema);

module.exports = GiftEvent;