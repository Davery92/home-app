'use client'

import React, { useState, useMemo } from 'react'
import Card from './ui/Card'
import { useGrocery, GroceryItem } from '@/hooks/useGrocery'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (itemData: any) => Promise<void>
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: '',
    category: 'other',
    priority: 'medium',
    notes: '',
    brand: '',
    store: '',
    estimatedPrice: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      await onAdd({
        ...formData,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined
      })
      setFormData({
        name: '',
        quantity: 1,
        unit: '',
        category: 'other',
        priority: 'medium',
        notes: '',
        brand: '',
        store: '',
        estimatedPrice: ''
      })
      onClose()
    } catch (err) {
      console.error('Error adding item:', err)
      alert('Failed to add item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = [
    { value: 'produce', label: 'Produce', emoji: '🥬' },
    { value: 'dairy', label: 'Dairy', emoji: '🥛' },
    { value: 'meat', label: 'Meat', emoji: '🥩' },
    { value: 'seafood', label: 'Seafood', emoji: '🐟' },
    { value: 'bakery', label: 'Bakery', emoji: '🍞' },
    { value: 'frozen', label: 'Frozen', emoji: '🧊' },
    { value: 'pantry', label: 'Pantry', emoji: '🥫' },
    { value: 'beverages', label: 'Beverages', emoji: '🥤' },
    { value: 'snacks', label: 'Snacks', emoji: '🍿' },
    { value: 'household', label: 'Household', emoji: '🧽' },
    { value: 'personal', label: 'Personal Care', emoji: '🧴' },
    { value: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
    { value: 'other', label: 'Other', emoji: '📦' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add Grocery Item</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-400 hover:text-gray-600 text-xl">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter item name..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="lbs, oz, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedPrice}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Any additional notes..."
              />
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
                disabled={loading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

const GroceryList: React.FC = () => {
  const { 
    activeItems, 
    purchasedItems, 
    stats, 
    loading, 
    error, 
    addItem, 
    purchaseItem, 
    unpurchaseItem, 
    deleteItem,
    clearPurchasedItems 
  } = useGrocery()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPurchased, setShowPurchased] = useState(false)

  const getCategoryEmoji = (category: string) => {
    const emojis = {
      produce: '🥬',
      dairy: '🥛',
      meat: '🥩',
      seafood: '🐟',
      bakery: '🍞',
      frozen: '🧊',
      pantry: '🥫',
      beverages: '🥤',
      snacks: '🍿',
      household: '🧽',
      personal: '🧴',
      pharmacy: '💊',
      other: '📦'
    }
    return emojis[category as keyof typeof emojis] || emojis.other
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-blue-600',
      low: 'text-gray-600'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const totalActiveItems = useMemo(() => {
    return Object.values(activeItems).flat().length
  }, [activeItems])

  const sortedCategories = useMemo(() => {
    return Object.entries(activeItems).sort(([a], [b]) => a.localeCompare(b))
  }, [activeItems])

  const handlePurchaseToggle = async (item: GroceryItem) => {
    try {
      if (item.isPurchased) {
        await unpurchaseItem(item.id)
      } else {
        await purchaseItem(item.id)
      }
    } catch (err) {
      console.error('Failed to toggle item:', err)
    }
  }

  const handleAddItem = async (itemData: any) => {
    await addItem(itemData)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId)
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  const handleClearPurchased = async () => {
    if (confirm('Clear all purchased items from the list?')) {
      try {
        await clearPurchasedItems()
        setShowPurchased(false)
      } catch (err) {
        console.error('Failed to clear purchased items:', err)
      }
    }
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-white/90 to-red-50/90 backdrop-blur-sm border border-white/20">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Grocery List</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-white/90 to-green-50/90 backdrop-blur-sm border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🛒</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Grocery List</h3>
              <p className="text-sm text-gray-500">
                {totalActiveItems} active items • ${stats.estimatedCost.toFixed(2)} estimated
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPurchased(!showPurchased)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showPurchased
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showPurchased ? 'Hide Purchased' : 'Show Purchased'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              + Add Item
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading grocery list...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Active Items */}
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryEmoji(category)}</span>
                    <h4 className="text-sm font-medium text-gray-700 capitalize">
                      {category} ({items.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className="flex items-center flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.isPurchased}
                            onChange={() => handlePurchaseToggle(item)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className={`text-sm truncate ${
                              item.isPurchased ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}>
                              {item.name}
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({item.quantity}{item.unit})
                                </span>
                              )}
                            </div>
                            {item.estimatedPrice && (
                              <div className="text-xs text-gray-500">
                                ${item.estimatedPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                          {item.priority !== 'medium' && (
                            <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(item.priority)} bg-current/10 ml-2`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-2 transition-all text-sm"
                          title="Delete item"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🛒</div>
                <h4 className="text-lg font-medium text-gray-600 mb-2">No items in your list</h4>
                <p className="text-sm text-gray-500 mb-4">Add some items to get started!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add First Item
                </button>
              </div>
            )}

            {/* Purchased Items */}
            {showPurchased && purchasedItems.length > 0 && (
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">✅</span>
                    <h4 className="text-sm font-medium text-gray-700">
                      Recently Purchased ({purchasedItems.length})
                    </h4>
                  </div>
                  {purchasedItems.length > 0 && (
                    <button
                      onClick={handleClearPurchased}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handlePurchaseToggle(item)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm line-through text-gray-400 truncate">
                            {getCategoryEmoji(item.category)} {item.name}
                            {item.quantity > 1 && (
                              <span className="text-xs ml-1">
                                ({item.quantity}{item.unit})
                              </span>
                            )}
                          </div>
                          {item.actualPrice && (
                            <div className="text-xs text-green-600">
                              Paid: ${item.actualPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </>
  )
}

export default GroceryList