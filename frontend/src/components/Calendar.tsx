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
    <div className="bg-white p-6 rounded-3xl animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">{currentMonth}</h2>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 text-center text-gray-500 text-sm mb-2">
        {daysOfWeek.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 text-sm">
        {/* Previous month end */}
        <div className="text-gray-400">27</div>
        
        {/* Current month days */}
        {Array.from({ length: 31 }, (_, i) => renderCalendarDay(i + 1))}
        
        {/* Multi-day events */}
        <div className="col-span-3 bg-blue-100 rounded-l-full py-1 text-blue-800 text-xs pl-2">
          Vacation
        </div>
        <div className="col-span-1 bg-pink-100 rounded-r-full py-1 text-pink-800 text-xs pr-2">
          Party
        </div>
        
        {/* Next month start */}
        <div className="text-gray-400">29</div>
        <div className="text-gray-400">30</div>
        <div className="text-gray-400">31</div>
      </div>
    </div>
  )
}

export default Calendar