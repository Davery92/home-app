'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      const isDark = JSON.parse(savedTheme)
      setIsDarkMode(isDark)
      updateDocumentTheme(isDark)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      updateDocumentTheme(prefersDark)
    }
  }, [])

  const updateDocumentTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', JSON.stringify(newMode))
    updateDocumentTheme(newMode)
  }

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('darkMode', JSON.stringify(isDark))
    updateDocumentTheme(isDark)
  }

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}