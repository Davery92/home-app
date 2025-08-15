'use client'

import React, { useState } from 'react'
import Card from './ui/Card'

interface QuickAction {
  id: string
  icon: string
  label: string
  gradient: string
  iconColor: string
  onClick: () => void
}

interface QuickActionsProps {
  onOpenAI: () => void
}

const QuickActions: React.FC<QuickActionsProps> = ({ onOpenAI }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const actions: QuickAction[] = [
    {
      id: 'add-task',
      icon: '✅',
      label: 'Add Task',
      gradient: 'from-purple-400 to-purple-600',
      iconColor: 'text-white',
      onClick: () => setActiveModal('add-task')
    },
    {
      id: 'add-event',
      icon: '📅',
      label: 'New Event',
      gradient: 'from-emerald-400 to-emerald-600',
      iconColor: 'text-white',
      onClick: () => setActiveModal('add-event')
    },
    {
      id: 'grocery',
      icon: '🛒',
      label: 'Quick Shop',
      gradient: 'from-rose-400 to-rose-600',
      iconColor: 'text-white',
      onClick: () => setActiveModal('grocery')
    },
    {
      id: 'ai-help',
      icon: '🤖',
      label: 'AI Assistant',
      gradient: 'from-amber-400 to-amber-600',
      iconColor: 'text-white',
      onClick: () => onOpenAI()
    }
  ]

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Quick Actions</h3>
        <div className="text-gray-400 text-sm">⋯</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            className="group p-2 rounded-2xl bg-gradient-to-r hover:scale-[1.05] transition-all duration-200 shadow-sm hover:shadow-md"
            style={{
              background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
            }}
            onClick={action.onClick}
          >
            <div className={`bg-gradient-to-r ${action.gradient} rounded-2xl p-2 w-full`}>
              <div className="text-center">
                <div className="text-lg mb-1">
                  {action.icon}
                </div>
                <p className="text-xs font-medium text-white opacity-90">
                  {action.label}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

    </div>
    
    {/* Quick Task Modal */}
    {activeModal === 'add-task' && (
      <QuickTaskModal 
        onClose={() => setActiveModal(null)} 
      />
    )}

    {/* Quick Event Modal */}
    {activeModal === 'add-event' && (
      <QuickEventModal 
        onClose={() => setActiveModal(null)} 
      />
    )}

    {/* Quick Grocery Modal */}
    {activeModal === 'grocery' && (
      <QuickGroceryModal 
        onClose={() => setActiveModal(null)} 
      />
    )}
    </>
  )
}

// Quick Task Modal Component
const QuickTaskModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [task, setTask] = useState('')
  const [priority, setPriority] = useState('medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (task.trim()) {
      // TODO: Add to tasks API
      console.log('Adding task:', { task, priority })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-[800px] h-[500px] bg-white flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-2">
              <div className="text-white text-xl">✅</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Quick Add Task</h2>
              <p className="text-sm text-gray-500">Add a task to your personal todo list</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <div className="text-gray-400 hover:text-gray-600 text-2xl">×</div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What needs to be done? *
              </label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter task description..."
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'low', label: 'Low', emoji: '🟢' },
                  { value: 'medium', label: 'Medium', emoji: '🟡' },
                  { value: 'high', label: 'High', emoji: '🔴' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                      priority === option.value 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {option.emoji}
                    </div>
                    <div className="text-sm font-medium text-gray-700">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-lg">💡</div>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Quick Tip</p>
                  <p className="text-sm text-blue-700">
                    Break down large tasks into smaller, actionable steps for better productivity!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Add Task
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Quick Event Modal Component
const QuickEventModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [event, setEvent] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (event.trim() && date) {
      // TODO: Add to calendar API
      console.log('Adding event:', { event, date, time })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-[800px] h-[500px] bg-white flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-2">
              <div className="text-white text-xl">📅</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Quick Add Event</h2>
              <p className="text-sm text-gray-500">Add an event to your family calendar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <div className="text-gray-400 hover:text-gray-600 text-2xl">×</div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Event Title *
              </label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Enter event title..."
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Time <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg"
              />
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="text-green-600 text-lg">📋</div>
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">Family Calendar</p>
                  <p className="text-sm text-green-700">
                    This event will be visible to all family members and can help everyone stay organized!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Add Event
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Quick Grocery Modal Component
const QuickGroceryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState([''])

  const addItem = () => {
    setItems([...items, ''])
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter(item => item.trim())
    if (validItems.length > 0) {
      // TODO: Add to grocery list API
      console.log('Adding grocery items:', validItems)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-[800px] h-[500px] bg-white flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl p-2">
              <div className="text-white text-xl">🛒</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Quick Add Groceries</h2>
              <p className="text-sm text-gray-500">Add items to your family shopping list</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <div className="text-gray-400 hover:text-gray-600 text-2xl">×</div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Items to buy
              </label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}...`}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 text-lg"
                        autoFocus={index === items.length - 1}
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
                      >
                        <div className="text-lg">×</div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addItem}
                className="mt-4 flex items-center space-x-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <span className="text-lg">+</span>
                <span className="font-medium">Add another item</span>
              </button>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="text-orange-600 text-lg">🛍️</div>
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">Shopping Tip</p>
                  <p className="text-sm text-orange-700">
                    Organize your list by store sections (produce, dairy, meat) for more efficient shopping!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Add Items
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default QuickActions