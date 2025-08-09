'use client'

import React, { useState } from 'react'

interface Chore {
  id: string
  title: string
  isCompleted: boolean
  points: number
}

interface CompletedChore {
  title: string
  stickerUrl: string
}

const ChoreBoard: React.FC = () => {
  const [chores, setChores] = useState<Chore[]>([
    { id: '1', title: 'Wash the Dishes', isCompleted: false, points: 1 },
    { id: '2', title: 'Put Toys Away', isCompleted: false, points: 1 }
  ])

  const completedChores: CompletedChore[] = [
    {
      title: 'Wash the Dishes',
      stickerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgknppLo-rnQKF7EByASeuChZ-FZECzK5B8vwmWreAJ5nQDvlA9CXuu92FRjw0YldmJdwoHJzi7l0KZZCZ88MoO-AqAOy5hoT2aIVZ1Dn-kPMePyis8s4AQOuFzxc_l8MEd94B_OzabD8E798UzNoNQ7x7NVHO33CSBE5hXk2u-cuQA0ThD_zhohB5HAejIUYZqmGe1bV2vCRry54Pq1kf7TXvoatndRkB6QD4aDaez3AQjOywc9ScQszHm1jeuHP4yuHwgG12EHCE'
    },
    {
      title: 'Make the Bed',
      stickerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANYgAudQYwT3Ar0yctezEUJAgEZR0th-JMUx4F9cgQ1oTqPPEY11mNJn7LcoBEq9bW7mu84fcb2C2gD3m1KvcSTQmGMUcT7YcJr_mz352POdtklWS7MFzZiLVpk6yYgeL80lVirRsbHCgC70PPCxogloQpZh-RvCVLfHiny5gbvk-xqYMigmAZQ2SEMgvXEMenaAJJGDRjFTQ-2h34MIbTOUrBev9QW8Bm2hOgb3z8R2MFau_E7RtW1IxoRRb69odMQeZsV7-uvGDg'
    }
  ]

  const totalStars = 4
  const totalFire = 10

  const toggleChore = (choreId: string) => {
    setChores(chores.map(chore => 
      chore.id === choreId 
        ? { ...chore, isCompleted: !chore.isCompleted }
        : chore
    ))
  }

  return (
    <div className="bg-white p-6 rounded-3xl flex-grow animate-fade-in">
      <h3 className="text-lg font-semibold">Nora</h3>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
        <span>Today's Chores</span>
        <div className="flex items-center space-x-2">
          <span className="material-icons text-blue-500 text-base">star</span>
          <span>{totalStars}</span>
          <span className="material-icons text-yellow-500 text-base">whatshot</span>
          <span>{totalFire}</span>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {/* Active Chores */}
        {chores.map((chore) => (
          <div key={chore.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center">
              <span className="material-icons text-blue-500 mr-3">star</span>
              <span className={chore.isCompleted ? 'line-through text-gray-500' : ''}>
                {chore.title}
              </span>
            </div>
            <button
              onClick={() => toggleChore(chore.id)}
              className={`w-5 h-5 border-2 rounded-full ${
                chore.isCompleted 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-300 hover:border-gray-400'
              } transition-colors duration-200`}
            >
              {chore.isCompleted && (
                <span className="material-icons text-white text-sm">check</span>
              )}
            </button>
          </div>
        ))}

        {/* Completed Chores */}
        {completedChores.map((chore, index) => (
          <div key={index} className="bg-blue-100 p-3 rounded-lg">
            <span className="text-xs text-blue-600 font-semibold">Well Done!</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-500 line-through">{chore.title}</span>
              <img 
                alt="stickers" 
                className="h-8 w-8 object-contain" 
                src={chore.stickerUrl}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChoreBoard