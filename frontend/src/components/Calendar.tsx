'use client'

import React from 'react'

interface CalendarEvent {
  date: number
  events: Array<{
    title: string
    color: string
    textColor: string
  }>
}

const Calendar: React.FC = () => {
  // Sample calendar data - in real app, this would come from API
  const currentMonth = 'May'
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  const calendarEvents: CalendarEvent[] = [
    { date: 28, events: [{ title: 'Reading', color: 'bg-green-200', textColor: 'text-green-800' }] },
    { 
      date: 29, 
      events: [
        { title: 'Swim Lesson', color: 'bg-purple-200', textColor: 'text-purple-800' },
        { title: 'Yoga', color: 'bg-blue-200', textColor: 'text-blue-800' }
      ] 
    },
    { 
      date: 30, 
      events: [
        { title: 'Movie Night', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
        { title: 'Reading', color: 'bg-green-200', textColor: 'text-green-800' }
      ] 
    },
    // ... more events would be here
  ]

  const renderCalendarDay = (day: number, isCurrentMonth = true) => {
    const dayEvents = calendarEvents.find(e => e.date === day)
    
    return (
      <div key={day} className={`relative ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
        <div className={`font-bold ${dayEvents ? 'mb-1' : ''}`}>{day}</div>
        {dayEvents?.events.map((event, index) => (
          <div
            key={index}
            className={`${event.color} ${event.textColor} text-xs rounded-full px-2 py-0.5 mb-1 truncate`}
          >
            {event.title}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{currentMonth}</h2>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-gray-500 text-sm mb-4 font-medium">
          {daysOfWeek.map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        
        {/* Calendar grid - now fills remaining space */}
        <div className="grid grid-cols-7 gap-2 text-sm flex-1 auto-rows-fr">
          {/* Previous month end */}
          <div className="text-gray-400 p-2 flex flex-col">
            <div className="font-semibold">27</div>
          </div>
          
          {/* Current month days */}
          {Array.from({ length: 31 }, (_, i) => (
            <div key={i + 1} className="p-2 flex flex-col border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]">
              {renderCalendarDay(i + 1)}
            </div>
          ))}
          
          {/* Next month start */}
          <div className="text-gray-400 p-2 flex flex-col">
            <div className="font-semibold">1</div>
          </div>
          <div className="text-gray-400 p-2 flex flex-col">
            <div className="font-semibold">2</div>
          </div>
          <div className="text-gray-400 p-2 flex flex-col">
            <div className="font-semibold">3</div>
          </div>
        </div>
        
        {/* Upcoming Events Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Upcoming This Week</h3>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-600">Tomorrow: Swim Lesson</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-600">Thursday: Movie Night</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar