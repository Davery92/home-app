'use client'

import React, { useState, useMemo } from 'react'
import Card from './ui/Card'
import { useCalendar, CalendarEvent } from '@/hooks/useCalendar'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
  event?: CalendarEvent
  onSave: (eventData: any) => Promise<void>
}

const AddEventModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  event, 
  onSave 
}) => {
  const { members } = useFamilyMembers()
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate?.split('T')[0] || selectedDate?.toISOString().split('T')[0] || '',
    startTime: event?.startDate ? new Date(event.startDate).toTimeString().substring(0, 5) : '09:00',
    endDate: event?.endDate?.split('T')[0] || selectedDate?.toISOString().split('T')[0] || '',
    endTime: event?.endDate ? new Date(event.endDate).toTimeString().substring(0, 5) : '10:00',
    allDay: event?.allDay || false,
    location: event?.location || '',
    category: event?.category || 'family',
    priority: event?.priority || 'medium',
    color: event?.color || 'blue',
    assignedTo: event?.assignedTo || []
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = formData.allDay 
        ? `${formData.startDate}T00:00:00.000Z`
        : `${formData.startDate}T${formData.startTime}:00.000Z`
      
      const endDateTime = formData.allDay 
        ? `${formData.endDate}T23:59:59.999Z`
        : `${formData.endDate}T${formData.endTime}:00.000Z`

      await onSave({
        ...formData,
        startDate: startDateTime,
        endDate: endDateTime
      })
      onClose()
    } catch (err) {
      console.error('Error saving event:', err)
      alert('Failed to save event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = [
    { value: 'family', label: 'Family', color: 'blue' },
    { value: 'personal', label: 'Personal', color: 'green' },
    { value: 'work', label: 'Work', color: 'purple' },
    { value: 'health', label: 'Health', color: 'red' },
    { value: 'school', label: 'School', color: 'yellow' },
    { value: 'social', label: 'Social', color: 'pink' },
    { value: 'holiday', label: 'Holiday', color: 'orange' },
    { value: 'birthday', label: 'Birthday', color: 'teal' },
    { value: 'other', label: 'Other', color: 'gray' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {event ? 'Edit Event' : 'Add New Event'}
            </h2>
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
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter event description..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                All Day Event
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!formData.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
                disabled={loading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

const Calendar: React.FC = () => {
  const { events, loading, error, addEvent, updateEvent, deleteEvent, getEventsForDate } = useCalendar()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days = []
    
    // Previous month's trailing days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i)
      })
    }

    // Current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({
        date,
        isCurrentMonth: true,
        fullDate: new Date(currentYear, currentMonth, date)
      })
    }

    // Next month's leading days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        fullDate: new Date(currentYear, currentMonth + 1, date)
      })
    }

    return days
  }, [currentYear, currentMonth])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowAddModal(true)
  }

  const handleAddEvent = async (eventData: any) => {
    await addEvent(eventData)
  }

  const handleEditEvent = async (eventData: any) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData)
      setEditingEvent(null)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      family: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
      personal: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
      work: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
      health: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
      school: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200',
      social: 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200',
      holiday: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
      birthday: 'bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200',
      other: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  if (error) {
    return (
      <Card className="p-6" gradient={true}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Failed to Load Calendar</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 flex flex-col h-full" gradient={true}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Family Calendar</h3>
              <p className="text-sm text-gray-500">
                {monthNames[currentMonth]} {currentYear}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-600">←</span>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-600">→</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-h-0">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day.fullDate)
              
              return (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && handleDateClick(day.fullDate)}
                  className={`
                    min-h-[80px] p-1 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800' : ''}
                    ${isToday(day.fullDate) ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600' : ''}
                  `}
                >
                  <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {day.date}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingEvent(event)
                        }}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80
                          ${getCategoryColor(event.category)}
                        `}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </Card>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedDate(null)
        }}
        selectedDate={selectedDate || undefined}
        onSave={handleAddEvent}
      />

      {/* Edit Event Modal */}
      <AddEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent || undefined}
        onSave={handleEditEvent}
      />
    </>
  )
}

export default Calendar