'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  _id: string
  email: string
  profile: {
    firstName: string
    lastName: string
    fullName?: string
    avatar?: string
    role: string
  }
  familyId?: string
  settings: any
}

interface Family {
  _id: string
  name: string
  description?: string
  inviteCode: string
  memberCount: number
  role: string
}

interface AuthContextType {
  user: User | null
  family: Family | null
  token: string | null
  isLoading: boolean
  login: (userData: User, authToken: string, familyData?: Family) => void
  logout: () => void
  setFamily: (familyData: Family) => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [family, setFamilyState] = useState<Family | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    const savedFamily = localStorage.getItem('auth_family')

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        if (savedFamily) {
          setFamilyState(JSON.parse(savedFamily))
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_family')
      }
    }

    setIsLoading(false)
  }, [])

  const login = (userData: User, authToken: string, familyData?: Family) => {
    setUser(userData)
    setToken(authToken)
    if (familyData) {
      setFamilyState(familyData)
    }

    // Save to localStorage
    localStorage.setItem('auth_token', authToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    if (familyData) {
      localStorage.setItem('auth_family', JSON.stringify(familyData))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setFamilyState(null)

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_family')
  }

  const setFamily = (familyData: Family) => {
    setFamilyState(familyData)
    localStorage.setItem('auth_family', JSON.stringify(familyData))
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    family,
    token,
    isLoading,
    login,
    logout,
    setFamily,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}