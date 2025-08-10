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
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { useChores } from '@/hooks/useChores'

const Dashboard: React.FC = () => {
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [isFamilySettingsOpen, setIsFamilySettingsOpen] = useState(false)
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
      
      <div className="max-w-full mx-auto p-4 md:p-6 lg:p-8">
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
        
        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full p-4 shadow-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-110 transition-all duration-200 z-40"
        >
          <div className="text-2xl">🤖</div>
        </button>
      </div>
      
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