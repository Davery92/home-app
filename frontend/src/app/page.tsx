'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/components/Dashboard'
import AuthModal from '@/components/auth/AuthModal'
import FamilySetupModal from '@/components/auth/FamilySetupModal'
import LoadingScreen from '@/components/LoadingScreen'

export default function HomePage() {
  const { user, family, token, isLoading, login, setFamily } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFamilyModal, setShowFamilyModal] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setShowAuthModal(true)
      } else if (!family && !user.familyId) {
        // Only show family modal if user has no familyId at all
        setShowFamilyModal(true)
      } else if (!family && user.familyId) {
        // User has familyId but no family data - fetch it from server
        fetchUserFamily()
      }
    }
  }, [user, family, isLoading])

  const fetchUserFamily = async () => {
    if (!token) return
    
    try {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.family) {
          setFamily(data.family)
        }
      }
    } catch (error) {
      console.error('Error fetching family data:', error)
    }
  }

  const handleAuthSuccess = (userData: any, authToken: string, familyData?: any) => {
    login(userData, authToken, familyData)
    if (!userData.familyId && !familyData) {
      setShowFamilyModal(true)
    }
  }

  const handleFamilySuccess = (familyData: any) => {
    setFamily(familyData)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  // Show dashboard if user is authenticated and has family
  if (user && family) {
    return <Dashboard />
  }

  // Show welcome screen while modals handle authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 w-fit mx-auto mb-8">
          <div className="text-white text-6xl">🏠</div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Welcome to Home App
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Your family's digital headquarters for organizing life together.
        </p>
        <div className="animate-pulse">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <FamilySetupModal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        onSuccess={handleFamilySuccess}
        userToken={token || ''}
      />
    </div>
  )
}