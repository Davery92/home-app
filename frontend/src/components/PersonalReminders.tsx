'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'
import Card from './ui/Card'

interface PersonalReminder {
  id: string
  title: string
  description?: string
  type: string
  priority: string
  dueDate: string
  reminderTime: string
  allDay: boolean
  completed: boolean
  completedAt?: string
  recurring: {
    enabled: boolean
    frequency?: string
    interval?: number
    endDate?: string
  }
  notifications: {
    enabled: boolean
    methods?: string[]
    advance?: Array<{
      value: number
      unit: string
    }>
  }
  location?: string
  contact?: {
    name?: string
    phone?: string
    email?: string
  }
  tags: string[]
  category?: string
  isOverdue?: boolean
  isUpcoming?: boolean
  isSnoozed?: boolean
  snoozedUntil?: string
  createdAt: string
  updatedAt: string
}

interface ReminderStats {
  total: number
  completed: number
  pending: number
  overdue: number
  upcoming: number
  high_priority: number
  urgent: number
}

const PersonalReminders: React.FC = () => {
  const { token } = useAuth()
  const [reminders, setReminders] = useState<PersonalReminder[]>([])
  const [stats, setStats] = useState<ReminderStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0,
    high_priority: 0,
    urgent: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'upcoming'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<PersonalReminder | null>(null)
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'personal',
    priority: 'medium',
    dueDate: '',
    reminderTime: '',
    allDay: false,
    recurringEnabled: false,
    recurringFrequency: 'weekly',
    recurringInterval: 1,
    recurringEndDate: '',
    notificationsEnabled: true,
    notificationMethods: ['push'] as string[],
    notificationAdvance: [] as Array<{ value: number; unit: string }>,
    location: '',
    tags: [] as string[],
    tagInput: '',
    category: ''
  })

  const reminderTypes = [
    { key: 'medication', label: '💊 Medication', icon: '💊' },
    { key: 'appointment', label: '📅 Appointment', icon: '📅' },
    { key: 'task', label: '✅ Task', icon: '✅' },
    { key: 'bill', label: '💳 Bill', icon: '💳' },
    { key: 'call', label: '📞 Call', icon: '📞' },
    { key: 'event', label: '🎉 Event', icon: '🎉' },
    { key: 'personal', label: '👤 Personal', icon: '👤' },
    { key: 'work', label: '💼 Work', icon: '💼' },
    { key: 'other', label: '📝 Other', icon: '📝' }
  ]

  const fetchReminders = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getPersonalReminders(token, {
        type: typeFilter !== 'all' ? typeFilter : undefined
      })
      
      if (response.success) {
        setReminders(response.reminders)
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching personal reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [token, typeFilter])

  const getFilteredReminders = () => {
    let filtered = reminders

    switch (filter) {
      case 'pending':
        filtered = reminders.filter(reminder => !reminder.completed)
        break
      case 'completed':
        filtered = reminders.filter(reminder => reminder.completed)
        break
      case 'overdue':
        filtered = reminders.filter(reminder => reminder.isOverdue && !reminder.completed)
        break
      case 'upcoming':
        filtered = reminders.filter(reminder => reminder.isUpcoming && !reminder.completed)
        break
      default:
        filtered = reminders
    }

    return filtered
  }

  const getTypeIcon = (type: string) => {
    const typeObj = reminderTypes.find(t => t.key === type)
    return typeObj?.icon || '📝'
  }

  const getTypeLabel = (type: string) => {
    const typeObj = reminderTypes.find(t => t.key === type)
    return typeObj?.label || type
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨'
      case 'high': return '⚡'
      case 'medium': return '📋'
      case 'low': return '💭'
      default: return '📋'
    }
  }

  const handleToggleReminder = async (reminderId: string) => {
    if (!token) return
    
    try {
      const response = await apiService.togglePersonalReminder(token, reminderId)
      
      if (response.success) {
        setReminders(prev => prev.map(reminder => 
          reminder.id === reminderId ? { 
            ...reminder, 
            completed: !reminder.completed,
            completedAt: response.reminder.completedAt
          } : reminder
        ))
        fetchReminders() // Refresh stats
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const handleSnoozeReminder = async (reminderId: string, minutes: number = 15) => {
    if (!token) return
    
    try {
      const response = await apiService.snoozePersonalReminder(token, reminderId, minutes)
      
      if (response.success) {
        setReminders(prev => prev.map(reminder => 
          reminder.id === reminderId ? { 
            ...reminder, 
            isSnoozed: true,
            snoozedUntil: response.reminder.snoozedUntil
          } : reminder
        ))
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newReminder.title.trim()) return
    
    try {
      // Set reminder time to due date if all day
      const reminderTime = newReminder.allDay 
        ? newReminder.dueDate 
        : newReminder.reminderTime || newReminder.dueDate

      const reminderData = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim(),
        type: newReminder.type,
        priority: newReminder.priority,
        dueDate: newReminder.dueDate,
        reminderTime,
        allDay: newReminder.allDay,
        recurring: {
          enabled: newReminder.recurringEnabled,
          frequency: newReminder.recurringFrequency,
          interval: newReminder.recurringInterval,
          endDate: newReminder.recurringEndDate || undefined
        },
        notifications: {
          enabled: newReminder.notificationsEnabled,
          methods: newReminder.notificationMethods,
          advance: newReminder.notificationAdvance
        },
        location: newReminder.location.trim(),
        tags: newReminder.tags,
        category: newReminder.category.trim()
      }

      const response = await apiService.createPersonalReminder(token, reminderData)
      
      if (response.success) {
        setReminders(prev => [response.reminder, ...prev])
        setNewReminder({
          title: '',
          description: '',
          type: 'personal',
          priority: 'medium',
          dueDate: '',
          reminderTime: '',
          allDay: false,
          recurringEnabled: false,
          recurringFrequency: 'weekly',
          recurringInterval: 1,
          recurringEndDate: '',
          notificationsEnabled: true,
          notificationMethods: ['push'],
          notificationAdvance: [],
          location: '',
          tags: [],
          tagInput: '',
          category: ''
        })
        setShowAddForm(false)
        fetchReminders() // Refresh stats
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!token || !confirm('Are you sure you want to delete this reminder?')) return
    
    try {
      const response = await apiService.deletePersonalReminder(token, reminderId)
      
      if (response.success) {
        setReminders(prev => prev.filter(reminder => reminder.id !== reminderId))
        fetchReminders() // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const handleEditReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingReminder || !newReminder.title.trim()) return
    
    try {
      const updates = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim(),
        type: newReminder.type,
        priority: newReminder.priority,
        dueDate: newReminder.dueDate,
        reminderTime: newReminder.allDay ? newReminder.dueDate : newReminder.reminderTime || newReminder.dueDate,
        allDay: newReminder.allDay,
        location: newReminder.location.trim(),
        tags: newReminder.tags,
        category: newReminder.category.trim()
      }

      const response = await apiService.updatePersonalReminder(token, editingReminder.id, updates)
      
      if (response.success) {
        setReminders(prev => prev.map(reminder => 
          reminder.id === editingReminder.id ? response.reminder : reminder
        ))
        setNewReminder({
          title: '',
          description: '',
          type: 'personal',
          priority: 'medium',
          dueDate: '',
          reminderTime: '',
          allDay: false,
          recurringEnabled: false,
          recurringFrequency: 'weekly',
          recurringInterval: 1,
          recurringEndDate: '',
          notificationsEnabled: true,
          notificationMethods: ['push'],
          notificationAdvance: [],
          location: '',
          tags: [],
          tagInput: '',
          category: ''
        })
        setEditingReminder(null)
        fetchReminders()
      }
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  const handleClearCompleted = async () => {
    if (!token || !confirm('Delete all completed reminders?')) return
    
    try {
      const response = await apiService.clearCompletedPersonalReminders(token)
      
      if (response.success) {
        setReminders(prev => prev.filter(reminder => !reminder.completed))
        fetchReminders() // Refresh stats
      }
    } catch (error) {
      console.error('Error clearing completed reminders:', error)
    }
  }

  const addTag = () => {
    if (newReminder.tagInput.trim() && !newReminder.tags.includes(newReminder.tagInput.trim())) {
      setNewReminder(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewReminder(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addNotificationAdvance = (value: number, unit: string) => {
    if (value > 0) {
      setNewReminder(prev => ({
        ...prev,
        notificationAdvance: [...prev.notificationAdvance, { value, unit }]
      }))
    }
  }

  const removeNotificationAdvance = (index: number) => {
    setNewReminder(prev => ({
      ...prev,
      notificationAdvance: prev.notificationAdvance.filter((_, i) => i !== index)
    }))
  }

  const formatDateTime = (dateString: string, allDay: boolean = false) => {
    const date = new Date(dateString)
    if (allDay) {
      return date.toLocaleDateString()
    }
    return date.toLocaleString()
  }

  const getTimeUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = due.getTime() - now.getTime()
    
    if (diff < 0) return 'Overdue'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading reminders...</span>
        </div>
      </Card>
    )
  }

  const filteredReminders = getFilteredReminders()

  return (
    <Card className="p-6 bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">⏰</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Personal Reminders</h3>
            <p className="text-gray-500">
              {stats.pending} pending • {stats.completed} completed
              {stats.overdue > 0 && <span className="text-red-600"> • {stats.overdue} overdue</span>}
              {stats.upcoming > 0 && <span className="text-orange-600"> • {stats.upcoming} upcoming</span>}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Done</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.high_priority}</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className="text-sm text-gray-600">Urgent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: '📋 All', count: stats.total },
            { key: 'pending', label: '⏳ Pending', count: stats.pending },
            { key: 'upcoming', label: '🔔 Upcoming', count: stats.upcoming },
            { key: 'overdue', label: '🚨 Overdue', count: stats.overdue },
            { key: 'completed', label: '✅ Completed', count: stats.completed }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === filterOption.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            {reminderTypes.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Completed Button */}
      {stats.completed > 0 && (
        <div className="mb-4">
          <button
            onClick={handleClearCompleted}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            🗑️ Clear {stats.completed} Completed
          </button>
        </div>
      )}

      {/* Add/Edit Reminder Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingReminder(null)
                setNewReminder({
                  title: '',
                  description: '',
                  type: 'personal',
                  priority: 'medium',
                  dueDate: '',
                  reminderTime: '',
                  allDay: false,
                  recurringEnabled: false,
                  recurringFrequency: 'weekly',
                  recurringInterval: 1,
                  recurringEndDate: '',
                  notificationsEnabled: true,
                  notificationMethods: ['push'],
                  notificationAdvance: [],
                  location: '',
                  tags: [],
                  tagInput: '',
                  category: ''
                })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={editingReminder ? handleEditReminder : handleAddReminder} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Reminder title..."
                value={newReminder.title}
                onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {reminderTypes.map(type => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={newReminder.priority}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">💭 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">⚡ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newReminder.dueDate}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newReminder.allDay}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, allDay: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">All Day</span>
                </label>
              </div>
            </div>

            {!newReminder.allDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Time</label>
                <input
                  type="datetime-local"
                  value={newReminder.reminderTime}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div>
              <textarea
                placeholder="Description (optional)..."
                value={newReminder.description}
                onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={newReminder.location}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={newReminder.category}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>


            {/* Recurring Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newReminder.recurringEnabled}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, recurringEnabled: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Recurring</span>
              </label>

              {newReminder.recurringEnabled && (
                <>
                  <select
                    value={newReminder.recurringFrequency}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  
                  <input
                    type="number"
                    placeholder="Every"
                    value={newReminder.recurringInterval}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, recurringInterval: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    min="1"
                  />
                </>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newReminder.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newReminder.tagInput}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm hover:bg-purple-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                {editingReminder ? 'Update Reminder' : 'Create Reminder'}
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

      {/* Reminder List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⏰</div>
            <p>No reminders found for the selected filter.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-purple-500 hover:text-purple-600"
              >
                View all reminders
              </button>
            )}
          </div>
        ) : (
          filteredReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border transition-all ${
                reminder.completed 
                  ? 'bg-green-50 border-green-200' 
                  : reminder.isOverdue
                  ? 'bg-red-50 border-red-200'
                  : reminder.isUpcoming
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white/70 border-gray-200 hover:bg-white/90'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={reminder.completed}
                  onChange={() => handleToggleReminder(reminder.id)}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium flex items-center space-x-2 ${
                      reminder.completed ? 'text-green-700 line-through' : 'text-gray-800'
                    }`}>
                      <span>{getTypeIcon(reminder.type)}</span>
                      <span>{reminder.title}</span>
                      {reminder.recurring.enabled && <span className="text-xs">🔄</span>}
                      {reminder.isSnoozed && <span className="text-xs">😴</span>}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(reminder.priority)}`}>
                        {getPriorityIcon(reminder.priority)} {reminder.priority}
                      </span>
                      
                      {!reminder.completed && !reminder.isSnoozed && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleSnoozeReminder(reminder.id, 15)}
                            className="text-orange-400 hover:text-orange-600 text-xs px-1"
                            title="Snooze 15min"
                          >
                            😴
                          </button>
                          <button
                            onClick={() => handleSnoozeReminder(reminder.id, 60)}
                            className="text-orange-400 hover:text-orange-600 text-xs px-1"
                            title="Snooze 1hr"
                          >
                            🕐
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setEditingReminder(reminder)
                          setNewReminder({
                            title: reminder.title,
                            description: reminder.description || '',
                            type: reminder.type,
                            priority: reminder.priority,
                            dueDate: reminder.dueDate.split('T')[0],
                            reminderTime: reminder.reminderTime || '',
                            allDay: reminder.allDay,
                            recurringEnabled: reminder.recurring.enabled,
                            recurringFrequency: reminder.recurring.frequency || 'weekly',
                            recurringInterval: reminder.recurring.interval || 1,
                            recurringEndDate: reminder.recurring.endDate ? reminder.recurring.endDate.split('T')[0] : '',
                            notificationsEnabled: reminder.notifications.enabled,
                            notificationMethods: reminder.notifications.methods || ['push'],
                            notificationAdvance: reminder.notifications.advance || [],
                            location: reminder.location || '',
                            tags: reminder.tags,
                            tagInput: '',
                            category: reminder.category || ''
                          })
                          setShowAddForm(true)
                        }}
                        className="text-blue-400 hover:text-blue-600 text-sm"
                        title="Edit reminder"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {reminder.description && (
                    <p className={`text-sm mt-1 ${
                      reminder.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {reminder.description}
                    </p>
                  )}

                  <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span>📅 {formatDateTime(reminder.dueDate, reminder.allDay)}</span>
                    
                    {!reminder.completed && (
                      <span className={
                        reminder.isOverdue 
                          ? 'text-red-600 font-medium'
                          : reminder.isUpcoming
                          ? 'text-orange-600 font-medium'
                          : ''
                      }>
                        ⏱️ {getTimeUntilDue(reminder.dueDate)}
                      </span>
                    )}
                    
                    {reminder.location && (
                      <span>📍 {reminder.location}</span>
                    )}
                    
                    {reminder.contact?.name && (
                      <span>👤 {reminder.contact.name}</span>
                    )}
                    
                    {reminder.category && (
                      <span>📁 {reminder.category}</span>
                    )}
                    
                    {reminder.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {reminder.tags.map(tag => (
                          <span key={tag} className="px-1 py-0.5 bg-purple-100 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {reminder.completedAt && (
                      <span className="text-green-600">
                        ✅ {new Date(reminder.completedAt).toLocaleDateString()}
                      </span>
                    )}

                    {reminder.isSnoozed && reminder.snoozedUntil && (
                      <span className="text-orange-600">
                        😴 Until {new Date(reminder.snoozedUntil).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {reminder.contact && (reminder.contact.phone || reminder.contact.email) && (
                    <div className="mt-2 text-xs text-gray-500">
                      {reminder.contact.phone && (
                        <span className="mr-3">📞 {reminder.contact.phone}</span>
                      )}
                      {reminder.contact.email && (
                        <span>✉️ {reminder.contact.email}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default PersonalReminders