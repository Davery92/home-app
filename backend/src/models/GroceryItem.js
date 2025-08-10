const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unit: {
    type: String,
    trim: true,
    maxlength: 20,
    default: ''
  },
  category: {
    type: String,
    enum: [
      'produce', 'dairy', 'meat', 'seafood', 'bakery', 
      'frozen', 'pantry', 'beverages', 'snacks', 'household', 
      'personal', 'pharmacy', 'other'
    ],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 50
  },
  store: {
    type: String,
    trim: true,
    maxlength: 50
  },
  estimatedPrice: {
    type: Number,
    min: 0
  },
  actualPrice: {
    type: Number,
    min: 0
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  purchasedAt: {
    type: Date
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    lastAdded: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
groceryItemSchema.index({ family: 1, isPurchased: 1 });
groceryItemSchema.index({ family: 1, category: 1 });
groceryItemSchema.index({ family: 1, createdAt: -1 });
groceryItemSchema.index({ family: 1, priority: 1 });

// Virtual for display name with quantity
groceryItemSchema.virtual('displayName').get(function() {
  if (this.quantity > 1 || this.unit) {
    return `${this.name} (${this.quantity}${this.unit ? ' ' + this.unit : ''})`;
  }
  return this.name;
});

// Method to mark as purchased
groceryItemSchema.methods.markPurchased = function(userId, price) {
  this.isPurchased = true;
  this.purchasedAt = new Date();
  this.purchasedBy = userId;
  if (price) {
    this.actualPrice = price;
  }
  return this;
};

// Method to mark as unpurchased
groceryItemSchema.methods.markUnpurchased = function() {
  this.isPurchased = false;
  this.purchasedAt = null;
  this.purchasedBy = null;
  this.actualPrice = null;
  return this;
};

// Static method to find active items for a family
groceryItemSchema.statics.findActiveItems = function(familyId) {
  return this.find({
    family: familyId,
    isActive: true,
    isPurchased: false
  }).sort({ priority: -1, category: 1, name: 1 });
};

// Static method to find purchased items for a family
groceryItemSchema.statics.findPurchasedItems = function(familyId, days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({
    family: familyId,
    isActive: true,
    isPurchased: true,
    purchasedAt: { $gte: dateThreshold }
  }).sort({ purchasedAt: -1 });
};

// Static method to get grocery statistics
groceryItemSchema.statics.getStats = async function(familyId) {
  const [
    totalItems,
    purchasedItems,
    categories,
    totalEstimated,
    totalSpent
  ] = await Promise.all([
    this.countDocuments({ family: familyId, isActive: true, isPurchased: false }),
    this.countDocuments({ family: familyId, isActive: true, isPurchased: true }),
    this.distinct('category', { family: familyId, isActive: true, isPurchased: false }),
    this.aggregate([
      { $match: { family: mongoose.Types.ObjectId(familyId), isActive: true, isPurchased: false } },
      { $group: { _id: null, total: { $sum: '$estimatedPrice' } } }
    ]),
    this.aggregate([
      { 
        $match: { 
          family: mongoose.Types.ObjectId(familyId), 
          isActive: true, 
          isPurchased: true,
          actualPrice: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: '$actualPrice' } } }
    ])
  ]);

  return {
    totalItems,
    purchasedItems,
    activeCategories: categories.length,
    estimatedCost: totalEstimated[0]?.total || 0,
    totalSpent: totalSpent[0]?.total || 0
  };
};

// Static method to find items by category
groceryItemSchema.statics.findByCategory = function(familyId, category) {
  return this.find({
    family: familyId,
    category,
    isActive: true,
    isPurchased: false
  }).sort({ priority: -1, name: 1 });
};

// Static method to clear purchased items
groceryItemSchema.statics.clearPurchased = function(familyId) {
  return this.updateMany(
    { family: familyId, isPurchased: true },
    { $set: { isActive: false } }
  );
};

module.exports = mongoose.model('GroceryItem', groceryItemSchema);