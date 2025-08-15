'use client'

import React, { useState, useRef } from 'react'
import Clock from './Clock'
import Weather from './Weather'
import QuickActions from './QuickActions'
import Calendar from './Calendar'
import ChoreBoard from './ChoreBoard'
import MealsToday from './MealsToday'
import GroceryList from './GroceryList'
import Header from './Header'
import AIAssistant from './AIAssistant'
import FamilySettingsModal from './FamilySettingsModal'
import PersonalTodos from './PersonalTodos'
import CleaningSchedule from './CleaningSchedule'
import PersonalReminders from './PersonalReminders'
import PetCare from './PetCare'
import GiftTracker from './GiftTracker'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { useChores } from '@/hooks/useChores'

const Dashboard: React.FC = () => {
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isFamilySettingsOpen, setIsFamilySettingsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'calendar' | 'mealplan' | 'todos' | 'cleaning' | 'reminders' | 'pets' | 'gifts' | 'habits' | 'shopping'>('home')
  const { user, token, family } = useAuth()
  
  // States for quick access
  const [showGroceryModal, setShowGroceryModal] = useState(false)
  const [showMealPlanningModal, setShowMealPlanningModal] = useState(false)
  
  // Use hooks for family members and chores management
  const {
    members: familyMembers,
    loading: membersLoading,
    error: membersError,
    addMember,
    updateMember,
    deleteMember,
    clearMemberPoints,
    clearAllFamilyPoints,
  } = useFamilyMembers()

  const {
    chores,
    loading: choresLoading,
    error: choresError,
    completedToday,
    totalChores,
    completionRate,
  } = useChores()

  // Quick access handlers
  const handleGroceryQuickAccess = () => {
    setCurrentView('home') // Navigate to home first
    setShowGroceryModal(true) // Open the grocery add modal
  }

  const handleMealPlanningQuickAccess = () => {
    setCurrentView('home') // Navigate to home first
    setShowMealPlanningModal(true) // Open the meal planning modal
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Header 
        onOpenFamilySettings={() => setIsFamilySettingsOpen(true)}
      />

      {/* Navigation Tabs */}
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8 pt-4">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-white/20 dark:border-gray-700/30 mb-4">
          {/* Top Row */}
          <div className="flex space-x-1 mb-1">
            {[
              { key: 'home', label: 'Home', icon: '🏠' },
              { key: 'calendar', label: 'Calendar', icon: '📅' },
              { key: 'mealplan', label: 'Meal Plan', icon: '🍽️' },
              { key: 'todos', label: 'To Do', icon: '📝' },
              { key: 'cleaning', label: 'Cleaning Schedule', icon: '🧹' },
              { key: 'reminders', label: 'Reminders', icon: '⏰' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg transition-all font-medium text-xs md:text-sm ${
                  currentView === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                <span className="text-sm md:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Bottom Row */}
          <div className="flex space-x-1">
            {[
              { key: 'pets', label: 'Pets', icon: '🐾' },
              { key: 'gifts', label: 'Gift Tracker', icon: '🎁' },
              { key: 'habits', label: 'Habit Tracker', icon: '✅' },
              { key: 'shopping', label: 'Shopping List', icon: '🛒' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg transition-all font-medium text-xs md:text-sm ${
                  currentView === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                <span className="text-sm md:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto p-4 md:p-6 lg:p-8">
        {/* Main Dashboard View */}
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Top Row: Time, Weather, Today's Overview, Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Clock />
              <Weather />
              {/* Today's Overview */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-4 shadow-lg border border-white/20 dark:border-gray-700/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Today's Overview</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300">📅 Events</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-white">3 today</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300">🍽️ Meals</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-white">2 planned</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300">🧹 Chores</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-white">{completedToday}/{totalChores}</span>
                  </div>
                </div>
              </div>
              {/* Quick Actions */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-4 shadow-lg border border-white/20 dark:border-gray-700/30">
                <QuickActions onOpenAI={() => setIsAIOpen(true)} />
              </div>
            </div>

            {/* Second Row: Family Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Family Stats */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Family Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-2xl p-4 text-white">
                    <div className="text-2xl font-bold">
                      {completedToday}
                    </div>
                    <div className="text-sm opacity-90">Tasks Done</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-4 text-white">
                    <div className="text-2xl font-bold">{familyMembers.length}</div>
                    <div className="text-sm opacity-90">Members</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {currentView === 'calendar' && (
          <div className="max-w-7xl mx-auto">
            <Calendar />
          </div>
        )}

        {/* Meal Plan View */}
        {currentView === 'mealplan' && (
          <div className="max-w-4xl mx-auto">
            <MealsToday 
              showAIModalProp={showMealPlanningModal}
              onCloseAIModal={() => setShowMealPlanningModal(false)}
            />
          </div>
        )}

        {/* Shopping List View */}
        {currentView === 'shopping' && (
          <div className="max-w-4xl mx-auto">
            <GroceryList 
              showAddModalProp={showGroceryModal}
              onCloseAddModal={() => setShowGroceryModal(false)}
            />
          </div>
        )}

        {/* Personal Todos View */}
        {currentView === 'todos' && (
          <div className="max-w-4xl mx-auto">
            <PersonalTodos />
          </div>
        )}

        {/* Cleaning Schedule View */}
        {currentView === 'cleaning' && (
          <div className="max-w-6xl mx-auto">
            <CleaningSchedule />
          </div>
        )}

        {/* Personal Reminders View */}
        {currentView === 'reminders' && (
          <div className="max-w-5xl mx-auto">
            <PersonalReminders />
          </div>
        )}

        {/* Pet Care View */}
        {currentView === 'pets' && (
          <div className="max-w-7xl mx-auto">
            <PetCare />
          </div>
        )}

        {/* Habit Tracker View */}
        {currentView === 'habits' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 dark:border-gray-700/30">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Habit Tracker</h2>
              <p className="text-gray-600 dark:text-gray-300">Habit tracking feature coming soon!</p>
            </div>
          </div>
        )}

        {/* Gift Tracker View */}
        {currentView === 'gifts' && (
          <div className="max-w-6xl mx-auto">
            <GiftTracker />
          </div>
        )}
      </div>
      
      {/* AI Assistant Button */}
      <button
        onClick={() => setIsAIOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full p-4 shadow-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-110 transition-all duration-200 z-40"
      >
        <div className="text-2xl">🤖</div>
      </button>
      
      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)}
        userToken={token || ''}
        familyId={user?.familyId}
      />
      
      
      {/* Family Settings Modal */}
      <FamilySettingsModal
        isOpen={isFamilySettingsOpen}
        onClose={() => setIsFamilySettingsOpen(false)}
      />
    </div>
  )
}

export default Dashboard