'use client'

import React, { useState } from 'react'
import Card from './ui/Card'

const Weather: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // In a real app, this would fetch weather data from an API
  const weatherData = {
    location: 'New York, NY',
    temperature: 54,
    feelsLike: 52,
    condition: 'sunny',
    humidity: 65,
    windSpeed: 12,
    lastUpdated: '8:57 AM'
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return 'wb_sunny'
      case 'cloudy':
        return 'cloud'
      case 'rainy':
        return 'umbrella'
      case 'snowy':
        return 'ac_unit'
      default:
        return 'wb_sunny'
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Card className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm opacity-90">{weatherData.location}</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
        >
          <span className={`material-icons text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl md:text-4xl font-bold mb-1">
            {weatherData.temperature}°
          </p>
          <p className="text-sm opacity-80">Feels like {weatherData.feelsLike}°</p>
        </div>
        
        <div className="text-right">
          <span className="material-icons text-4xl text-yellow-200 drop-shadow-sm">
            {getWeatherIcon(weatherData.condition)}
          </span>
          <p className="text-xs opacity-75 mt-1 capitalize">{weatherData.condition}</p>
        </div>
      </div>

      {/* Additional weather info */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
        <div className="text-xs opacity-80">
          <div className="flex items-center space-x-1">
            <span className="material-icons text-xs">water_drop</span>
            <span>{weatherData.humidity}%</span>
          </div>
        </div>
        <div className="text-xs opacity-80">
          <div className="flex items-center space-x-1">
            <span className="material-icons text-xs">air</span>
            <span>{weatherData.windSpeed} mph</span>
          </div>
        </div>
        <div className="text-xs opacity-75">
          {weatherData.lastUpdated}
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
    </Card>
  )
}

export default Weather