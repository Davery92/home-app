'use client'

import React from 'react'
import Clock from './Clock'
import Weather from './Weather'
import QuickActions from './QuickActions'
import Calendar from './Calendar'
import ChoreBoard from './ChoreBoard'
import MealsToday from './MealsToday'
import GroceryList from './GroceryList'

const Dashboard: React.FC = () => {
  return (
    <div className="main-container max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          {/* Top Row - Clock, Weather, Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Clock />
            <Weather />
            <QuickActions />
          </div>

          {/* Calendar */}
          <Calendar />
        </div>

        {/* Right Column - Chore Board */}
        <div className="flex flex-col gap-6">
          <ChoreBoard />
        </div>
      </div>

      {/* Bottom Row - Meals and Grocery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <MealsToday />
        <div className="lg:col-span-2">
          <GroceryList />
        </div>
      </div>
    </div>
  )
}

export default Dashboard