const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { generateOllamaResponse } = require('../utils/ollama');

const router = express.Router();

// AI Chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Build context for the AI
    let systemPrompt = `You are a helpful family assistant AI. You help with:
    - Meal planning and recipe suggestions
    - Creating grocery lists
    - Family organization and scheduling
    - Household management tips
    - Healthy lifestyle suggestions
    
    Be friendly, practical, and family-oriented in your responses.`;

    // Add family context if available
    if (context?.familyId) {
      systemPrompt += `\n\nYou are helping a family member with their request.`;
    }

    // Add conversation history if available
    let conversationHistory = '';
    if (context?.previousMessages && Array.isArray(context.previousMessages)) {
      conversationHistory = context.previousMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
    }

    // Build the full prompt
    const fullPrompt = conversationHistory 
      ? `${systemPrompt}\n\nPrevious conversation:\n${conversationHistory}\n\nUser: ${message}\nAssistant:`
      : `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    // Generate response using Ollama
    const aiResponse = await generateOllamaResponse(fullPrompt);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error.message || error);
    
    // Provide context-aware fallback response when Ollama fails
    let fallbackResponse = "";
    
    const lowerMessage = req.body.message ? req.body.message.toLowerCase() : "";
    
    if (lowerMessage.includes('meal') || lowerMessage.includes('dinner') || lowerMessage.includes('lunch') || lowerMessage.includes('breakfast')) {
      fallbackResponse = "Here are some meal planning suggestions:\n\n" +
        "**Quick Weeknight Dinners:**\n" +
        "• Stir-fry with vegetables and your choice of protein\n" +
        "• One-pot pasta with marinara and vegetables\n" +
        "• Sheet pan chicken with roasted vegetables\n" +
        "• Tacos with various toppings\n\n" +
        "**Meal Prep Tips:**\n" +
        "• Cook grains in bulk on Sunday\n" +
        "• Pre-cut vegetables when you get home from shopping\n" +
        "• Marinate proteins the night before\n" +
        "• Keep a well-stocked pantry with basics";
    } else if (lowerMessage.includes('grocery') || lowerMessage.includes('shopping')) {
      fallbackResponse = "Here's a basic grocery list template:\n\n" +
        "**Produce:**\n• Leafy greens, Tomatoes, Onions, Garlic\n• Seasonal fruits and vegetables\n\n" +
        "**Proteins:**\n• Chicken, Fish, Eggs, Beans/Lentils\n\n" +
        "**Dairy:**\n• Milk, Yogurt, Cheese\n\n" +
        "**Pantry Staples:**\n• Rice, Pasta, Bread\n• Olive oil, Spices\n• Canned tomatoes, Broth\n\n" +
        "**Pro tip:** Check your pantry before shopping to avoid duplicates!";
    } else if (lowerMessage.includes('recipe')) {
      fallbackResponse = "Here's a simple and versatile recipe:\n\n" +
        "**One-Pan Chicken & Vegetables**\n\n" +
        "*Ingredients:*\n" +
        "• 4 chicken breasts\n" +
        "• 2 cups mixed vegetables (broccoli, carrots, bell peppers)\n" +
        "• 2 tbsp olive oil\n" +
        "• Salt, pepper, garlic powder, herbs\n\n" +
        "*Instructions:*\n" +
        "1. Preheat oven to 425°F (220°C)\n" +
        "2. Place chicken and vegetables on sheet pan\n" +
        "3. Drizzle with oil and seasonings\n" +
        "4. Bake for 20-25 minutes until chicken reaches 165°F\n\n" +
        "Serves 4 | Prep: 10 min | Cook: 25 min";
    } else if (lowerMessage.includes('chore') || lowerMessage.includes('clean')) {
      fallbackResponse = "Here's a family chore chart template:\n\n" +
        "**Daily Chores:**\n" +
        "• Make beds\n• Load/unload dishwasher\n• Wipe kitchen counters\n• Feed pets\n\n" +
        "**Weekly Chores:**\n" +
        "• Monday: Vacuum living areas\n" +
        "• Tuesday: Clean bathrooms\n" +
        "• Wednesday: Laundry\n" +
        "• Thursday: Dust furniture\n" +
        "• Friday: Mop floors\n" +
        "• Weekend: Yard work, deep clean one room\n\n" +
        "**Tips:** Rotate responsibilities weekly and use a reward system for kids!";
    } else {
      fallbackResponse = "I'm here to help with your family management needs! While I'm currently offline, here are some areas I can assist with:\n\n" +
        "**I can help you with:**\n" +
        "• 🍕 Meal planning and recipes\n" +
        "• 🛒 Grocery lists and shopping tips\n" +
        "• 🧹 Chore schedules and organization\n" +
        "• 📅 Family calendar management\n" +
        "• 💡 Household tips and tricks\n\n" +
        "Try asking me about any of these topics!";
    }
    
    res.json({
      response: fallbackResponse + "\n\n*Note: I'm currently providing general suggestions while offline. When my AI connection is restored, I'll give you personalized recommendations!*",
      timestamp: new Date().toISOString(),
      offline: true
    });
  }
});

// Get meal suggestions
router.post('/meal-suggestions', authenticateToken, async (req, res) => {
  try {
    const { preferences, restrictions, mealType, servings } = req.body;

    const prompt = `Generate 3 meal suggestions for ${mealType || 'dinner'} that serves ${servings || 4} people.
    ${preferences ? `Preferences: ${preferences}` : ''}
    ${restrictions ? `Dietary restrictions: ${restrictions}` : ''}
    
    Format the response as a list with brief descriptions.`;

    const suggestions = await generateOllamaResponse(prompt);

    res.json({
      suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Meal suggestions error:', error);
    
    // Fallback suggestions
    res.json({
      suggestions: "Here are some popular meal ideas:\n\n" +
                  "1. **Grilled Chicken with Roasted Vegetables** - Healthy and easy to prepare\n" +
                  "2. **Pasta Primavera** - Vegetarian option with seasonal vegetables\n" +
                  "3. **Taco Tuesday** - Fun family meal with customizable toppings\n",
      timestamp: new Date().toISOString(),
      offline: true
    });
  }
});

// Generate grocery list from meal plan
router.post('/grocery-list', authenticateToken, async (req, res) => {
  try {
    const { meals, existingItems } = req.body;

    const prompt = `Create a grocery list for these meals: ${meals.join(', ')}.
    ${existingItems ? `We already have: ${existingItems.join(', ')}` : ''}
    
    Organize the list by category (produce, dairy, meat, etc.)`;

    const groceryList = await generateOllamaResponse(prompt);

    res.json({
      groceryList,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grocery list error:', error);
    
    res.json({
      groceryList: "Basic grocery list template:\n\n" +
                  "**Produce:**\n• Vegetables\n• Fruits\n\n" +
                  "**Proteins:**\n• Meat/Fish/Tofu\n\n" +
                  "**Dairy:**\n• Milk, Cheese, Yogurt\n\n" +
                  "**Pantry:**\n• Grains, Pasta, Canned goods\n",
      timestamp: new Date().toISOString(),
      offline: true
    });
  }
});

// AI price estimation endpoint
router.post('/estimate-price', async (req, res) => {
  try {
    const { ingredient, amount } = req.body

    if (!ingredient) {
      return res.status(400).json({ error: 'Ingredient is required' })
    }

    // Try to get AI estimation using Ollama
    let estimatedPrice = null
    
    try {
      const prompt = `You are a grocery price estimation expert. Estimate the price in USD for this ingredient: "${amount} ${ingredient}".

Consider:
- Average US grocery store prices
- The specific amount/quantity mentioned
- Common package sizes
- Current market conditions

Respond ONLY with a single number representing the estimated price in dollars (e.g., "3.99"). Do not include currency symbol or explanation.

Ingredient: ${amount} ${ingredient}`

      const aiResponse = await generateOllamaResponse(prompt);

      if (aiResponse) {
        const priceText = aiResponse.trim()
        const priceMatch = priceText.match(/(\d+\.?\d*)/)
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[1])
          if (!isNaN(price) && price > 0 && price < 100) {
            estimatedPrice = price
          }
        }
      }
    } catch (aiError) {
      console.log('AI price estimation failed, using fallback:', aiError.message)
    }

    // Fallback price estimation if AI fails
    if (!estimatedPrice) {
      estimatedPrice = getFallbackPrice(ingredient, amount)
    }

    res.json({ 
      estimatedPrice: Number(estimatedPrice.toFixed(2)),
      source: estimatedPrice ? 'ai' : 'fallback'
    })

  } catch (error) {
    console.error('Error estimating price:', error)
    res.status(500).json({ error: 'Failed to estimate price' })
  }
})

// Fallback price estimation
function getFallbackPrice(ingredient, amount) {
  const lowerIngredient = ingredient.toLowerCase()
  
  // Base prices for common ingredients (per typical serving/package)
  const basePrices = {
    // Proteins
    'chicken': 7.99, 'beef': 9.99, 'pork': 6.99, 'fish': 8.99, 'salmon': 12.99,
    'turkey': 5.99, 'lamb': 14.99, 'shrimp': 11.99, 'eggs': 4.49,
    
    // Dairy
    'milk': 3.89, 'cheese': 5.99, 'butter': 4.99, 'yogurt': 5.49, 'cream': 3.99,
    
    // Grains & Starches
    'rice': 2.99, 'pasta': 1.99, 'bread': 3.49, 'flour': 3.99, 'quinoa': 6.99,
    'oats': 3.49, 'barley': 2.99, 'potato': 2.99, 'sweet potato': 3.99,
    
    // Vegetables
    'onion': 1.99, 'garlic': 1.49, 'tomato': 3.49, 'carrot': 1.99, 'celery': 2.49,
    'bell pepper': 4.99, 'broccoli': 2.99, 'spinach': 3.99, 'lettuce': 2.99,
    'cucumber': 1.99, 'mushroom': 3.99, 'zucchini': 2.99, 'corn': 2.49,
    
    // Fruits
    'apple': 4.99, 'banana': 1.99, 'orange': 4.49, 'lemon': 2.99, 'lime': 2.99,
    'avocado': 6.99, 'berries': 5.99, 'strawberry': 4.99, 'grape': 4.99,
    
    // Pantry staples
    'oil': 4.99, 'olive oil': 8.99, 'vinegar': 2.99, 'soy sauce': 3.99,
    'salt': 1.49, 'pepper': 3.99, 'sugar': 2.99, 'honey': 5.99,
    
    // Herbs & Spices
    'basil': 2.99, 'oregano': 2.49, 'thyme': 2.99, 'parsley': 1.99,
    'cilantro': 1.99, 'rosemary': 2.99, 'sage': 2.99,
    
    // Canned/Packaged
    'beans': 1.99, 'tomato sauce': 2.49, 'broth': 2.99, 'coconut milk': 2.99,
    'stock': 3.49
  }

  // Find matching ingredient
  let basePrice = 3.99 // default price
  let matchFound = false

  for (const [key, price] of Object.entries(basePrices)) {
    if (lowerIngredient.includes(key)) {
      basePrice = price
      matchFound = true
      break
    }
  }

  // Adjust price based on amount if specified
  if (amount && typeof amount === 'string') {
    const amountLower = amount.toLowerCase()
    
    // Small amounts
    if (amountLower.includes('tsp') || amountLower.includes('teaspoon') || 
        amountLower.includes('tbsp') || amountLower.includes('tablespoon') ||
        amountLower.includes('pinch') || amountLower.includes('dash')) {
      basePrice *= 0.3 // Much smaller portion
    }
    // Large amounts
    else if (amountLower.includes('lb') || amountLower.includes('pound') ||
             amountLower.includes('kg') || amountLower.includes('bunch') ||
             parseFloat(amount) >= 2) {
      basePrice *= 1.5 // Larger portion
    }
    // Very large amounts
    else if (parseFloat(amount) >= 5) {
      basePrice *= 2.5
    }
  }

  // Ensure reasonable price bounds
  return Math.max(0.49, Math.min(basePrice, 49.99))
}

module.exports = router;