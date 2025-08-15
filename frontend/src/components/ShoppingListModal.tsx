'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'

interface Ingredient {
  name: string
  amount: string
  estimatedPrice?: number
  alreadyHave?: boolean
}

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  meals: any[]
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ 
  isOpen, 
  onClose, 
  meals 
}) => {
  const { token } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingToGroceryList, setIsAddingToGroceryList] = useState(false)

  useEffect(() => {
    if (isOpen && meals.length > 0) {
      extractAndPriceIngredients()
    }
  }, [isOpen, meals])

  const extractAndPriceIngredients = async () => {
    setIsLoading(true)
    console.log('Extracting ingredients from meals:', meals)
    try {
      // Extract all ingredients from meals
      const allIngredients: Ingredient[] = []
      const ingredientMap = new Map<string, { amount: string, count: number }>()

      meals.forEach(meal => {
        // Check if meal has recipe with ingredients (for saved meals from DB)
        const ingredients = meal.recipe?.ingredients || meal.ingredients || []
        console.log('Meal ingredients:', meal.name || meal.title, ingredients)
        
        if (Array.isArray(ingredients) && ingredients.length > 0) {
          ingredients.forEach((ingredient: any) => {
            let name = ''
            let amount = ''
            
            // Handle object format {name, amount, unit}
            if (typeof ingredient === 'object' && ingredient.name) {
              name = ingredient.name.toLowerCase().trim()
              amount = ingredient.amount || '1'
              if (ingredient.unit) {
                amount = `${amount} ${ingredient.unit}`
              }
            }
            // Handle string format "2 cups rice"
            else if (typeof ingredient === 'string') {
              const match = ingredient.match(/^([\d./\s¼½¾⅓⅔⅛⅜⅝⅞]+\s*\w*)\s+(.+)/)
              if (match) {
                amount = match[1].trim()
                name = match[2].toLowerCase().trim()
              } else {
                name = ingredient.toLowerCase().trim()
                amount = '1'
              }
            }

            if (name) {
              const key = name
              if (ingredientMap.has(key)) {
                const existing = ingredientMap.get(key)!
                existing.count += 1
                // Combine amounts if different
                if (existing.amount !== amount && amount) {
                  existing.amount = `${existing.amount}, ${amount}`
                }
              } else {
                ingredientMap.set(key, { amount: amount || '1', count: 1 })
              }
            }
          })
        }
      })

      // Convert map to array and get AI price estimates
      for (const [name, data] of ingredientMap.entries()) {
        const estimatedPrice = await getAIPriceEstimate(name, data.amount)
        allIngredients.push({
          name,
          amount: data.amount || '1',
          estimatedPrice,
          alreadyHave: false
        })
      }

      setIngredients(allIngredients)
    } catch (error) {
      console.error('Error extracting ingredients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAIPriceEstimate = async (ingredient: string, amount: string): Promise<number> => {
    try {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/ai/estimate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredient,
          amount
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.estimatedPrice || 2.99 // fallback price
      }
    } catch (error) {
      console.error('Error getting AI price estimate:', error)
    }
    
    // Fallback price estimation based on common ingredients
    const commonPrices: Record<string, number> = {
      'chicken': 6.99,
      'beef': 8.99,
      'pork': 5.99,
      'rice': 2.49,
      'pasta': 1.99,
      'bread': 2.99,
      'milk': 3.49,
      'eggs': 3.99,
      'onion': 1.49,
      'garlic': 0.99,
      'tomato': 2.99,
      'cheese': 4.99,
      'oil': 3.99,
      'salt': 0.99,
      'pepper': 2.99
    }

    const lowerIngredient = ingredient.toLowerCase()
    for (const [key, price] of Object.entries(commonPrices)) {
      if (lowerIngredient.includes(key)) {
        return price
      }
    }

    return 2.99 // default fallback price
  }

  const toggleIngredientAvailability = (index: number) => {
    setIngredients(prev => prev.map((ingredient, i) => 
      i === index 
        ? { ...ingredient, alreadyHave: !ingredient.alreadyHave }
        : ingredient
    ))
  }

  const addToGroceryList = async () => {
    if (!token) return

    setIsAddingToGroceryList(true)
    try {
      const itemsToAdd = ingredients
        .filter(ingredient => !ingredient.alreadyHave)
        .map(ingredient => ({
          name: `${ingredient.amount} ${ingredient.name}`,
          category: 'From Meal Plan',
          priority: 'Medium',
          estimatedPrice: ingredient.estimatedPrice || 0
        }))

      console.log('Adding items to grocery list:', itemsToAdd)
      
      for (const item of itemsToAdd) {
        console.log('Creating grocery item:', item)
        const response = await apiService.createGroceryItem(token, item)
        console.log('Grocery item created:', response)
      }

      alert(`Added ${itemsToAdd.length} items to your grocery list!`)
      onClose()
    } catch (error) {
      console.error('Error adding items to grocery list:', error)
      console.error('Full error details:', JSON.stringify(error, null, 2))
      alert(`Error adding items to grocery list: ${error.message || 'Please try again.'}`)
    } finally {
      setIsAddingToGroceryList(false)
    }
  }

  const totalEstimatedCost = ingredients
    .filter(ingredient => !ingredient.alreadyHave)
    .reduce((sum, ingredient) => sum + (ingredient.estimatedPrice || 0), 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shopping List</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Ingredients needed for {meals.length} meal{meals.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing ingredients and estimating prices...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Ingredients: {ingredients.length}</p>
                    <p className="text-sm text-blue-600">Already Have: {ingredients.filter(i => i.alreadyHave).length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-800">${totalEstimatedCost.toFixed(2)}</p>
                    <p className="text-sm text-blue-600">Estimated Cost</p>
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      ingredient.alreadyHave 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ingredient.alreadyHave || false}
                      onChange={() => toggleIngredientAvailability(index)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${ingredient.alreadyHave ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                          {ingredient.amount} {ingredient.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${ingredient.alreadyHave ? 'text-green-600 line-through' : 'text-blue-600'}`}>
                        ${(ingredient.estimatedPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={addToGroceryList}
            disabled={isAddingToGroceryList || ingredients.filter(i => !i.alreadyHave).length === 0}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingToGroceryList ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Adding...</span>
              </span>
            ) : (
              `Add ${ingredients.filter(i => !i.alreadyHave).length} Items to Grocery List`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShoppingListModal