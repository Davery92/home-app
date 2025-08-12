'use client'

import React, { useState } from 'react'
import Card from './ui/Card'
import { useMealPlan, MealPlan } from '@/hooks/useMealPlan'
import ShoppingListModal from './ShoppingListModal'

interface AIMealModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (mealData: any) => Promise<void>
  favoriteMeals: any[]
}

const AIMealModal: React.FC<AIMealModalProps> = ({ isOpen, onClose, onGenerate, favoriteMeals }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    mealType: 'dinner',
    servings: 4,
    dietaryRestrictions: [] as string[],
    cuisine: '',
    difficulty: 'medium',
    maxTime: 60,
    availableIngredients: '',
    generationType: 'single' // 'single' or 'weekly'
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prompt.trim()) return

    setLoading(true)
    try {
      await onGenerate(formData)
      setFormData({
        prompt: '',
        mealType: 'dinner',
        servings: 4,
        dietaryRestrictions: [],
        cuisine: '',
        difficulty: 'medium',
        maxTime: 60,
        availableIngredients: '',
        generationType: 'single'
      })
      onClose()
    } catch (err) {
      console.error('Error generating AI meal:', err)
      alert('Failed to generate meal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'nut-free', 'low-carb', 'keto', 'paleo', 'halal', 'kosher'
  ]

  const handleDietaryToggle = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                🤖 Generate AI {formData.generationType === 'weekly' ? 'Weekly Meal Plan' : 'Meal'}
              </h2>
              {favoriteMeals.length >= 3 && (
                <p className="text-sm text-purple-600 mt-1">
                  🧠 Learning from your {favoriteMeals.length} favorite meals
                </p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-400 hover:text-gray-600 text-xl">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Generation Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generation Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="generationType"
                    value="single"
                    checked={formData.generationType === 'single'}
                    onChange={(e) => setFormData({ ...formData, generationType: e.target.value as 'single' | 'weekly' })}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>🍽️ Single Meal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="generationType"
                    value="weekly"
                    checked={formData.generationType === 'weekly'}
                    onChange={(e) => setFormData({ ...formData, generationType: e.target.value as 'single' | 'weekly' })}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>📅 Weekly Meal Plan (7 meals)</span>
                </label>
              </div>
            </div>

            {/* Available Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Ingredients (optional)
              </label>
              <textarea
                value={formData.availableIngredients}
                onChange={(e) => setFormData({ ...formData, availableIngredients: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="List ingredients you already have: chicken, rice, onions, tomatoes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.generationType === 'weekly' ? 'Meal preferences and style *' : 'Describe what you want to cook *'}
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder={
                  formData.generationType === 'weekly' 
                    ? "I want a balanced week of meals with variety - some healthy, some comfort food. Include different cuisines and cooking methods..."
                    : "I want something healthy with chicken and vegetables, or suggest a comforting pasta dish..."
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.generationType === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="breakfast">🍳 Breakfast</option>
                    <option value="lunch">🥪 Lunch</option>
                    <option value="dinner">🍽️ Dinner</option>
                    <option value="snack">🍎 Snack</option>
                    <option value="dessert">🍰 Dessert</option>
                  </select>
                </div>
              )}
              <div className={formData.generationType === 'weekly' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servings per meal
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuisine (optional)
                </label>
                <input
                  type="text"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Italian, Mexican, Asian..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="easy">⭐ Easy</option>
                  <option value="medium">⭐⭐ Medium</option>
                  <option value="hard">⭐⭐⭐ Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Cooking Time (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={formData.maxTime}
                onChange={(e) => setFormData({ ...formData, maxTime: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dietaryOptions.map(restriction => (
                  <label key={restriction} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.dietaryRestrictions.includes(restriction)}
                      onChange={() => handleDietaryToggle(restriction)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="capitalize">{restriction}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.prompt.trim()}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>
                  {loading ? 'Generating...' : `🤖 Generate ${formData.generationType === 'weekly' ? 'Weekly Plan' : 'Meal'}`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

interface MealModalProps {
  isOpen: boolean
  onClose: () => void
  meal: MealPlan | null
  onSave?: (meal: any) => Promise<void>
  onComplete?: (mealId: string, rating?: number) => Promise<void>
  onToggleFavorite?: (mealId: string) => Promise<void>
  onDelete?: (mealId: string) => Promise<void>
}

const MealModal: React.FC<MealModalProps> = ({ 
  isOpen, 
  onClose, 
  meal, 
  onComplete, 
  onToggleFavorite, 
  onDelete 
}) => {
  const [rating, setRating] = useState(5)
  const [showRecipe, setShowRecipe] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen || !meal) return null

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      hard: 'text-red-600 bg-red-100'
    }
    return colors[difficulty as keyof typeof colors] || colors.medium
  }

  const getMealTypeEmoji = (mealType: string) => {
    const emojis = {
      breakfast: '🍳',
      lunch: '🥪',
      dinner: '🍽️',
      snack: '🍎',
      dessert: '🍰'
    }
    return emojis[mealType as keyof typeof emojis] || '🍽️'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <Card className={`w-full overflow-y-auto bg-white transition-all duration-300 ${
        isExpanded 
          ? 'max-w-none h-[95vh] mx-4' 
          : 'max-w-4xl max-h-[90vh]'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getMealTypeEmoji(meal.mealType)}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{meal.title}</h2>
                {meal.aiGenerated && (
                  <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    🤖 AI Generated
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                title={isExpanded ? 'Collapse modal' : 'Expand to full screen'}
              >
                {isExpanded ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-600 hover:text-gray-800">
                    <path fill="currentColor" d="M1 1v6h6V1H1zM9 1v6h6V1H9zM1 9v6h6V9H1zM9 9v6h6V9H9z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-600 hover:text-gray-800">
                    <path fill="currentColor" d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                )}
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">×</span>
              </button>
            </div>
          </div>

          {meal.description && (
            <p className="text-gray-600 mb-4">{meal.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{meal.totalTime}</div>
              <div className="text-sm text-gray-500">minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{meal.recipe.servings}</div>
              <div className="text-sm text-gray-500">servings</div>
            </div>
            <div className="text-center">
              <div className={`text-sm px-2 py-1 rounded-full ${getDifficultyColor(meal.recipe.difficulty)}`}>
                {meal.difficultyDisplay} {meal.recipe.difficulty}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg">
                {meal.status === 'completed' ? '✅' : '📅'}
              </div>
              <div className="text-sm text-gray-500 capitalize">{meal.status}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowRecipe(!showRecipe)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>{showRecipe ? '🔼' : '🔽'}</span>
              <span>{showRecipe ? 'Hide' : 'Show'} Recipe Details</span>
            </button>
            <div className="flex items-center space-x-2">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(meal.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    meal.isFavorite ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={meal.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span className="text-xl">{meal.isFavorite ? '❤️' : '🤍'}</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Delete this meal plan?')) {
                      onDelete(meal.id)
                      onClose()
                    }
                  }}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete meal"
                >
                  <span className="text-xl">🗑️</span>
                </button>
              )}
            </div>
          </div>

          {showRecipe && (
            <div className={`gap-6 mb-6 ${isExpanded ? 'grid lg:grid-cols-3' : 'grid md:grid-cols-2'}`}>
              <div className={isExpanded ? 'lg:col-span-1' : ''}>
                <h3 className="text-lg font-semibold mb-3">🥕 Ingredients</h3>
                <ul className="space-y-2">
                  {meal.recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>
                        <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                        {ingredient.notes && <em className="text-gray-500 text-sm"> ({ingredient.notes})</em>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={isExpanded ? 'lg:col-span-2' : ''}>
                <h3 className="text-lg font-semibold mb-3">👨‍🍳 Instructions</h3>
                <ol className="space-y-3">
                  {meal.recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {instruction.step}
                      </span>
                      <div>
                        <p className={isExpanded ? 'text-base' : ''}>{instruction.instruction}</p>
                        {instruction.duration && (
                          <span className="text-sm text-gray-500">⏱️ {instruction.duration} min</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {meal.status !== 'completed' && onComplete && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-2">Mark as completed and rate:</h4>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onComplete(meal.id, rating)
                    onClose()
                  }}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  ✅ Complete Meal
                </button>
              </div>
            </div>
          )}

          {meal.status === 'completed' && (
            <div className="border-t pt-4 text-center text-green-600">
              <span className="text-xl">✅ Completed</span>
              {meal.rating && (
                <div className="mt-2">
                  {Array.from({ length: meal.rating }, (_, i) => '⭐').join('')} ({meal.rating}/5)
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

const MealsToday: React.FC = () => {
  const { 
    todaysMeals, 
    favoriteMeals,
    stats, 
    loading, 
    error, 
    generateAIMeal,
    generateAIWeeklyMeals, 
    createMealPlan, 
    completeMeal, 
    toggleFavorite, 
    deleteMealPlan,
    refreshTodaysMeals,
    getMealsByDateRange 
  } = useMealPlan()
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null)
  const [generatedMeal, setGeneratedMeal] = useState<any>(null)
  const [generatedWeeklyMeals, setGeneratedWeeklyMeals] = useState<any[]>([])
  const [showGeneratedModal, setShowGeneratedModal] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showShoppingListModal, setShowShoppingListModal] = useState(false)
  const [savedMealsForShopping, setSavedMealsForShopping] = useState<any[]>([])
  const [mealView, setMealView] = useState<'today' | 'upcoming' | 'favorites'>('today')

  // Get upcoming meals for the week (next 7 days)
  const getUpcomingMeals = () => {
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    
    return getMealsByDateRange(
      today.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0]
    )
  }

  const upcomingMeals = getUpcomingMeals()

  // AI Learning System - analyze favorite meals to personalize recommendations
  const analyzeFavoritePreferences = () => {
    if (favoriteMeals.length === 0) return null

    const preferences = {
      cuisines: new Map<string, number>(),
      ingredients: new Map<string, number>(),
      mealTypes: new Map<string, number>(),
      difficulties: new Map<string, number>(),
      dietaryTags: new Map<string, number>()
    }

    favoriteMeals.forEach(meal => {
      // Track cuisine preferences
      if (meal.recipe?.cuisine) {
        preferences.cuisines.set(meal.recipe.cuisine, (preferences.cuisines.get(meal.recipe.cuisine) || 0) + 1)
      }
      
      // Track meal type preferences
      preferences.mealTypes.set(meal.mealType, (preferences.mealTypes.get(meal.mealType) || 0) + 1)
      
      // Track difficulty preferences
      if (meal.recipe?.difficulty) {
        preferences.difficulties.set(meal.recipe.difficulty, (preferences.difficulties.get(meal.recipe.difficulty) || 0) + 1)
      }
      
      // Track ingredient preferences
      if (meal.recipe?.ingredients) {
        meal.recipe.ingredients.forEach(ingredient => {
          const name = ingredient.name.toLowerCase()
          preferences.ingredients.set(name, (preferences.ingredients.get(name) || 0) + 1)
        })
      }
      
      // Track dietary tag preferences
      if (meal.recipe?.dietaryTags) {
        meal.recipe.dietaryTags.forEach(tag => {
          preferences.dietaryTags.set(tag, (preferences.dietaryTags.get(tag) || 0) + 1)
        })
      }
    })

    // Get top preferences
    const topCuisines = Array.from(preferences.cuisines.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topIngredients = Array.from(preferences.ingredients.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const topDifficulty = Array.from(preferences.difficulties.entries()).sort((a, b) => b[1] - a[1])[0]
    const topDietaryTags = Array.from(preferences.dietaryTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)

    return {
      cuisines: topCuisines.map(([cuisine]) => cuisine),
      ingredients: topIngredients.map(([ingredient]) => ingredient),
      difficulty: topDifficulty?.[0] || 'medium',
      dietaryTags: topDietaryTags.map(([tag]) => tag)
    }
  }

  // Get meals based on current view
  const getDisplayMeals = () => {
    switch (mealView) {
      case 'today':
        return todaysMeals
      case 'upcoming':
        return upcomingMeals
      case 'favorites':
        return favoriteMeals
      default:
        return todaysMeals
    }
  }

  const displayMeals = getDisplayMeals()
  const getViewTitle = () => {
    switch (mealView) {
      case 'today':
        return "Today's Meals"
      case 'upcoming':
        return 'Upcoming Meals (7 days)'
      case 'favorites':
        return 'Favorite Meals'
      default:
        return "Today's Meals"
    }
  }

  const getMealTypeInfo = (mealType: string) => {
    const info = {
      breakfast: { emoji: '🍳', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
      lunch: { emoji: '🥪', color: 'bg-orange-100', textColor: 'text-orange-800' },
      dinner: { emoji: '🍽️', color: 'bg-red-100', textColor: 'text-red-800' },
      snack: { emoji: '🍎', color: 'bg-green-100', textColor: 'text-green-800' },
      dessert: { emoji: '🍰', color: 'bg-purple-100', textColor: 'text-purple-800' }
    }
    return info[mealType as keyof typeof info] || info.dinner
  }

  const handleGenerateAI = async (mealData: any) => {
    try {
      console.log('Generating AI meal with data:', mealData)
      
      // Enhance prompts with learned preferences
      const preferences = analyzeFavoritePreferences()
      let enhancedMealData = { ...mealData }
      
      if (preferences && favoriteMeals.length >= 3) {
        // Add personalization to the prompt
        let personalizedPrompt = mealData.prompt
        
        if (preferences.cuisines.length > 0) {
          personalizedPrompt += ` I particularly enjoy ${preferences.cuisines.join(' and ')} cuisine.`
        }
        
        if (preferences.ingredients.length > 0) {
          const topIngredients = preferences.ingredients.slice(0, 4).join(', ')
          personalizedPrompt += ` I often enjoy meals with ingredients like ${topIngredients}.`
        }
        
        if (preferences.dietaryTags.length > 0) {
          personalizedPrompt += ` My preferred meal styles are ${preferences.dietaryTags.join(', ')}.`
        }
        
        // Set learned difficulty preference if not specified
        if (!mealData.difficulty || mealData.difficulty === 'medium') {
          enhancedMealData.difficulty = preferences.difficulty
        }
        
        enhancedMealData.prompt = personalizedPrompt
        console.log('Enhanced prompt with preferences:', personalizedPrompt)
      }
      
      if (mealData.generationType === 'weekly') {
        const { generationType, mealType, ...weeklyData } = enhancedMealData;
        console.log('Generating weekly meals with:', weeklyData)
        const meals = await generateAIWeeklyMeals(weeklyData);
        console.log('Weekly meals generated:', meals)
        setGeneratedWeeklyMeals(meals);
        setShowWeeklyModal(true);
      } else {
        const { generationType, ...singleMealData } = enhancedMealData;
        console.log('Generating single meal with:', singleMealData)
        const meal = await generateAIMeal(singleMealData);
        console.log('Single meal generated:', meal)
        setGeneratedMeal(meal);
        setShowGeneratedModal(true);
      }
    } catch (err) {
      console.error('Failed to generate AI meal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to generate meal: ${errorMessage}`)
    }
  }

  const handleSaveGeneratedMeal = async () => {
    if (!generatedMeal) return
    
    try {
      // Set scheduled date to today
      const today = new Date().toISOString().split('T')[0]
      await createMealPlan({
        ...generatedMeal,
        scheduledDate: today
      })
      setShowGeneratedModal(false)
      
      // Show shopping list modal with the saved meal
      setSavedMealsForShopping([generatedMeal])
      setShowShoppingListModal(true)
      
      setGeneratedMeal(null)
    } catch (err) {
      console.error('Failed to save meal:', err)
      alert('Failed to save meal plan')
    }
  }

  const handleSaveWeeklyMeals = async () => {
    if (!generatedWeeklyMeals.length) return;
    
    try {
      const today = new Date();
      const promises = generatedWeeklyMeals.map((meal, index) => {
        const mealDate = new Date(today);
        mealDate.setDate(today.getDate() + index);
        
        return createMealPlan({
          ...meal,
          scheduledDate: mealDate.toISOString().split('T')[0]
        });
      });
      
      await Promise.all(promises);
      setShowWeeklyModal(false);
      
      // Show shopping list modal with all saved meals
      setSavedMealsForShopping(generatedWeeklyMeals)
      setShowShoppingListModal(true)
      
      setGeneratedWeeklyMeals([]);
    } catch (err) {
      console.error('Failed to save weekly meals:', err);
      alert('Failed to save weekly meal plan');
    }
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-white/90 to-red-50/90 backdrop-blur-sm border border-white/20">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Meals</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-7xl h-[95vh] overflow-y-auto bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm border border-white/20">
            <div className="p-6">
              {/* Expanded Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">🍽️</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{getViewTitle()}</h3>
                    <p className="text-gray-500">
                      {displayMeals.length} meals • {favoriteMeals.length} favorites
                    </p>
                  </div>
                </div>

                {/* View Filter Dropdown */}
                <div className="flex items-center space-x-3">
                  <select
                    value={mealView}
                    onChange={(e) => setMealView(e.target.value as 'today' | 'upcoming' | 'favorites')}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="today">🍽️ Today's Meals</option>
                    <option value="upcoming">📅 Upcoming (7 days)</option>
                    <option value="favorites">⭐ Favorites ({favoriteMeals.length})</option>
                  </select>
                  
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                  >
                    <span>🤖</span>
                    <span>Generate</span>
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                    title="Collapse to normal view"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-600 hover:text-gray-800">
                      <path fill="currentColor" d="M1 1v6h6V1H1zM9 1v6h6V1H9zM1 9v6h6V9H1zM9 9v6h6V9H9z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 text-lg">Loading meals...</span>
                </div>
              )}

              {!loading && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Today's Meals Section */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <span>📅</span>
                      <span>Today's Meals</span>
                    </h4>
                    <div className="space-y-4">
                      {todaysMeals.length > 0 ? (
                        displayMeals.map((meal) => {
                          const typeInfo = getMealTypeInfo(meal.mealType)
                          return (
                            <div 
                              key={meal.id} 
                              className="flex items-start group cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors border border-gray-100"
                              onClick={() => setSelectedMeal(meal)}
                            >
                              <div className={`${typeInfo.color} p-3 rounded-full flex-shrink-0`}>
                                <span className="text-xl">{typeInfo.emoji}</span>
                              </div>
                              <div className="ml-4 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold capitalize flex items-center space-x-2">
                                      <span>{meal.mealType}</span>
                                      {meal.aiGenerated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
                                      {meal.isFavorite && <span className="text-red-500">❤️</span>}
                                    </h4>
                                    <p className="text-lg font-medium text-gray-800 truncate">{meal.title}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>⏱️ {meal.totalTime}m</span>
                                    <span>{meal.difficultyDisplay}</span>
                                    {meal.status === 'completed' && <span className="text-green-600">✅</span>}
                                  </div>
                                </div>
                                {meal.description && (
                                  <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <span className="text-4xl mb-3 block">🍽️</span>
                          <p>No meals planned for today</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* This Week's Meals Section */}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <span>📋</span>
                      <span>This Week's Meals</span>
                      <span className="text-sm text-gray-500 font-normal">({upcomingMeals.length} meals)</span>
                    </h4>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {upcomingMeals.length > 0 ? (
                        upcomingMeals
                          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                          .map((meal) => {
                            const typeInfo = getMealTypeInfo(meal.mealType)
                            const mealDate = new Date(meal.scheduledDate)
                            const today = new Date()
                            const isToday = mealDate.toDateString() === today.toDateString()
                            const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' })
                            
                            return (
                              <div 
                                key={meal.id} 
                                className={`flex items-start group cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors border ${isToday ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100'}`}
                                onClick={() => setSelectedMeal(meal)}
                              >
                                <div className={`${typeInfo.color} p-2 rounded-full flex-shrink-0`}>
                                  <span className="text-lg">{typeInfo.emoji}</span>
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                        <span>{dayName}</span>
                                        {isToday && <span className="text-purple-600 font-medium">• Today</span>}
                                      </div>
                                      <h4 className="font-medium capitalize flex items-center space-x-2">
                                        <span className="text-gray-600">{meal.mealType}:</span>
                                        <span className="text-gray-800">{meal.title}</span>
                                        {meal.aiGenerated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
                                        {meal.isFavorite && <span className="text-red-500">❤️</span>}
                                      </h4>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <span>⏱️ {meal.totalTime}m</span>
                                      {meal.status === 'completed' && <span className="text-green-600">✅</span>}
                                    </div>
                                  </div>
                                  {meal.description && (
                                    <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-5xl mb-4">📋</div>
                          <h4 className="text-xl font-medium text-gray-600 mb-2">No meals planned for this week</h4>
                          <p className="text-gray-500 mb-6">Generate a weekly AI meal plan!</p>
                          <button
                            onClick={() => setShowAIModal(true)}
                            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 mx-auto"
                          >
                            <span>🤖</span>
                            <span>Generate AI Weekly Plan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      
      <Card className="p-6 bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🍽️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Meals & Weekly Plan</h3>
              <p className="text-sm text-gray-500">
                {todaysMeals.length} today • {upcomingMeals.length} this week
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAIModal(true)}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-1"
            >
              <span>🤖</span>
              <span>Generate</span>
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
              title="Expand to full screen"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-600 hover:text-gray-800">
                <path fill="currentColor" d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading meals...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Today's Meals Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <span>📅</span>
                <span>Today's Meals</span>
              </h4>
              <div className="space-y-3">
                {todaysMeals.length > 0 ? (
                  todaysMeals.map((meal) => {
                    const typeInfo = getMealTypeInfo(meal.mealType)
                    return (
                      <div 
                        key={meal.id} 
                        className="flex items-start group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                        onClick={() => setSelectedMeal(meal)}
                      >
                        <div className={`${typeInfo.color} p-3 rounded-full flex-shrink-0`}>
                          <span className="text-xl">{typeInfo.emoji}</span>
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold capitalize flex items-center space-x-2">
                                <span>{meal.mealType}</span>
                                {meal.aiGenerated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
                                {meal.isFavorite && <span className="text-red-500">❤️</span>}
                              </h4>
                              <p className="text-lg font-medium text-gray-800 truncate">{meal.title}</p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>⏱️ {meal.totalTime}m</span>
                              <span>{meal.difficultyDisplay}</span>
                              {meal.status === 'completed' && <span className="text-green-600">✅</span>}
                            </div>
                          </div>
                          {meal.description && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{meal.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <span className="text-2xl mb-2 block">🍽️</span>
                    <p className="text-sm">No meals planned for today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Meals Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>This Week's Meals</span>
                <span className="text-sm text-gray-500 font-normal">({upcomingMeals.length} meals)</span>
              </h4>
              <div className="space-y-3">
                {upcomingMeals.length > 0 ? (
                  upcomingMeals
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                    .map((meal) => {
                      const typeInfo = getMealTypeInfo(meal.mealType)
                      const mealDate = new Date(meal.scheduledDate)
                      const today = new Date()
                      const isToday = mealDate.toDateString() === today.toDateString()
                      const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
                      
                      return (
                        <div 
                          key={meal.id} 
                          className={`flex items-start group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border ${isToday ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100'}`}
                          onClick={() => setSelectedMeal(meal)}
                        >
                          <div className={`${typeInfo.color} p-2 rounded-full flex-shrink-0`}>
                            <span className="text-lg">{typeInfo.emoji}</span>
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                  <span>{dayName}</span>
                                  {isToday && <span className="text-purple-600 font-medium">• Today</span>}
                                </div>
                                <h4 className="font-medium capitalize flex items-center space-x-2">
                                  <span className="text-gray-600">{meal.mealType}:</span>
                                  <span className="text-gray-800">{meal.title}</span>
                                  {meal.aiGenerated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>}
                                  {meal.isFavorite && <span className="text-red-500">❤️</span>}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>⏱️ {meal.totalTime}m</span>
                                {meal.status === 'completed' && <span className="text-green-600">✅</span>}
                              </div>
                            </div>
                            {meal.description && (
                              <p className="text-sm text-gray-600 mt-1 truncate">{meal.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No meals planned for this week</h4>
                    <p className="text-sm text-gray-500 mb-4">Generate a weekly AI meal plan!</p>
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <span>🤖</span>
                      <span>Generate AI Weekly Plan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* AI Generation Modal */}
      <AIMealModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleGenerateAI}
        favoriteMeals={favoriteMeals}
      />

      {/* Generated Meal Preview Modal */}
      {generatedMeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">🤖 AI Generated Meal</h2>
                <p className="text-gray-600">Review and save your AI-generated meal plan</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold mb-2">{generatedMeal.title}</h3>
                <p className="text-gray-600 mb-3">{generatedMeal.description}</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-purple-600">{generatedMeal.recipe?.prepTime || 0} + {generatedMeal.recipe?.cookTime || 0}</div>
                    <div className="text-sm text-gray-500">minutes</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-600">{generatedMeal.recipe?.servings || 4}</div>
                    <div className="text-sm text-gray-500">servings</div>
                  </div>
                  <div>
                    <div className="font-bold text-orange-600">{generatedMeal.recipe?.difficulty || 'medium'}</div>
                    <div className="text-sm text-gray-500">difficulty</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowGeneratedModal(false)
                    setGeneratedMeal(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveGeneratedMeal}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Save to Today</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Meal Detail Modal */}
      <MealModal
        isOpen={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        meal={selectedMeal}
        onComplete={completeMeal}
        onToggleFavorite={toggleFavorite}
        onDelete={async (mealId: string) => { await deleteMealPlan(mealId) }}
      />

      {/* Weekly Meals Preview Modal */}
      {generatedWeeklyMeals.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">🤖 AI Generated Weekly Meal Plan</h2>
                <p className="text-gray-600">Review and save your 7-day meal plan</p>
              </div>
              
              <div className="grid gap-4 mb-6">
                {generatedWeeklyMeals.map((meal, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() + index);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const mealInfo = getMealTypeInfo(meal.mealType);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`${mealInfo.color} p-2 rounded-full`}>
                            <span className="text-sm">{mealInfo.emoji}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{dayName} - {meal.title}</h3>
                            <p className="text-sm text-gray-600 capitalize">{meal.mealType}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {(meal.recipe?.prepTime || 0) + (meal.recipe?.cookTime || 0)} min
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{meal.description}</p>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWeeklyModal(false);
                    setGeneratedWeeklyMeals([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveWeeklyMeals}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Save Weekly Plan</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Shopping List Modal */}
      <ShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        meals={savedMealsForShopping}
      />
    </>
  )
}

export default MealsToday