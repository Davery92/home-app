const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2';
    console.log('Ollama Service initialized with:', {
      baseURL: this.baseURL,
      model: this.model
    });
  }

  async generateMealPlan(preferences = {}) {
    const {
      familySize = 4,
      dietaryRestrictions = [],
      cuisine = 'any',
      budget = 'moderate',
      cookingTime = 'moderate'
    } = preferences;

    const prompt = `Generate a meal plan for a family of ${familySize} people with the following preferences:
- Dietary restrictions: ${dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'none'}
- Cuisine preference: ${cuisine}
- Budget: ${budget}
- Cooking time preference: ${cookingTime}

Please provide:
1. Breakfast suggestions (2-3 items)
2. Lunch suggestions (2-3 items) 
3. Dinner suggestions (2-3 items)

Format the response as JSON with this structure:
{
  "breakfast": ["item1", "item2"],
  "lunch": ["item1", "item2", "item3"],
  "dinner": ["item1", "item2"]
}

Keep suggestions practical and achievable for home cooking.`;

    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const generatedText = response.data.response;
      
      // Try to extract JSON from the response
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('Failed to parse JSON, returning fallback');
      }

      // Fallback if JSON parsing fails
      return this.parseMealPlanFromText(generatedText);

    } catch (error) {
      console.error('Ollama API error:', error.message);
      
      // Return fallback meal plan
      return {
        breakfast: ['Oatmeal with berries', 'Scrambled eggs and toast'],
        lunch: ['Caesar salad', 'Sandwich and soup', 'Pasta salad'],
        dinner: ['Grilled chicken with vegetables', 'Spaghetti with marinara sauce']
      };
    }
  }

  parseMealPlanFromText(text) {
    // Simple text parsing fallback
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const mealPlan = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    let currentMeal = null;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('breakfast')) {
        currentMeal = 'breakfast';
      } else if (lowerLine.includes('lunch')) {
        currentMeal = 'lunch';
      } else if (lowerLine.includes('dinner')) {
        currentMeal = 'dinner';
      } else if (currentMeal && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
        const item = line.replace(/^[-*\d.]\s*/, '').trim();
        if (item && mealPlan[currentMeal].length < 3) {
          mealPlan[currentMeal].push(item);
        }
      }
    }

    return mealPlan;
  }

  async generateGroceryList(mealPlan, currentGroceries = []) {
    const mealsText = Object.entries(mealPlan)
      .map(([meal, items]) => `${meal}: ${items.join(', ')}`)
      .join('\n');

    const currentItems = currentGroceries.join(', ');

    const prompt = `Based on this meal plan:
${mealsText}

Current grocery items: ${currentItems || 'none'}

Generate a grocery shopping list. Include ingredients needed for the meals but exclude items already in the current list.
Return as a simple list of items, one per line, with appropriate emojis.

Example format:
🥛 Milk
🥖 Bread
🥕 Carrots`;

    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.5,
          max_tokens: 300
        }
      });

      const groceryText = response.data.response;
      
      // Parse grocery items from response
      const items = groceryText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.toLowerCase().includes('grocery'))
        .slice(0, 10); // Limit to 10 items

      return items;

    } catch (error) {
      console.error('Grocery list generation error:', error.message);
      
      // Return fallback grocery items
      return [
        '🥛 Milk',
        '🥖 Bread', 
        '🥚 Eggs',
        '🥕 Carrots',
        '🧅 Onions',
        '🍖 Chicken breast',
        '🍝 Pasta',
        '🍅 Tomatoes'
      ];
    }
  }

  async generateResponse(prompt) {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      }, {
        timeout: 5000, // Reduced timeout to 5 seconds
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama API error:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      
      const models = response.data.models || [];
      const modelExists = models.some(m => m.name === this.model);
      
      return {
        connected: true,
        modelsAvailable: models.length,
        targetModelAvailable: modelExists,
        models: models.map(m => m.name)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Export the service instance
const ollamaService = new OllamaService();

// Also export a convenience function for generating responses
module.exports = ollamaService;
module.exports.generateOllamaResponse = async (prompt) => {
  return ollamaService.generateResponse(prompt);
};