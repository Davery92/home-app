'use client'

import React, { useState } from 'react'
import Card from '../ui/Card'

interface FamilySetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (family: any) => void
  userToken: string
}

const FamilySetupModal: React.FC<FamilySetupModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userToken 
}) => {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inviteCode: ''
  })

  if (!isOpen) return null

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use the same host as the frontend for API requests
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/families/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create family')
      }

      onSuccess(data.family)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use the same host as the frontend for API requests
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/families/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          inviteCode: formData.inviteCode.toUpperCase()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join family')
      }

      onSuccess(data.family)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const renderChooseMode = () => (
    <div className="text-center">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 w-fit mx-auto mb-6 shadow-lg">
        <div className="text-white text-4xl">🏠</div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Welcome to Your Family Hub</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
        Get started by creating your family dashboard or joining an existing one.
      </p>

      <div className="space-y-4">
        <button
          onClick={() => setMode('create')}
          className="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-6 px-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <div className="text-2xl">👨‍👩‍👧‍👦</div>
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Create New Family</div>
              <div className="text-blue-100 text-sm">Start your family dashboard</div>
            </div>
          </div>
          <div className="text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 text-2xl">
            →
          </div>
        </button>
        
        <button
          onClick={() => setMode('join')}
          className="group w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-6 px-6 rounded-2xl font-semibold hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-xl">
              <div className="text-indigo-600 dark:text-indigo-400 text-2xl">👥</div>
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-gray-800 dark:text-white">Join Existing Family</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Use an invite code to join</div>
            </div>
          </div>
          <div className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 text-2xl">
            →
          </div>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Your family data is private and secure. Only invited members can access your dashboard.
        </p>
      </div>
    </div>
  )

  const renderCreateMode = () => (
    <div>
      <button
        onClick={() => setMode('choose')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200 group"
      >
        <div className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</div>
        <span className="font-medium">Back to options</span>
      </button>

      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 w-fit mx-auto mb-6 shadow-lg">
          <div className="text-white text-3xl">👨‍👩‍👧‍👦</div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Create Your Family</h2>
        <p className="text-gray-600 text-lg">Set up your family's digital headquarters</p>
      </div>

      <form onSubmit={handleCreateFamily} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Family Name *
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
              🏠
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg"
              placeholder="The Smith Family"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Description <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Tell us a bit about your family (optional)..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="text-red-500 text-xl mt-0.5">⚠️</div>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating your family...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <div className="text-xl">👨‍👩‍👧‍👦</div>
              <span>Create Family</span>
            </div>
          )}
        </button>
      </form>
    </div>
  )

  const renderJoinMode = () => (
    <div>
      <button
        onClick={() => setMode('choose')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200 group"
      >
        <div className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</div>
        <span className="font-medium">Back to options</span>
      </button>

      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-5 w-fit mx-auto mb-6 shadow-lg">
          <div className="text-white text-3xl">👥</div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Join a Family</h2>
        <p className="text-gray-600 text-lg">Enter your family's invitation code below</p>
      </div>

      <form onSubmit={handleJoinFamily} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Family Invite Code
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
              🔑
            </div>
            <input
              type="text"
              name="inviteCode"
              value={formData.inviteCode}
              onChange={handleInputChange}
              required
              maxLength={8}
              className="w-full pl-12 pr-4 py-6 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-3xl font-mono uppercase tracking-[0.3em] font-bold"
              placeholder="ABC123XY"
              style={{ letterSpacing: '0.3em' }}
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-lg mt-0.5">ℹ️</div>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Need an invite code?</p>
                <p className="text-sm text-blue-700">
                  Ask a family member to share their 8-character family code with you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="text-red-500 text-xl mt-0.5">⚠️</div>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.inviteCode.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-700 hover:shadow-lg transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Joining your family...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <div className="text-xl">👥</div>
              <span>Join Family</span>
            </div>
          )}
        </button>
      </form>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg mx-auto">
        <Card className="bg-white p-8 relative shadow-2xl animate-slide-up">
          {mode !== 'choose' && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <div className="text-gray-400 hover:text-gray-600 text-xl">×</div>
            </button>
          )}

          {mode === 'choose' && renderChooseMode()}
          {mode === 'create' && renderCreateMode()}
          {mode === 'join' && renderJoinMode()}
        </Card>
      </div>
    </div>
  )
}

export default FamilySetupModal