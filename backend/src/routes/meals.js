const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireFamily, requireFamilyPermission } = require('../middleware/auth');
const ollamaService = require('../utils/ollama');

const router = express.Router();

// Get today's meal plan
router.get('/today', authenticateToken, requireFamily, async (req, res) => {
  try {
    // In real app, this would fetch from database
    // For now, return sample data
    const sampleMealPlan = {
      date: new Date().toISOString().split('T')[0],
      meals: {
        breakfast: ['Oatmeal with berries', 'Caesar Salad'],
        lunch: ['Lasagna', 'Apple Pie', 'Soft Pretzels'],
        dinner: ['Jambalaya', 'Guacamole']
      },
      generatedBy: 'AI',
      familyId: req.family._id
    };

    res.json({ mealPlan: sampleMealPlan });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ message: 'Failed to fetch meal plan' });
  }
});

// Generate AI meal plan
router.post('/generate-ai', 
  authenticateToken, 
  requireFamily, 
  requireFamilyPermission('manageMeals'),
  [
    body('familySize').optional().isInt({ min: 1, max: 20 }),
    body('dietaryRestrictions').optional().isArray(),
    body('cuisine').optional().isString(),
    body('budget').optional().isIn(['low', 'moderate', 'high']),
    body('cookingTime').optional().isIn(['quick', 'moderate', 'long'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const preferences = {
        familySize: req.body.familySize || req.family.memberCount,
        dietaryRestrictions: req.body.dietaryRestrictions || [],
        cuisine: req.body.cuisine || 'any',
        budget: req.body.budget || 'moderate',
        cookingTime: req.body.cookingTime || 'moderate'
      };

      console.log('Generating meal plan with preferences:', preferences);
      
      const mealPlan = await ollamaService.generateMealPlan(preferences);

      const generatedPlan = {
        date: new Date().toISOString().split('T')[0],
        meals: mealPlan,
        preferences,
        generatedBy: 'AI',
        generatedAt: new Date(),
        familyId: req.family._id
      };

      // In a real app, save to database here
      // await MealPlan.create(generatedPlan);

      res.json({ 
        message: 'Meal plan generated successfully',
        mealPlan: generatedPlan 
      });

    } catch (error) {
      console.error('AI meal generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate meal plan',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Test Ollama connection
router.get('/test-ai', authenticateToken, async (req, res) => {
  try {
    const connectionStatus = await ollamaService.testConnection();
    res.json({
      message: 'Ollama connection test',
      ...connectionStatus
    });
  } catch (error) {
    res.status(500).json({
      message: 'Connection test failed',
      error: error.message
    });
  }
});

// Generate grocery list from meal plan
router.post('/generate-grocery', 
  authenticateToken, 
  requireFamily, 
  requireFamilyPermission('manageMeals'),
  async (req, res) => {
    try {
      const { mealPlan, currentGroceries = [] } = req.body;

      if (!mealPlan || !mealPlan.meals) {
        return res.status(400).json({ message: 'Valid meal plan required' });
      }

      const groceryItems = await ollamaService.generateGroceryList(
        mealPlan.meals, 
        currentGroceries
      );

      res.json({
        message: 'Grocery list generated from meal plan',
        groceryItems,
        basedOnMeals: mealPlan.meals
      });

    } catch (error) {
      console.error('Grocery generation error:', error);
      res.status(500).json({ message: 'Failed to generate grocery list' });
    }
  }
);

module.exports = router;