const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
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
    trim: true,
    maxlength: 500
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  recipe: {
    ingredients: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      amount: {
        type: String,
        required: true
      },
      unit: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    instructions: [{
      step: {
        type: Number,
        required: true
      },
      instruction: {
        type: String,
        required: true,
        trim: true
      },
      duration: {
        type: Number // in minutes
      }
    }],
    prepTime: {
      type: Number, // in minutes
      min: 0
    },
    cookTime: {
      type: Number, // in minutes
      min: 0
    },
    servings: {
      type: Number,
      min: 1,
      default: 4
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    cuisine: {
      type: String,
      trim: true
    },
    dietaryTags: [{
      type: String,
      trim: true
    }],
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
mealPlanSchema.index({ family: 1, scheduledDate: -1 });
mealPlanSchema.index({ family: 1, mealType: 1 });
mealPlanSchema.index({ family: 1, status: 1 });
mealPlanSchema.index({ family: 1, isFavorite: 1 });

// Virtual for total cooking time
mealPlanSchema.virtual('totalTime').get(function() {
  return (this.recipe.prepTime || 0) + (this.recipe.cookTime || 0);
});

// Virtual for recipe difficulty display
mealPlanSchema.virtual('difficultyDisplay').get(function() {
  const levels = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐'
  };
  return levels[this.recipe.difficulty] || levels.medium;
});

// Method to mark meal as completed
mealPlanSchema.methods.markCompleted = function(userId, rating = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  if (rating) {
    this.rating = rating;
  }
  return this;
};

// Method to mark meal as favorite
mealPlanSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this;
};

// Static method to find meals by date range
mealPlanSchema.statics.findByDateRange = function(familyId, startDate, endDate) {
  return this.find({
    family: familyId,
    isActive: true,
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ scheduledDate: 1, mealType: 1 });
};

// Static method to find meals for today
mealPlanSchema.statics.findTodaysMeals = function(familyId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    family: familyId,
    isActive: true,
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ 
    scheduledDate: 1,
    mealType: 1 
  }).populate('createdBy', 'profile email');
};

// Static method to find favorite meals
mealPlanSchema.statics.findFavorites = function(familyId) {
  return this.find({
    family: familyId,
    isActive: true,
    isFavorite: true
  }).sort({ updatedAt: -1 });
};

// Static method to get meal plan statistics
mealPlanSchema.statics.getStats = async function(familyId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  
  const [
    totalMeals,
    todaysMeals,
    thisWeekMeals,
    completedMeals,
    favoriteMeals,
    mealsByType
  ] = await Promise.all([
    this.countDocuments({ family: familyId, isActive: true }),
    this.countDocuments({ 
      family: familyId, 
      isActive: true, 
      scheduledDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }),
    this.countDocuments({ 
      family: familyId, 
      isActive: true, 
      scheduledDate: { $gte: today, $lte: weekFromNow }
    }),
    this.countDocuments({ 
      family: familyId, 
      isActive: true, 
      status: 'completed' 
    }),
    this.countDocuments({ 
      family: familyId, 
      isActive: true, 
      isFavorite: true 
    }),
    this.aggregate([
      { $match: { family: new mongoose.Types.ObjectId(familyId), isActive: true } },
      { $group: { _id: '$mealType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    totalMeals,
    todaysMeals,
    thisWeekMeals,
    completedMeals,
    favoriteMeals,
    mealsByType: mealsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// Static method to find meals by ingredients (for grocery integration)
mealPlanSchema.statics.findByIngredients = function(familyId, ingredients) {
  return this.find({
    family: familyId,
    isActive: true,
    'recipe.ingredients.name': { 
      $in: ingredients.map(ing => new RegExp(ing, 'i')) 
    }
  });
};

// Static method to get shopping list from planned meals
mealPlanSchema.statics.getShoppingList = async function(familyId, startDate, endDate) {
  const meals = await this.find({
    family: familyId,
    isActive: true,
    status: 'planned',
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  });

  const ingredients = {};
  
  meals.forEach(meal => {
    meal.recipe.ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      if (ingredients[key]) {
        // Simple aggregation - in real app would need unit conversion
        ingredients[key].amount += ` + ${ingredient.amount}`;
      } else {
        ingredients[key] = {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          meals: [meal.title]
        };
      }
    });
  });

  return Object.values(ingredients);
};

module.exports = mongoose.model('MealPlan', mealPlanSchema);