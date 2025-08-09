'use client'

import React, { useState, useEffect } from 'react'

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
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <div className="bg-blue-400 text-white p-6 rounded-3xl flex flex-col justify-center animate-fade-in">
      <p className="text-lg">Home</p>
      <p className="text-6xl font-bold">{formatTime(time)}</p>
      <p className="text-lg">{formatDay(time)}</p>
    </div>
  )
}

export default Clock