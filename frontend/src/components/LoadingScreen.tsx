'use client'

import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 w-fit mx-auto mb-8 animate-pulse">
          <span className="material-icons text-white text-6xl">home</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Home App</h2>
        
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <p className="text-gray-600">Setting up your family dashboard...</p>
      </div>
    </div>
  )
}

export default LoadingScreen