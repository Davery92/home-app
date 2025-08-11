const express = require('express');
const { body, query, validationResult } = require('express-validator');
const MealPlan = require('../models/MealPlan');
const { authenticateToken, requireFamily, requireFamilyPermission } = require('../middleware/auth');
const ollamaService = require('../utils/ollama');

const router = express.Router();

// Get all meal plans
router.get('/', authenticateToken, requireFamily, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  query('status').optional().isIn(['planned', 'in-progress', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, mealType, status } = req.query;
    let query = {
      family: req.family._id,
      isActive: true
    };

    // Add filters
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (mealType) query.mealType = mealType;
    if (status) query.status = status;

    const meals = await MealPlan.find(query)
      .populate('createdBy', 'profile email')
      .populate('completedBy', 'profile email')
      .populate('assignedTo', 'profile email')
      .sort({ scheduledDate: 1, mealType: 1 });

    res.json({
      success: true,
      meals: meals.map(meal => ({
        id: meal._id,
        title: meal.title,
        description: meal.description,
        mealType: meal.mealType,
        scheduledDate: meal.scheduledDate,
        recipe: meal.recipe,
        aiGenerated: meal.aiGenerated,
        createdBy: {
          id: meal.createdBy._id,
          name: `${meal.createdBy.profile.firstName} ${meal.createdBy.profile.lastName}`
        },
        assignedTo: meal.assignedTo?.map(user => ({
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`
        })) || [],
        status: meal.status,
        completedAt: meal.completedAt,
        completedBy: meal.completedBy ? {
          id: meal.completedBy._id,
          name: `${meal.completedBy.profile.firstName} ${meal.completedBy.profile.lastName}`
        } : null,
        rating: meal.rating,
        notes: meal.notes,
        tags: meal.tags,
        isFavorite: meal.isFavorite,
        totalTime: meal.totalTime,
        difficultyDisplay: meal.difficultyDisplay,
        createdAt: meal.createdAt,
        updatedAt: meal.updatedAt
      })),
      total: meals.length
    });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ message: 'Failed to fetch meal plans' });
  }
});

// Get today's meals
router.get('/today', authenticateToken, requireFamily, async (req, res) => {
  try {
    const meals = await MealPlan.findTodaysMeals(req.family._id);

    res.json({
      success: true,
      meals: meals.map(meal => ({
        id: meal._id,
        title: meal.title,
        mealType: meal.mealType,
        scheduledDate: meal.scheduledDate,
        status: meal.status,
        recipe: {
          prepTime: meal.recipe.prepTime,
          cookTime: meal.recipe.cookTime,
          servings: meal.recipe.servings,
          difficulty: meal.recipe.difficulty
        },
        totalTime: meal.totalTime,
        difficultyDisplay: meal.difficultyDisplay
      })),
      totalMeals: meals.length
    });

  } catch (error) {
    console.error('Error fetching today\'s meals:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s meals' });
  }
});

// Get favorite meals
router.get('/favorites', authenticateToken, requireFamily, async (req, res) => {
  try {
    const meals = await MealPlan.findFavorites(req.family._id)
      .populate('createdBy', 'profile email');

    res.json({
      success: true,
      meals: meals.map(meal => ({
        id: meal._id,
        title: meal.title,
        description: meal.description,
        mealType: meal.mealType,
        recipe: meal.recipe,
        rating: meal.rating,
        totalTime: meal.totalTime,
        difficultyDisplay: meal.difficultyDisplay,
        createdBy: {
          id: meal.createdBy._id,
          name: `${meal.createdBy.profile.firstName} ${meal.createdBy.profile.lastName}`
        }
      })),
      totalFavorites: meals.length
    });

  } catch (error) {
    console.error('Error fetching favorite meals:', error);
    res.status(500).json({ message: 'Failed to fetch favorite meals' });
  }
});

// Generate AI weekly meal plan
router.post('/ai-generate-weekly', authenticateToken, requireFamily, requireFamilyPermission('manageMeals'), [
  body('prompt').trim().isLength({ min: 10, max: 500 }).withMessage('Prompt must be 10-500 characters'),
  body('servings').optional().isInt({ min: 1, max: 12 }).withMessage('Servings must be 1-12'),
  body('dietaryRestrictions').optional().isArray(),
  body('cuisine').optional().isString().isLength({ max: 50 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('maxTime').optional().isInt({ min: 5, max: 300 }).withMessage('Max time must be 5-300 minutes'),
  body('availableIngredients').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      prompt, 
      servings = 4, 
      dietaryRestrictions = [], 
      cuisine, 
      difficulty = 'medium',
      maxTime,
      availableIngredients
    } = req.body;

    // Build AI prompt for weekly meal plan
    let aiPrompt = `Create a weekly meal plan (7 meals) for ${servings} people. ${prompt}.`;
    
    if (availableIngredients) {
      aiPrompt += ` Try to incorporate these available ingredients: ${availableIngredients}.`;
    }
    
    if (dietaryRestrictions.length > 0) {
      aiPrompt += ` All meals should be ${dietaryRestrictions.join(', ')}.`;
    }
    
    if (cuisine) {
      aiPrompt += ` Focus on ${cuisine} cuisine.`;
    }
    
    if (difficulty) {
      aiPrompt += ` The difficulty should be ${difficulty}.`;
    }
    
    if (maxTime) {
      aiPrompt += ` Each meal should take under ${maxTime} minutes.`;
    }

    aiPrompt += ` Please provide exactly 7 meals as a JSON array. Keep recipes simple but complete:
    [
      {
        "title": "Recipe Name",
        "description": "Brief description",
        "mealType": "breakfast|lunch|dinner",
        "ingredients": [{"name": "ingredient", "amount": "1", "unit": "cup"}],
        "instructions": [{"step": 1, "instruction": "cooking step", "duration": 10}],
        "prepTime": 15,
        "cookTime": 20,
        "difficulty": "medium",
        "cuisine": "American",
        "dietaryTags": ["balanced"]
      }
    ]
    Mix 2 breakfasts, 2 lunches, 3 dinners. Keep it simple and practical.`;

    console.log('Generating AI weekly meal plan with prompt:', aiPrompt);
    // For weekly meal plans, we need to use a direct axios call with higher token limit
    const axios = require('axios');
    const aiResponse = await axios.post(`${process.env.OLLAMA_BASE_URL || 'http://100.104.68.115:11434'}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'hf.co/unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF:Q8_K_XL',
      prompt: aiPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000 // Much higher token limit for weekly plans
      }
    }, {
      timeout: 90000, // 90 second timeout for weekly generation
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.data.response);
    
    let weeklyMeals;
    try {
      // Try to parse the AI response as JSON
      weeklyMeals = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, try to extract JSON array from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          weeklyMeals = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('AI response is not valid JSON format');
        }
      } else {
        throw new Error('AI response does not contain valid JSON array');
      }
    }

    // Validate and structure the weekly meals
    if (!Array.isArray(weeklyMeals)) {
      throw new Error('AI response must be an array of meals');
    }

    const structuredMeals = weeklyMeals.slice(0, 7).map((meal, index) => ({
      title: meal.title || `Meal ${index + 1}`,
      description: meal.description || '',
      mealType: meal.mealType || (index < 2 ? 'breakfast' : index < 4 ? 'lunch' : 'dinner'),
      recipe: {
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
        prepTime: meal.prepTime || 30,
        cookTime: meal.cookTime || 30,
        servings,
        difficulty: meal.difficulty || difficulty,
        cuisine: meal.cuisine || cuisine,
        dietaryTags: Array.isArray(meal.dietaryTags) ? meal.dietaryTags : dietaryRestrictions,
        nutritionInfo: meal.nutritionInfo || {}
      },
      aiGenerated: true,
      aiPrompt: prompt
    }));

    res.json({
      success: true,
      message: 'AI weekly meal plan generated successfully',
      meals: structuredMeals,
      rawAiResponse: aiResponse // For debugging
    });

  } catch (error) {
    console.error('Error generating AI weekly meal plan:', error);
    
    // Provide a fallback weekly meal plan using the available ingredients
    const fallbackMeals = [
      {
        title: 'Scrambled Eggs with Toast',
        description: 'Quick and easy breakfast',
        mealType: 'breakfast',
        recipe: {
          ingredients: [
            { name: 'Eggs', amount: '3', unit: 'large', notes: '' },
            { name: 'Butter', amount: '1', unit: 'tbsp', notes: '' }
          ],
          instructions: [
            { step: 1, instruction: 'Scramble eggs in butter until fluffy', duration: 5 }
          ],
          prepTime: 5,
          cookTime: 5,
          servings,
          difficulty,
          cuisine: 'American',
          dietaryTags: ['protein-rich'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Chicken Fried Rice',
        description: 'Using available chicken breast and rice',
        mealType: 'lunch',
        recipe: {
          ingredients: [
            { name: 'Chicken Breast', amount: '1', unit: 'lb', notes: 'diced' },
            { name: 'Rice', amount: '2', unit: 'cups', notes: 'cooked' },
            { name: 'Eggs', amount: '2', unit: 'large', notes: 'beaten' }
          ],
          instructions: [
            { step: 1, instruction: 'Cook chicken until done, add rice and eggs', duration: 15 }
          ],
          prepTime: 10,
          cookTime: 15,
          servings,
          difficulty,
          cuisine: 'Asian',
          dietaryTags: ['balanced'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Spaghetti with Meat Sauce',
        description: 'Classic dinner using hamburger meat',
        mealType: 'dinner',
        recipe: {
          ingredients: [
            { name: 'Spaghetti Noodles', amount: '1', unit: 'lb', notes: '' },
            { name: 'Hamburger Meat', amount: '1', unit: 'lb', notes: '' }
          ],
          instructions: [
            { step: 1, instruction: 'Cook pasta, brown meat, combine with sauce', duration: 20 }
          ],
          prepTime: 10,
          cookTime: 20,
          servings,
          difficulty,
          cuisine: 'Italian',
          dietaryTags: ['hearty'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Fish Sticks with Rice',
        description: 'Quick dinner option',
        mealType: 'dinner',
        recipe: {
          ingredients: [
            { name: 'Fish Sticks', amount: '12', unit: 'pieces', notes: '' },
            { name: 'Rice', amount: '2', unit: 'cups', notes: 'cooked' }
          ],
          instructions: [
            { step: 1, instruction: 'Bake fish sticks, serve with rice', duration: 15 }
          ],
          prepTime: 5,
          cookTime: 15,
          servings,
          difficulty: 'easy',
          cuisine: 'American',
          dietaryTags: ['quick'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Udon Noodle Stir Fry',
        description: 'Asian-inspired lunch',
        mealType: 'lunch',
        recipe: {
          ingredients: [
            { name: 'Udon Noodles', amount: '1', unit: 'package', notes: '' },
            { name: 'Chicken Breast', amount: '0.5', unit: 'lb', notes: 'sliced' }
          ],
          instructions: [
            { step: 1, instruction: 'Stir fry chicken and noodles together', duration: 12 }
          ],
          prepTime: 8,
          cookTime: 12,
          servings,
          difficulty,
          cuisine: 'Asian',
          dietaryTags: ['flavorful'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Hamburger Helper',
        description: 'Easy boxed meal',
        mealType: 'dinner',
        recipe: {
          ingredients: [
            { name: 'Hamburger Helper', amount: '1', unit: 'box', notes: '' },
            { name: 'Hamburger Meat', amount: '1', unit: 'lb', notes: '' }
          ],
          instructions: [
            { step: 1, instruction: 'Follow box instructions with ground beef', duration: 20 }
          ],
          prepTime: 5,
          cookTime: 20,
          servings,
          difficulty: 'easy',
          cuisine: 'American',
          dietaryTags: ['convenient'],
          nutritionInfo: {}
        },
        aiGenerated: false
      },
      {
        title: 'Parmesan Pasta Side with Eggs',
        description: 'Simple breakfast with available ingredients',
        mealType: 'breakfast',
        recipe: {
          ingredients: [
            { name: 'Parmesan Pasta Side', amount: '1', unit: 'box', notes: '' },
            { name: 'Eggs', amount: '2', unit: 'large', notes: 'fried' }
          ],
          instructions: [
            { step: 1, instruction: 'Prepare pasta side, serve with fried eggs', duration: 15 }
          ],
          prepTime: 5,
          cookTime: 15,
          servings,
          difficulty: 'easy',
          cuisine: 'American',
          dietaryTags: ['filling'],
          nutritionInfo: {}
        },
        aiGenerated: false
      }
    ].slice(0, 7).map((meal, index) => ({
      ...meal,
      aiPrompt: prompt
    }));

    res.status(200).json({
      success: true,
      message: 'AI generation failed, providing fallback weekly meal plan using your available ingredients',
      meals: fallbackMeals,
      fallback: true
    });
  }
});

// Generate AI meal suggestions
router.post('/ai-generate', authenticateToken, requireFamily, requireFamilyPermission('manageMeals'), [
  body('prompt').trim().isLength({ min: 10, max: 500 }).withMessage('Prompt must be 10-500 characters'),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  body('servings').optional().isInt({ min: 1, max: 12 }).withMessage('Servings must be 1-12'),
  body('dietaryRestrictions').optional().isArray(),
  body('cuisine').optional().isString().isLength({ max: 50 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('maxTime').optional().isInt({ min: 5, max: 300 }).withMessage('Max time must be 5-300 minutes'),
  body('availableIngredients').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      prompt, 
      mealType, 
      servings = 4, 
      dietaryRestrictions = [], 
      cuisine, 
      difficulty = 'medium',
      maxTime,
      availableIngredients
    } = req.body;

    // Build AI prompt
    let aiPrompt = `Create a ${mealType} recipe for ${servings} people. ${prompt}.`;
    
    if (availableIngredients) {
      aiPrompt += ` Try to incorporate these available ingredients: ${availableIngredients}.`;
    }
    
    if (dietaryRestrictions.length > 0) {
      aiPrompt += ` The recipe should be ${dietaryRestrictions.join(', ')}.`;
    }
    
    if (cuisine) {
      aiPrompt += ` Make it ${cuisine} cuisine.`;
    }
    
    if (difficulty) {
      aiPrompt += ` The difficulty should be ${difficulty}.`;
    }
    
    if (maxTime) {
      aiPrompt += ` Total cooking time should be under ${maxTime} minutes.`;
    }

    aiPrompt += ` Please provide the response in the following JSON format:
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "ingredients": [
        {"name": "ingredient name", "amount": "quantity", "unit": "unit", "notes": "optional notes"}
      ],
      "instructions": [
        {"step": 1, "instruction": "step description", "duration": minutes}
      ],
      "prepTime": minutes,
      "cookTime": minutes,
      "difficulty": "easy|medium|hard",
      "cuisine": "cuisine type",
      "dietaryTags": ["tag1", "tag2"],
      "nutritionInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }`;

    console.log('Generating AI meal plan with prompt:', aiPrompt);
    const aiResponse = await ollamaService.generateResponse(aiPrompt);
    
    let mealData;
    try {
      // Try to parse the AI response as JSON
      mealData = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          mealData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('AI response is not valid JSON format');
        }
      } else {
        throw new Error('AI response does not contain valid JSON');
      }
    }

    // Validate and structure the meal data
    const structuredMeal = {
      title: mealData.title || 'AI Generated Recipe',
      description: mealData.description || '',
      mealType,
      recipe: {
        ingredients: Array.isArray(mealData.ingredients) ? mealData.ingredients : [],
        instructions: Array.isArray(mealData.instructions) ? mealData.instructions : [],
        prepTime: mealData.prepTime || 30,
        cookTime: mealData.cookTime || 30,
        servings,
        difficulty: mealData.difficulty || difficulty,
        cuisine: mealData.cuisine || cuisine,
        dietaryTags: Array.isArray(mealData.dietaryTags) ? mealData.dietaryTags : dietaryRestrictions,
        nutritionInfo: mealData.nutritionInfo || {}
      },
      aiGenerated: true,
      aiPrompt: prompt
    };

    res.json({
      success: true,
      message: 'AI meal plan generated successfully',
      meal: structuredMeal,
      rawAiResponse: aiResponse // For debugging
    });

  } catch (error) {
    console.error('Error generating AI meal plan:', error);
    res.status(500).json({ 
      message: 'Failed to generate AI meal plan',
      error: error.message,
      fallbackSuggestion: {
        title: 'Simple Pasta Dish',
        description: 'A quick and easy pasta meal',
        mealType: req.body.mealType || 'dinner',
        recipe: {
          ingredients: [
            { name: 'Pasta', amount: '1', unit: 'lb', notes: 'any shape' },
            { name: 'Olive Oil', amount: '2', unit: 'tbsp', notes: '' },
            { name: 'Garlic', amount: '3', unit: 'cloves', notes: 'minced' },
            { name: 'Salt', amount: '1', unit: 'tsp', notes: 'to taste' }
          ],
          instructions: [
            { step: 1, instruction: 'Boil water and cook pasta according to package directions', duration: 10 },
            { step: 2, instruction: 'Heat olive oil and sauté garlic', duration: 5 },
            { step: 3, instruction: 'Combine pasta with oil and garlic', duration: 2 }
          ],
          prepTime: 5,
          cookTime: 15,
          servings: req.body.servings || 4,
          difficulty: 'easy',
          cuisine: 'Italian'
        },
        aiGenerated: false
      }
    });
  }
});

// Create a new meal plan
router.post('/', authenticateToken, requireFamily, requireFamilyPermission('manageMeals'), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  body('scheduledDate').isISO8601().withMessage('Scheduled date must be valid'),
  body('recipe.ingredients').isArray().withMessage('Ingredients must be an array'),
  body('recipe.instructions').isArray().withMessage('Instructions must be an array'),
  body('recipe.prepTime').optional().isInt({ min: 0 }),
  body('recipe.cookTime').optional().isInt({ min: 0 }),
  body('recipe.servings').optional().isInt({ min: 1 }),
  body('recipe.difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      mealType,
      scheduledDate,
      recipe,
      assignedTo,
      notes,
      tags,
      aiGenerated = false,
      aiPrompt
    } = req.body;

    const mealPlan = new MealPlan({
      family: req.family._id,
      title: title.trim(),
      description: description?.trim(),
      mealType,
      scheduledDate: new Date(scheduledDate),
      recipe: {
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'medium',
        cuisine: recipe.cuisine,
        dietaryTags: recipe.dietaryTags || [],
        nutritionInfo: recipe.nutritionInfo || {}
      },
      createdBy: req.user._id,
      assignedTo: assignedTo || [],
      notes: notes?.trim(),
      tags: tags || [],
      aiGenerated,
      aiPrompt: aiPrompt?.trim()
    });

    await mealPlan.save();
    await mealPlan.populate('createdBy', 'profile email');

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      meal: {
        id: mealPlan._id,
        title: mealPlan.title,
        description: mealPlan.description,
        mealType: mealPlan.mealType,
        scheduledDate: mealPlan.scheduledDate,
        recipe: mealPlan.recipe,
        aiGenerated: mealPlan.aiGenerated,
        status: mealPlan.status,
        totalTime: mealPlan.totalTime,
        difficultyDisplay: mealPlan.difficultyDisplay,
        createdBy: {
          id: mealPlan.createdBy._id,
          name: `${mealPlan.createdBy.profile.firstName} ${mealPlan.createdBy.profile.lastName}`
        },
        createdAt: mealPlan.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({ message: 'Failed to create meal plan' });
  }
});

// Update a meal plan
router.put('/:mealId', authenticateToken, requireFamily, requireFamilyPermission('manageMeals'), [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('mealType').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']),
  body('scheduledDate').optional().isISO8601(),
  body('recipe.prepTime').optional().isInt({ min: 0 }),
  body('recipe.cookTime').optional().isInt({ min: 0 }),
  body('recipe.servings').optional().isInt({ min: 1 }),
  body('recipe.difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mealId } = req.params;
    const updates = req.body;

    const meal = await MealPlan.findOne({
      _id: mealId,
      family: req.family._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // Handle nested recipe updates
    if (updates.recipe) {
      meal.recipe = { ...meal.recipe.toObject(), ...updates.recipe };
      delete updates.recipe;
    }

    Object.assign(meal, updates);
    await meal.save();

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      meal: {
        id: meal._id,
        title: meal.title,
        description: meal.description,
        mealType: meal.mealType,
        scheduledDate: meal.scheduledDate,
        recipe: meal.recipe,
        status: meal.status,
        totalTime: meal.totalTime,
        updatedAt: meal.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ message: 'Failed to update meal plan' });
  }
});

// Mark meal as completed
router.patch('/:mealId/complete', authenticateToken, requireFamily, [
  body('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const { mealId } = req.params;
    const { rating } = req.body;

    const meal = await MealPlan.findOne({
      _id: mealId,
      family: req.family._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    meal.markCompleted(req.user._id, rating);
    await meal.save();
    await meal.populate('completedBy', 'profile email');

    res.json({
      success: true,
      message: 'Meal marked as completed',
      meal: {
        id: meal._id,
        status: meal.status,
        completedAt: meal.completedAt,
        completedBy: {
          id: meal.completedBy._id,
          name: `${meal.completedBy.profile.firstName} ${meal.completedBy.profile.lastName}`
        },
        rating: meal.rating
      }
    });

  } catch (error) {
    console.error('Error completing meal:', error);
    res.status(500).json({ message: 'Failed to complete meal' });
  }
});

// Toggle favorite status
router.patch('/:mealId/favorite', authenticateToken, requireFamily, async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await MealPlan.findOne({
      _id: mealId,
      family: req.family._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    meal.toggleFavorite();
    await meal.save();

    res.json({
      success: true,
      message: meal.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      meal: {
        id: meal._id,
        isFavorite: meal.isFavorite
      }
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Failed to toggle favorite' });
  }
});

// Delete a meal plan
router.delete('/:mealId', authenticateToken, requireFamily, requireFamilyPermission('manageMeals'), async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await MealPlan.findOne({
      _id: mealId,
      family: req.family._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    // Soft delete
    meal.isActive = false;
    await meal.save();

    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ message: 'Failed to delete meal plan' });
  }
});

// Get meal plan statistics
router.get('/stats', authenticateToken, requireFamily, async (req, res) => {
  try {
    const stats = await MealPlan.getStats(req.family._id);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching meal stats:', error);
    res.status(500).json({ message: 'Failed to fetch meal statistics' });
  }
});

// Get shopping list from planned meals
router.get('/shopping-list', authenticateToken, requireFamily, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const shoppingList = await MealPlan.getShoppingList(req.family._id, startDate, endDate);

    res.json({
      success: true,
      shoppingList,
      dateRange: {
        startDate,
        endDate
      },
      totalItems: shoppingList.length
    });

  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ message: 'Failed to generate shopping list' });
  }
});

module.exports = router;