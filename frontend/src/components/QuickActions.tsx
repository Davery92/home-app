'use client'

import React from 'react'

interface QuickAction {
  id: string
  icon: string
  label: string
  color: string
  onClick: () => void
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: 'apps',
      icon: 'apps',
      label: 'App Drawer',
      color: 'bg-blue-100 text-blue-500',
      onClick: () => console.log('App Drawer clicked')
    },
    {
      id: 'screensaver',
      icon: 'desktop_windows',
      label: 'Screen Saver',
      color: 'bg-blue-100 text-blue-500',
      onClick: () => console.log('Screen Saver clicked')
    },
    {
      id: 'help',
      icon: 'help_outline',
      label: 'Help & Support',
      color: 'bg-blue-100 text-blue-500',
      onClick: () => console.log('Help clicked')
    },
    {
      id: 'lock',
      icon: 'lock',
      label: 'Lock',
      color: 'bg-blue-100 text-blue-500',
      onClick: () => console.log('Lock clicked')
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in">
      {actions.map((action) => (
        <div
          key={action.id}
          className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={action.onClick}
        >
          <div className={`p-3 rounded-full ${action.color}`}>
            <span className="material-icons">{action.icon}</span>
          </div>
          <p className="text-sm mt-2">{action.label}</p>
        </div>
      ))}
    </div>
  )
}

export default QuickActions