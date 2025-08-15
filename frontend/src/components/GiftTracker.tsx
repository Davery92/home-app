'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'
import Card from './ui/Card'

interface GiftEvent {
  _id?: string
  id: string
  title: string
  description?: string
  eventDate?: string
  totalBudget: number
  totalSpent: number
  recipientCount: number
  status: 'planning' | 'shopping' | 'completed' | 'archived'
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

interface GiftEventStats {
  total: number
  active: number
  planning: number
  shopping: number
  completed: number
  totalBudget: number
  totalSpent: number
}

const GiftTracker: React.FC = () => {
  const { token } = useAuth()
  const [events, setEvents] = useState<GiftEvent[]>([])
  const [stats, setStats] = useState<GiftEventStats>({
    total: 0,
    active: 0,
    planning: 0,
    shopping: 0,
    completed: 0,
    totalBudget: 0,
    totalSpent: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<GiftEvent | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: '',
    totalBudget: 0
  })

  const fetchEvents = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getGiftEvents(token)
      
      if (response.success) {
        setEvents(response.events)
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching gift events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [token])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newEvent.title.trim()) return
    
    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        eventDate: newEvent.eventDate || undefined,
        totalBudget: newEvent.totalBudget || 0
      }

      const response = await apiService.createGiftEvent(token, eventData)
      
      if (response.success) {
        setEvents(prev => [response.event, ...prev])
        setNewEvent({
          title: '',
          description: '',
          eventDate: '',
          totalBudget: 0
        })
        setShowCreateForm(false)
        fetchEvents() // Refresh stats
      }
    } catch (error) {
      console.error('Error creating gift event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!token || !confirm('Are you sure you want to delete this event? This will also delete all recipients and gift items.')) return
    
    try {
      const response = await apiService.deleteGiftEvent(token, eventId)
      
      if (response.success) {
        setEvents(prev => prev.filter(event => (event._id || event.id) !== eventId))
        setSelectedEvent(null)
        fetchEvents() // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting gift event:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return '📋'
      case 'shopping': return '🛒'
      case 'completed': return '✅'
      case 'archived': return '📦'
      default: return '📝'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-blue-600 bg-blue-100'
      case 'shopping': return 'text-orange-600 bg-orange-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'archived': return 'text-gray-600 bg-gray-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getBudgetProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0
    return Math.min((spent / budget) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilEvent = (eventDate: string) => {
    const today = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Past'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading gift tracker...</span>
        </div>
      </Card>
    )
  }

  if (selectedEvent) {
    return <GiftEventDetail 
      event={selectedEvent} 
      onBack={() => setSelectedEvent(null)} 
      onEventUpdate={(updatedEvent) => {
        setEvents(prev => prev.map(e => (e._id || e.id) === (updatedEvent._id || updatedEvent.id) ? updatedEvent : e))
        setSelectedEvent(updatedEvent)
        fetchEvents()
      }}
    />
  }

  return (
    <Card className="p-6" gradient={true}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🎁</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Gift Tracker</h3>
            <p className="text-gray-500">
              {stats.active} active events • {formatCurrency(stats.totalSpent)} spent
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Event</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.planning}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Planning</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.shopping}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Shopping</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalBudget)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Budget</div>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Spent</div>
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Event</h3>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setNewEvent({
                  title: '',
                  description: '',
                  eventDate: '',
                  totalBudget: 0
                })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Christmas 2024, Mom's Birthday"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newEvent.totalBudget || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, totalBudget: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Create Event
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎁</div>
            <p className="text-lg font-medium mb-2">No gift events yet</p>
            <p className="text-sm mb-4">Create your first event to start tracking gifts!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className="p-4 rounded-lg border bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white">{event.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)} {event.status}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                    <span>👥 {event.recipientCount} recipients</span>
                    {event.eventDate && (
                      <span>📅 {formatDate(event.eventDate)} ({getDaysUntilEvent(event.eventDate)})</span>
                    )}
                    <span>💰 {formatCurrency(event.totalSpent)} of {formatCurrency(event.totalBudget)}</span>
                  </div>

                  {/* Budget Progress Bar */}
                  {event.totalBudget > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getBudgetProgress(event.totalSpent, event.totalBudget) > 90 
                            ? 'bg-red-500' 
                            : getBudgetProgress(event.totalSpent, event.totalBudget) > 75
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${getBudgetProgress(event.totalSpent, event.totalBudget)}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEvent(event._id || event.id)
                  }}
                  className="ml-4 text-red-400 hover:text-red-600 text-sm"
                  title="Delete event"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

// Complete Gift Event Detail Component
const GiftEventDetail: React.FC<{
  event: GiftEvent
  onBack: () => void
  onEventUpdate: (event: GiftEvent) => void
}> = ({ event, onBack, onEventUpdate }) => {
  const { token } = useAuth()
  const [recipients, setRecipients] = useState<any[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    group: 'Family',
    budget: 0,
    notes: ''
  })

  const fetchRecipients = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getGiftRecipients(token, event._id || event.id)
      
      if (response.success) {
        setRecipients(response.recipients)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipients()
  }, [token, event.id])

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleAddRecipient called', { token: !!token, newRecipient, eventId: event.id, eventIdFallback: event._id })
    
    if (!token || !newRecipient.name.trim()) {
      console.log('Early return:', { hasToken: !!token, hasName: !!newRecipient.name.trim() })
      return
    }
    
    try {
      console.log('Making API call to create recipient...')
      const response = await apiService.createGiftRecipient(token, event._id || event.id, {
        name: newRecipient.name.trim(),
        group: newRecipient.group,
        budget: newRecipient.budget,
        notes: newRecipient.notes.trim()
      })
      
      console.log('API response:', response)
      
      if (response.success) {
        console.log('Success! Adding recipient to list')
        setRecipients(prev => [...prev, response.recipient])
        setNewRecipient({ name: '', group: 'Family', budget: 0, notes: '' })
        setShowAddRecipient(false)
        
        // Update event recipient count
        const updatedEvent = { ...event, recipientCount: event.recipientCount + 1 }
        onEventUpdate(updatedEvent)
      } else {
        console.error('API returned unsuccessful response:', response)
      }
    } catch (error) {
      console.error('Error adding recipient:', error)
      alert(`Error adding recipient: ${error.message || 'Please try again.'}`)
    }
  }

  const handleDeleteRecipient = async (recipientId: string) => {
    if (!token || !confirm('Are you sure you want to delete this recipient? This will also delete all their gift items.')) return
    
    try {
      const response = await apiService.deleteGiftRecipient(token, recipientId)
      
      if (response.success) {
        setRecipients(prev => prev.filter(r => r.id !== recipientId))
        if (selectedRecipient?.id === recipientId) {
          setSelectedRecipient(null)
        }
        
        // Update event recipient count
        const updatedEvent = { ...event, recipientCount: event.recipientCount - 1 }
        onEventUpdate(updatedEvent)
      }
    } catch (error) {
      console.error('Error deleting recipient:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getGroupIcon = (group: string) => {
    switch (group.toLowerCase()) {
      case 'family': return '👨‍👩‍👧‍👦'
      case 'friends': return '👥'
      case 'coworkers': case 'co-workers': return '💼'
      case 'extended family': return '👪'
      default: return '👤'
    }
  }

  const getBudgetProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0
    return Math.min((spent / budget) * 100, 100)
  }

  if (selectedRecipient) {
    return <RecipientDetail 
      recipient={selectedRecipient} 
      event={event}
      onBack={() => setSelectedRecipient(null)}
      onRecipientUpdate={(updated) => {
        setRecipients(prev => prev.map(r => r.id === updated.id ? updated : r))
        setSelectedRecipient(updated)
      }}
    />
  }

  return (
    <Card className="p-6" gradient={true}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-600 text-xl">←</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{event.title}</h2>
            <p className="text-gray-500">
              {recipients.length} recipients • {formatCurrency(event.totalSpent)} of {formatCurrency(event.totalBudget)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddRecipient(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Recipient</span>
        </button>
      </div>

      {/* Event Budget Progress */}
      {event.totalBudget > 0 && (
        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Event Budget</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(event.totalSpent)} / {formatCurrency(event.totalBudget)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                getBudgetProgress(event.totalSpent, event.totalBudget) > 90 
                  ? 'bg-red-500' 
                  : getBudgetProgress(event.totalSpent, event.totalBudget) > 75
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${getBudgetProgress(event.totalSpent, event.totalBudget)}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Recipient Form */}
      {showAddRecipient && (
        <div className="mb-6 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Recipient</h3>
            <button
              onClick={() => {
                setShowAddRecipient(false)
                setNewRecipient({ name: '', group: 'Family', budget: 0, notes: '' })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleAddRecipient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="Recipient name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <select
                  value={newRecipient.group}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, group: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Family">👨‍👩‍👧‍👦 Family</option>
                  <option value="Friends">👥 Friends</option>
                  <option value="Co-Workers">💼 Co-Workers</option>
                  <option value="Extended Family">👪 Extended Family</option>
                  <option value="Other">👤 Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newRecipient.budget || ''}
                onChange={(e) => setNewRecipient(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={newRecipient.notes}
                onChange={(e) => setNewRecipient(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Any notes about this recipient..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Add Recipient
              </button>
              <button
                type="button"
                onClick={() => setShowAddRecipient(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipients List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <span className="text-gray-600">Loading recipients...</span>
        </div>
      ) : recipients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-lg font-medium mb-2">No recipients yet</p>
          <p className="text-sm mb-4">Add someone to start tracking their gifts!</p>
          <button
            onClick={() => setShowAddRecipient(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Add First Recipient
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipients.map(recipient => (
            <div
              key={recipient.id}
              className="p-4 rounded-lg border bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all cursor-pointer"
              onClick={() => setSelectedRecipient(recipient)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getGroupIcon(recipient.group)}</span>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">{recipient.name}</h4>
                    <p className="text-xs text-gray-500">{recipient.group}</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteRecipient(recipient.id)
                  }}
                  className="text-red-400 hover:text-red-600 text-sm"
                  title="Delete recipient"
                >
                  🗑️
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Ideas:</span>
                  <span>{recipient.ideaCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchases:</span>
                  <span>{recipient.purchaseCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spent:</span>
                  <span className="font-medium">{formatCurrency(recipient.totalSpent || 0)}</span>
                </div>
                {recipient.budget > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Budget:</span>
                      <span>{formatCurrency(recipient.budget)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getBudgetProgress(recipient.totalSpent || 0, recipient.budget) > 90 
                            ? 'bg-red-500' 
                            : getBudgetProgress(recipient.totalSpent || 0, recipient.budget) > 75
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${getBudgetProgress(recipient.totalSpent || 0, recipient.budget)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {recipient.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{recipient.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// Recipient Detail Component for Gift Management
const RecipientDetail: React.FC<{
  recipient: any
  event: GiftEvent
  onBack: () => void
  onRecipientUpdate: (recipient: any) => void
}> = ({ recipient, event, onBack, onRecipientUpdate }) => {
  const { token } = useAuth()
  const [giftItems, setGiftItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ideas' | 'purchases'>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formType, setFormType] = useState<'idea' | 'purchase'>('idea')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [newGift, setNewGift] = useState({
    name: '',
    description: '',
    estimatedPrice: 0,
    actualPrice: 0,
    url: '',
    priority: 'medium',
    category: '',
    store: '',
    notes: '',
    status: 'idea'
  })

  const fetchGiftItems = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getGiftItems(token, recipient._id || recipient.id)
      
      if (response.success) {
        setGiftItems(response.items)
      }
    } catch (error) {
      console.error('Error fetching gift items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGiftItems()
  }, [token, recipient._id, recipient.id])

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleAddGift called', { token: !!token, newGift, recipientId: recipient.id, recipientIdFallback: recipient._id, formType })
    
    if (!token || !newGift.name.trim()) {
      console.log('Early return:', { hasToken: !!token, hasName: !!newGift.name.trim() })
      return
    }
    
    try {
      console.log('Making API call to create gift item...')
      const giftData = {
        name: newGift.name.trim(),
        description: newGift.description.trim(),
        estimatedPrice: formType === 'idea' ? newGift.estimatedPrice : 0,
        actualPrice: formType === 'purchase' ? newGift.actualPrice : 0,
        url: newGift.url.trim(),
        type: formType,
        status: formType === 'idea' ? 'idea' : 'to_buy',
        priority: newGift.priority,
        category: newGift.category.trim(),
        store: newGift.store.trim(),
        notes: newGift.notes.trim(),
        purchaseDate: formType === 'purchase' ? new Date().toISOString() : undefined
      }

      const response = await apiService.createGiftItem(token, recipient._id || recipient.id, giftData)
      
      console.log('API response:', response)
      
      if (response.success) {
        console.log('Success! Adding gift item to list')
        setGiftItems(prev => [response.item, ...prev])
        setNewGift({
          name: '', description: '', estimatedPrice: 0, actualPrice: 0, url: '',
          priority: 'medium', category: '', store: '', notes: '', status: 'idea'
        })
        setShowAddForm(false)
        
        // Refresh recipient data
        fetchRecipientData()
      } else {
        console.error('API returned unsuccessful response:', response)
      }
    } catch (error) {
      console.error('Error adding gift:', error)
      alert(`Error adding gift: ${error.message || 'Please try again.'}`)
    }
  }

  const fetchRecipientData = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getGiftRecipients(token, event._id || event.id)
      if (response.success) {
        const updated = response.recipients.find((r: any) => (r._id || r.id) === (recipient._id || recipient.id))
        if (updated) {
          onRecipientUpdate(updated)
        }
      }
    } catch (error) {
      console.error('Error fetching recipient data:', error)
    }
  }

  const handleMoveToPurchase = async (itemId: string) => {
    if (!token) return
    
    const actualPrice = prompt('Enter the actual price:')
    if (actualPrice === null) return
    
    console.log('Moving item to purchase:', { itemId, actualPrice })
    
    try {
      const response = await apiService.moveGiftItemToPurchase(token, itemId, {
        actualPrice: parseFloat(actualPrice) || 0,
        purchaseDate: new Date().toISOString(),
        store: ''
      })
      
      console.log('Move to purchase response:', response)
      
      if (response.success) {
        console.log('Successfully moved to purchase')
        setGiftItems(prev => prev.map(item => 
          (item._id || item.id) === itemId ? response.item : item
        ))
        fetchRecipientData()
      } else {
        console.error('Move to purchase failed:', response)
        alert('Failed to move item to purchase. Please try again.')
      }
    } catch (error) {
      console.error('Error moving to purchase:', error)
      alert(`Error moving to purchase: ${error.message || 'Please try again.'}`)
    }
  }

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    if (!token) return
    
    try {
      const response = await apiService.updateGiftItem(token, itemId, { status: newStatus })
      
      if (response.success) {
        setGiftItems(prev => prev.map(item => 
          (item._id || item.id) === itemId ? { ...item, status: newStatus } : item
        ))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEditGift = (item: any) => {
    setEditingItem(item)
    setNewGift({
      name: item.name || '',
      description: item.description || '',
      estimatedPrice: item.estimatedPrice || 0,
      actualPrice: item.actualPrice || 0,
      url: item.url || '',
      priority: item.priority || 'medium',
      category: item.category || '',
      store: item.store || '',
      notes: item.notes || '',
      status: item.status || 'idea'
    })
    setFormType(item.type)
    setShowEditForm(true)
  }

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingItem || !newGift.name.trim()) return
    
    console.log('Updating gift item:', { itemId: editingItem.id, updates: newGift })
    
    try {
      const updates = {
        name: newGift.name.trim(),
        description: newGift.description.trim(),
        estimatedPrice: editingItem.type === 'idea' ? newGift.estimatedPrice : editingItem.estimatedPrice,
        actualPrice: editingItem.type === 'purchase' ? newGift.actualPrice : editingItem.actualPrice,
        url: newGift.url.trim(),
        priority: newGift.priority,
        category: newGift.category.trim(),
        store: newGift.store.trim(),
        notes: newGift.notes.trim()
      }

      const response = await apiService.updateGiftItem(token, editingItem._id || editingItem.id, updates)
      
      console.log('Update gift response:', response)
      
      if (response.success) {
        console.log('Successfully updated gift item')
        setGiftItems(prev => prev.map(item => 
          (item._id || item.id) === (editingItem._id || editingItem.id) ? response.item : item
        ))
        setEditingItem(null)
        setShowEditForm(false)
        setNewGift({
          name: '', description: '', estimatedPrice: 0, actualPrice: 0, url: '',
          priority: 'medium', category: '', store: '', notes: '', status: 'idea'
        })
        fetchRecipientData()
      } else {
        console.error('Update gift failed:', response)
        alert('Failed to update gift item. Please try again.')
      }
    } catch (error) {
      console.error('Error updating gift:', error)
      alert(`Error updating gift: ${error.message || 'Please try again.'}`)
    }
  }

  const handleDeleteGift = async (itemId: string) => {
    if (!token || !confirm('Are you sure you want to delete this gift item?')) return
    
    try {
      const response = await apiService.deleteGiftItem(token, itemId)
      
      if (response.success) {
        setGiftItems(prev => prev.filter(item => (item._id || item.id) !== itemId))
        fetchRecipientData()
      }
    } catch (error) {
      console.error('Error deleting gift:', error)
    }
  }

  const getFilteredItems = () => {
    switch (filter) {
      case 'ideas':
        return giftItems.filter(item => item.type === 'idea')
      case 'purchases':
        return giftItems.filter(item => item.type === 'purchase')
      default:
        return giftItems
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idea': return '💡'
      case 'to_buy': return '🛒'
      case 'ordered': return '📦'
      case 'to_wrap': return '🎁'
      case 'wrapped': return '✅'
      case 'given': return '🎉'
      default: return '💡'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea': return 'bg-gray-100 text-gray-700'
      case 'to_buy': return 'bg-blue-100 text-blue-700'
      case 'ordered': return 'bg-orange-100 text-orange-700'
      case 'to_wrap': return 'bg-purple-100 text-purple-700'
      case 'wrapped': return 'bg-green-100 text-green-700'
      case 'given': return 'bg-pink-100 text-pink-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'must_have': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredItems = getFilteredItems()
  const ideas = giftItems.filter(item => item.type === 'idea')
  const purchases = giftItems.filter(item => item.type === 'purchase')

  return (
    <Card className="p-6" gradient={true}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-600 text-xl">←</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{recipient.name}</h2>
            <p className="text-gray-500">
              {recipient.group} • {ideas.length} ideas, {purchases.length} purchases • {formatCurrency(recipient.totalSpent || 0)} spent
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setFormType('idea')
              setShowAddForm(true)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <span>💡</span>
            <span>Track Idea</span>
          </button>
          <button
            onClick={() => {
              setFormType('purchase')
              setShowAddForm(true)
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <span>🛒</span>
            <span>Track Purchase</span>
          </button>
        </div>
      </div>

      {/* Budget Progress */}
      {recipient.budget > 0 && (
        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{recipient.name}'s Budget</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(recipient.totalSpent || 0)} / {formatCurrency(recipient.budget)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                ((recipient.totalSpent || 0) / recipient.budget) * 100 > 90 
                  ? 'bg-red-500' 
                  : ((recipient.totalSpent || 0) / recipient.budget) * 100 > 75
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(((recipient.totalSpent || 0) / recipient.budget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '📋 All Items', count: giftItems.length },
          { key: 'ideas', label: '💡 Ideas', count: ideas.length },
          { key: 'purchases', label: '🛒 Purchases', count: purchases.length }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-500 text-white'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Add Gift Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {formType === 'idea' ? '💡 Track Gift Idea' : '🛒 Track Purchase'}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleAddGift} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gift Name *
              </label>
              <input
                type="text"
                placeholder="What's the gift?"
                value={newGift.name}
                onChange={(e) => setNewGift(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formType === 'idea' ? 'Estimated Price' : 'Actual Price'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formType === 'idea' ? newGift.estimatedPrice || '' : newGift.actualPrice || ''}
                  onChange={(e) => setNewGift(prev => ({ 
                    ...prev, 
                    [formType === 'idea' ? 'estimatedPrice' : 'actualPrice']: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newGift.priority}
                  onChange={(e) => setNewGift(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="must_have">Must Have</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Electronics, Clothing"
                  value={newGift.category}
                  onChange={(e) => setNewGift(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store
                </label>
                <input
                  type="text"
                  placeholder="Where to buy it"
                  value={newGift.store}
                  onChange={(e) => setNewGift(prev => ({ ...prev, store: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL/Link
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={newGift.url}
                onChange={(e) => setNewGift(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description/Notes
              </label>
              <textarea
                value={newGift.description}
                onChange={(e) => setNewGift(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Any additional details..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {formType === 'idea' ? '💡 Add Idea' : '🛒 Add Purchase'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Gift Form */}
      {showEditForm && editingItem && (
        <div className="mb-6 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingItem.type === 'idea' ? '💡 Edit Gift Idea' : '🛒 Edit Purchase'}
            </h3>
            <button
              onClick={() => {
                setShowEditForm(false)
                setEditingItem(null)
                setNewGift({
                  name: '', description: '', estimatedPrice: 0, actualPrice: 0, url: '',
                  priority: 'medium', category: '', store: '', notes: '', status: 'idea'
                })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleUpdateGift} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gift Name *
              </label>
              <input
                type="text"
                placeholder="What's the gift?"
                value={newGift.name}
                onChange={(e) => setNewGift(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingItem.type === 'idea' ? 'Estimated Price' : 'Actual Price'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingItem.type === 'idea' ? newGift.estimatedPrice || '' : newGift.actualPrice || ''}
                  onChange={(e) => setNewGift(prev => ({ 
                    ...prev, 
                    [editingItem.type === 'idea' ? 'estimatedPrice' : 'actualPrice']: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newGift.priority}
                  onChange={(e) => setNewGift(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="must_have">Must Have</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Electronics, Clothing"
                  value={newGift.category}
                  onChange={(e) => setNewGift(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store
                </label>
                <input
                  type="text"
                  placeholder="Where to buy it"
                  value={newGift.store}
                  onChange={(e) => setNewGift(prev => ({ ...prev, store: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL/Link
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={newGift.url}
                onChange={(e) => setNewGift(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description/Notes
              </label>
              <textarea
                value={newGift.description}
                onChange={(e) => setNewGift(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Any additional details..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                💾 Update {editingItem.type === 'idea' ? 'Idea' : 'Purchase'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingItem(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gift Items List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span className="text-gray-600">Loading gifts...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎁</div>
          <p className="text-lg font-medium mb-2">No {filter === 'all' ? 'gifts' : filter} yet</p>
          <p className="text-sm mb-4">Start tracking gift ideas and purchases!</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                setFormType('idea')
                setShowAddForm(true)
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              💡 Add Idea
            </button>
            <button
              onClick={() => {
                setFormType('purchase')
                setShowAddForm(true)
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🛒 Add Purchase
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-lg border bg-white/70 hover:bg-white/90 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-white">{item.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)} {item.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)}`}>
                      {item.priority.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {item.type === 'idea' && item.estimatedPrice > 0 && (
                      <span>Est: {formatCurrency(item.estimatedPrice)}</span>
                    )}
                    {item.type === 'purchase' && item.actualPrice > 0 && (
                      <span className="font-medium text-green-600">Paid: {formatCurrency(item.actualPrice)}</span>
                    )}
                    {item.category && <span>📁 {item.category}</span>}
                    {item.store && <span>🏪 {item.store}</span>}
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Link
                      </a>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {item.type === 'idea' && (
                    <button
                      onClick={() => handleMoveToPurchase(item._id || item.id)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                    >
                      Move to Purchase
                    </button>
                  )}
                  
                  {item.type === 'purchase' && (
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item._id || item.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="to_buy">To Buy</option>
                      <option value="ordered">Ordered</option>
                      <option value="to_wrap">To Wrap</option>
                      <option value="wrapped">Wrapped</option>
                      <option value="given">Given</option>
                    </select>
                  )}
                  
                  <button
                    onClick={() => handleEditGift(item)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                    title="Edit gift"
                  >
                    ✏️ Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteGift(item._id || item.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    title="Delete gift"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default GiftTracker