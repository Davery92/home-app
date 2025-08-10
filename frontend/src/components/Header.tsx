'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onOpenMembers?: () => void
  onOpenFamilySettings?: () => void
}

const Header: React.FC<HeaderProps> = ({ onOpenMembers, onOpenFamilySettings }) => {
  const { user, family, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U'
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2">
              <span className="text-white text-2xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {family?.name || 'Family Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.profile?.firstName}!
              </p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <span className="text-green-500 text-lg">✅</span>
                <span>8 tasks today</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Members Button */}
              {onOpenMembers && (
                <button 
                  onClick={onOpenMembers}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  title="Manage Family Members"
                >
                  <span className="text-sm">👥</span>
                  <span className="hidden sm:inline text-sm font-medium">Members</span>
                </button>
              )}
              
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200" title="Notifications">
                <span className="text-gray-600 text-lg">🔔</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200" title="Settings">
                <span className="text-gray-600 text-lg">⚙️</span>
              </button>
            </div>

            {/* Profile Menu */}
            <div className="flex items-center space-x-3">
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow duration-200"
                >
                  <span className="text-white text-sm font-medium">
                    {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {family && (
                        <p className="text-xs text-blue-600 mt-1">
                          {family.name} • {family.role}
                        </p>
                      )}
                    </div>
                    
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <span className="text-gray-400 text-lg">👤</span>
                      <span>My Profile</span>
                    </button>
                    
                    {family && onOpenFamilySettings && (
                      <button 
                        onClick={() => {
                          onOpenFamilySettings()
                          setShowProfileMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <span className="text-gray-400 text-lg">👥</span>
                        <span>Family Settings</span>
                      </button>
                    )}
                    
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <span className="text-gray-400 text-lg">⚙️</span>
                      <span>Preferences</span>
                    </button>
                    
                    <hr className="my-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <span className="text-red-500 text-lg">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  )
}

export default Header