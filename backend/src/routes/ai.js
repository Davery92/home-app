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

module.exports = router;