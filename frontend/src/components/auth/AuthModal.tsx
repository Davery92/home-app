'use client'

import React, { useState } from 'react'
import Card from '../ui/Card'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any, token: string, family?: any) => void
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use the same host as the frontend for API requests
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const endpoint = isLogin ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/register`
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Authentication failed`)
      }

      onSuccess(data.user, data.token, data.family)
      onClose()
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Network error - please check your connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <span className="material-icons text-gray-400 dark:text-gray-500">close</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 w-fit mx-auto mb-4">
            <span className="material-icons text-white text-2xl">home</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {isLogin ? 'Welcome Back!' : 'Join Your Family'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin 
              ? 'Sign in to access your family dashboard' 
              : 'Create an account to get started'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Please wait...</span>
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          {/* Toggle form type */}
          <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setFormData({ email: '', password: '', firstName: '', lastName: '' })
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium ml-2 transition-colors duration-200"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AuthModal