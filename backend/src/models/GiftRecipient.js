const mongoose = require('mongoose');

const giftRecipientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiftEvent',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    required: true,
    trim: true,
    default: 'Family'
  },
  budget: {
    type: Number,
    min: 0,
    default: 0
  },
  totalSpent: {
    type: Number,
    min: 0,
    default: 0
  },
  ideaCount: {
    type: Number,
    min: 0,
    default: 0
  },
  purchaseCount: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for fast queries
giftRecipientSchema.index({ userId: 1, eventId: 1 });
giftRecipientSchema.index({ eventId: 1, group: 1 });

const GiftRecipient = mongoose.model('GiftRecipient', giftRecipientSchema);

module.exports = GiftRecipient;