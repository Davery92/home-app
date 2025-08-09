'use client'

import React, { useState } from 'react'

interface GroceryItem {
  id: string
  name: string
  emoji: string
  isCompleted: boolean
  canEdit?: boolean
}

const GroceryList: React.FC = () => {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([
    { id: '1', name: 'Potatos', emoji: '🥔', isCompleted: false },
    { id: '2', name: 'Hamburger', emoji: '🍔', isCompleted: false },
    { id: '3', name: 'Ham', emoji: '🍖', isCompleted: false },
    { id: '4', name: 'Honey', emoji: '🍯', isCompleted: true },
    { id: '5', name: 'Apple juice', emoji: '🧃', isCompleted: false },
    { id: '6', name: 'Ground beef', emoji: '🥩', isCompleted: true },
    { id: '7', name: 'White Onion', emoji: '🧅', isCompleted: true, canEdit: true },
    { id: '8', name: 'Oranges', emoji: '🍊', isCompleted: true, canEdit: true }
  ])

  const toggleItem = (itemId: string) => {
    setGroceryItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, isCompleted: !item.isCompleted }
          : item
      )
    )
  }

  const handleEdit = (itemId: string) => {
    console.log('Editing item:', itemId)
    // In real app, this would open an edit modal
  }

  return (
    <div className="bg-white p-6 rounded-3xl animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Grocery List</h3>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {groceryItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => toggleItem(item.id)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span 
                className={`ml-3 ${
                  item.isCompleted ? 'line-through text-gray-400' : ''
                }`}
              >
                {item.emoji} {item.name}
              </span>
            </div>
            
            {item.canEdit && (
              <button
                onClick={() => handleEdit(item.id)}
                className="text-blue-500 hover:text-blue-700 ml-2 transition-colors duration-200"
                title="Edit item"
              >
                <span className="material-icons text-lg">edit</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GroceryList