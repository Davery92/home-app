'use client'

import React from 'react'

interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner'
  icon: string
  iconColor: string
  backgroundColor: string
  items: string[]
}

const MealsToday: React.FC = () => {
  const meals: Meal[] = [
    {
      type: 'breakfast',
      icon: 'breakfast_dining',
      iconColor: 'text-yellow-600',
      backgroundColor: 'bg-yellow-100',
      items: ['Oatmeal', 'Caesar Salad']
    },
    {
      type: 'lunch',
      icon: 'lunch_dining',
      iconColor: 'text-orange-600',
      backgroundColor: 'bg-orange-100',
      items: ['Lasagna', 'Apple Pie', 'Soft Pretzels']
    },
    {
      type: 'dinner',
      icon: 'dinner_dining',
      iconColor: 'text-red-600',
      backgroundColor: 'bg-red-100',
      items: ['Jambalaya', 'Guacamole']
    }
  ]

  const handleRefresh = () => {
    console.log('Refreshing meal plan...')
    // In real app, this would trigger AI meal planning
  }

  return (
    <div className="bg-white p-6 rounded-3xl animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Today's Meals</h3>
        <button 
          onClick={handleRefresh}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Refresh meal plan"
        >
          <span className="material-icons">cached</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {meals.map((meal) => (
          <div key={meal.type} className="flex items-start">
            <div className={`${meal.backgroundColor} p-3 rounded-full`}>
              <span className={`material-icons ${meal.iconColor}`}>
                {meal.icon}
              </span>
            </div>
            <div className="ml-4">
              <h4 className="font-semibold capitalize">{meal.type}</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {meal.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealsToday