import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Home App - Family Management',
  description: 'A comprehensive family management application for organizing your home life',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <div id="root">{children}</div>
        <div id="modal-root"></div>
      </body>
    </html>
  )
}