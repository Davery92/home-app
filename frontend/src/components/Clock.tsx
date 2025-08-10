'use client'

import React, { useState, useEffect } from 'react'
import Card from './ui/Card'

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="material-icons opacity-80">schedule</span>
        <span className="text-sm opacity-80 font-medium">Live</span>
      </div>
      
      <div className="text-center">
        <p className="text-4xl md:text-5xl font-bold mb-1 tracking-tight">
          {formatTime(time)}
        </p>
        <p className="text-lg opacity-90 font-medium">{formatDay(time)}</p>
        <p className="text-sm opacity-75">{formatDate(time)}</p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
    </Card>
  )
}

export default Clock