const mongoose = require('mongoose');

const giftItemSchema = new mongoose.Schema({
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
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiftRecipient',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  estimatedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  actualPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  url: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['idea', 'purchase'],
    required: true,
    default: 'idea'
  },
  status: {
    type: String,
    enum: ['idea', 'to_buy', 'ordered', 'to_wrap', 'wrapped', 'given'],
    default: 'idea'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'must_have'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true
  },
  store: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  orderNumber: {
    type: String,
    trim: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fast queries
giftItemSchema.index({ userId: 1, eventId: 1 });
giftItemSchema.index({ eventId: 1, recipientId: 1 });
giftItemSchema.index({ recipientId: 1, type: 1 });
giftItemSchema.index({ userId: 1, type: 1, status: 1 });

const GiftItem = mongoose.model('GiftItem', giftItemSchema);

module.exports = GiftItem;