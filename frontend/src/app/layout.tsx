import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Home App - Family Management',
  description: 'A comprehensive family management application for organizing your home life',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <div id="root">{children}</div>
            <div id="modal-root"></div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}