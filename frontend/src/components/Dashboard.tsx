'use client'

import React, { useState } from 'react'
import Clock from './Clock'
import Weather from './Weather'
import QuickActions from './QuickActions'
import Calendar from './Calendar'
import ChoreBoard from './ChoreBoard'
import MealsToday from './MealsToday'
import GroceryList from './GroceryList'
import Header from './Header'
import AIAssistant from './AIAssistant'
import FamilyMembersModal from './FamilyMembersModal'
import FamilySettingsModal from './FamilySettingsModal'
import PersonalTodos from './PersonalTodos'
import CleaningSchedule from './CleaningSchedule'
import PersonalReminders from './PersonalReminders'
import PetCare from './PetCare'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { useChores } from '@/hooks/useChores'

const Dashboard: React.FC = () => {
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [isFamilySettingsOpen, setIsFamilySettingsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'todos' | 'cleaning' | 'reminders' | 'petcare'>('home')
  const { user, token, family } = useAuth()
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        onOpenMembers={() => setIsMembersOpen(true)} 
        onOpenFamilySettings={() => setIsFamilySettingsOpen(true)}
      />

      {/* Navigation Tabs */}
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8 pt-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-white/20 mb-4">
          <div className="flex space-x-1">
            {[
              { key: 'home', label: '🏠 Home', icon: '🏠' },
              { key: 'todos', label: '📝 Personal To Dos', icon: '📝' },
              { key: 'cleaning', label: '🧹 Cleaning Schedule', icon: '🧹' },
              { key: 'reminders', label: '⏰ Reminders', icon: '⏰' },
              { key: 'petcare', label: '🐾 Pet Care', icon: '🐾' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all font-medium ${
                  currentView === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto p-4 md:p-6 lg:p-8">
        {/* Main Dashboard View */}
        {currentView === 'home' && (
          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            {/* Left Column - Main Content */}
            <div className="2xl:col-span-7 flex flex-col">
              {/* Top Row - Clock, Weather, Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Clock />
                <Weather />
                <QuickActions onOpenAI={() => setIsAIOpen(true)} />
              </div>

              {/* Calendar - Expanded to fill remaining vertical space */}
              <div className="flex-1 min-h-[600px]">
                <Calendar />
              </div>
            </div>

            {/* Right Column - Chore Board and additional sections */}
            <div className="2xl:col-span-5 space-y-6">
              {/* Chore Board */}
              <div>
                <ChoreBoard 
                  familyMembers={familyMembers}
                  chores={chores}
                  loading={choresLoading || membersLoading}
                  error={choresError || membersError}
                />
              </div>

              {/* Meals and Grocery Row - moved from left column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MealsToday />
                <GroceryList />
              </div>

              {/* Family Stats */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Stats</h3>
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
        {currentView === 'petcare' && (
          <div className="max-w-7xl mx-auto">
            <PetCare />
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
      
      {/* Family Members Modal */}
      <FamilyMembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        familyMembers={familyMembers}
        onUpdateMembers={(members) => {
          // The hook will handle the updates internally
          console.log('Members updated:', members);
        }}
        onAddMember={addMember}
        onUpdateMember={updateMember}
        onDeleteMember={deleteMember}
        onClearMemberPoints={clearMemberPoints}
        onClearAllPoints={clearAllFamilyPoints}
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