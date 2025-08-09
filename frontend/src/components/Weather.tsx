'use client'

import React from 'react'

const Weather: React.FC = () => {
  // In a real app, this would fetch weather data from an API
  const weatherData = {
    location: 'New York, NY',
    temperature: 54,
    feelsLike: 52,
    condition: 'sunny',
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

  return (
    <div className="bg-blue-500 text-white p-6 rounded-3xl animate-fade-in">
      <p className="text-sm">{weatherData.location}</p>
      <div className="flex items-center mt-2">
        <span className={`material-icons text-yellow-300 text-5xl`}>
          {getWeatherIcon(weatherData.condition)}
        </span>
        <div className="ml-4">
          <p className="text-6xl font-bold">
            {weatherData.temperature}
            <span className="text-4xl align-top">°F</span>
          </p>
          <p className="text-sm">Feels {weatherData.feelsLike}</p>
        </div>
      </div>
      <p className="text-xs mt-4 flex items-center">
        Updated at {weatherData.lastUpdated}
        <span className="material-icons text-xs ml-1">refresh</span>
      </p>
    </div>
  )
}

export default Weather