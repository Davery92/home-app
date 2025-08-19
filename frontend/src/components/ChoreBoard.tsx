'use client'

import React, { useState } from 'react'
import Card from './ui/Card'
import { useChores } from '@/hooks/useChores'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'

interface Chore {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  points: number
  assignedTo: string
  assignedBy: string
  dueDate?: string
  completedAt?: string
  priority: 'low' | 'medium' | 'high'
  category: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other'
}

interface FamilyMember {
  id: string
  name: string
  avatar: string
  totalPoints: number
  completedToday: number
  color: string
  hasAccount?: boolean
}

interface ChoreBoardProps {
  familyMembers?: FamilyMember[]
  chores?: Chore[]
  loading?: boolean
  error?: string | null
}

const ChoreBoard: React.FC<ChoreBoardProps> = ({ 
  familyMembers: propFamilyMembers = [],
  chores: propChores = [],
  loading: propLoading = false,
  error: propError = null
}) => {
  // Use hooks if props are not provided (backwards compatibility)
  const {
    chores: hookChores,
    loading: hookChoresLoading,
    error: hookChoresError,
    addChore,
    updateChore,
    toggleChore,
    deleteChore,
    clearCompletedChores,
    completedToday,
    totalChores,
    completionRate,
  } = useChores()

  const {
    members: hookFamilyMembers,
    loading: hookMembersLoading,
    error: hookMembersError,
    refreshMembers,
    clearMemberPoints,
    clearAllFamilyPoints,
  } = useFamilyMembers()

  // Always use hook data for real-time updates, fall back to props if hooks unavailable
  const chores = hookChores.length > 0 || !propChores.length ? hookChores : propChores
  const familyMembers = hookFamilyMembers.length > 0 || !propFamilyMembers.length ? hookFamilyMembers : propFamilyMembers
  const loading = propLoading || hookChoresLoading || hookMembersLoading
  const error = propError || hookChoresError || hookMembersError

  const [editingChore, setEditingChore] = useState<string | null>(null)
  const [showAddChore, setShowAddChore] = useState(false)
  const [newChore, setNewChore] = useState({ 
    title: '', 
    points: 1, 
    assignedTo: '', 
    assignedToType: 'member' as 'user' | 'member',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'other' as 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other'
  })

  // Calculate stats from actual chores data
  const actualCompletedToday = chores.filter(chore => chore.isCompleted).length
  const actualTotalChores = chores.length
  const actualCompletionRate = actualTotalChores > 0 ? Math.round((actualCompletedToday / actualTotalChores) * 100) : 0

  const handleToggleChore = async (choreId: string) => {
    console.log('Toggling chore:', choreId)
    try {
      const result = await toggleChore(choreId)
      console.log('Toggle result:', result)
      
      // Small delay to ensure backend has updated points
      setTimeout(async () => {
        // Refresh family members to update points after chore completion
        if (refreshMembers) {
          console.log('Refreshing members...')
          await refreshMembers()
          console.log('Members refreshed')
        }
      }, 500)
    } catch (error) {
      console.error('Failed to toggle chore:', error)
      alert('Failed to toggle chore. Please try again.')
    }
  }

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newChore.title.trim() && newChore.assignedTo) {
      try {
        // Determine assignment type and ID based on selected assignee
        let assignedToId = newChore.assignedTo
        let assignedToType: 'user' | 'member' = 'member'
        
        // Find the member to check if they have an account
        const selectedMember = familyMembers.find(m => m.id === newChore.assignedTo)
        if (selectedMember?.hasAccount) {
          assignedToType = 'user'
        }

        console.log('Creating chore:', {
          title: newChore.title.trim(),
          assignedTo: assignedToId,
          assignedToType,
          selectedMember: selectedMember?.name,
          hasAccount: selectedMember?.hasAccount
        })

        const result = await addChore({
          title: newChore.title.trim(),
          points: newChore.points,
          assignedTo: assignedToId,
          assignedToType,
          priority: newChore.priority,
          category: newChore.category,
        })

        console.log('Chore added successfully:', result)
        setNewChore({ title: '', points: 1, assignedTo: '', assignedToType: 'member', priority: 'medium', category: 'other' })
        setShowAddChore(false)
      } catch (error) {
        console.error('Failed to add chore:', error)
        alert('Failed to add chore. Please try again.')
      }
    }
  }

  const handleDeleteChore = async (choreId: string) => {
    if (confirm('Are you sure you want to delete this chore?')) {
      console.log('Deleting chore:', choreId)
      try {
        const result = await deleteChore(choreId)
        console.log('Delete result:', result)
      } catch (error) {
        console.error('Failed to delete chore:', error)
        alert('Failed to delete chore. Please try again.')
      }
    }
  }

  const handleClearCompleted = async () => {
    const completedCount = chores.filter(chore => chore.isCompleted).length
    if (completedCount === 0) {
      alert('No completed chores to clear.')
      return
    }

    if (confirm(`Are you sure you want to clear all ${completedCount} completed chore(s)? This will permanently delete them.`)) {
      console.log('Clearing completed chores:', completedCount)
      try {
        const result = await clearCompletedChores()
        console.log('Clear completed result:', result)
        
        // Refresh family members to update points after clearing
        if (refreshMembers) {
          await refreshMembers()
        }
      } catch (error) {
        console.error('Failed to clear completed chores:', error)
        alert('Failed to clear completed chores. Please try again.')
      }
    }
  }

  const handleClearAllPoints = async () => {
    if (confirm('Clear ALL points for the entire family? This will reset all members\' total points and daily completed counts to zero.')) {
      try {
        await clearAllFamilyPoints()
        console.log('All family points cleared successfully')
      } catch (error) {
        console.error('Failed to clear all family points:', error)
        alert('Failed to clear all family points. Please try again.')
      }
    }
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-white/90 to-red-50/90 dark:from-gray-800/90 dark:to-red-900/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Failed to Load Chore Board</h3>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-gray-800/90 dark:to-purple-900/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">📋</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Family Chore Board</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{actualCompletionRate}% completed today</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <div className="text-green-500 text-lg">✅</div>
                <span className="font-bold text-gray-700 dark:text-gray-300">{actualCompletedToday}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
            </div>
            <div className="text-gray-300 dark:text-gray-600">|</div>
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <div className="text-blue-500 text-lg">📝</div>
                <span className="font-bold text-gray-700 dark:text-gray-300">{actualTotalChores}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {actualCompletedToday > 0 && (
              <button
                onClick={handleClearCompleted}
                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center space-x-1"
              >
                <span>🗑️</span>
                <span>Clear Done</span>
              </button>
            )}
            <button
              onClick={handleClearAllPoints}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center space-x-1"
            >
              <span>🧹</span>
              <span>Clear Points</span>
            </button>
          </div>
        </div>
      </div>

      {/* Family Members */}
      {familyMembers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Family Members</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {familyMembers.map((member) => (
              <div key={member.id} className={`bg-gradient-to-r ${member.color} rounded-xl p-3 text-white relative group`}>
                <button
                  onClick={() => clearMemberPoints(member.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 rounded-full p-1"
                  title={`Clear ${member.name}'s points`}
                >
                  <span className="text-xs">🧹</span>
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{member.avatar}</span>
                  <div>
                    <p className="font-semibold text-sm">{member.name}</p>
                    <p className="text-xs opacity-90">{member.completedToday} done today</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-1">
                  <span className="text-yellow-200 text-sm">⭐</span>
                  <span className="text-xs font-medium">{member.totalPoints} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading chores...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Chores */}
          {chores.map((chore) => (
            <div 
              key={chore.id} 
              className={`relative group p-4 rounded-2xl transition-all duration-200 ${
                chore.isCompleted 
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' 
                  : 'bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 hover:shadow-md'
              }`}
            >
              {editingChore === chore.id ? (
                <ChoreEditForm 
                  chore={chore}
                  familyMembers={familyMembers}
                  onSave={(updates) => updateChore(chore.id, updates)}
                  onCancel={() => setEditingChore(null)}
                  onDelete={() => handleDeleteChore(chore.id)}
                />
              ) : (
                <>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingChore(chore.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteChore(chore.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        chore.isCompleted 
                          ? 'bg-green-100' 
                          : 'bg-purple-100'
                      }`}>
                        <div className={`text-sm ${
                          chore.isCompleted 
                            ? 'text-green-600' 
                            : 'text-purple-600'
                        }`}>
                          {chore.isCompleted ? '✅' : '⭕'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${
                            chore.isCompleted 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-800 dark:text-white'
                          }`}>
                            {chore.title}
                          </span>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const assignee = familyMembers.find(m => m.name === chore.assignedTo);
                              return assignee ? (
                                <div className={`bg-gradient-to-r ${assignee.color} px-2 py-1 rounded-full text-white text-xs font-medium flex items-center space-x-1`}>
                                  <span>{assignee.avatar}</span>
                                  <span>{assignee.name}</span>
                                </div>
                              ) : (
                                <div className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 text-xs font-medium">
                                  {chore.assignedTo}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-1">
                            <div className="text-yellow-500 text-xs">⭐</div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{chore.points} points</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">Assigned by {chore.assignedBy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleToggleChore(chore.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ml-3 ${
                        chore.isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {chore.isCompleted && (
                        <div className="text-sm text-white">✓</div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add New Chore */}
          {showAddChore ? (
            <form onSubmit={handleAddChore} className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                  placeholder="Enter chore name..."
                  className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
                <select
                  value={newChore.category}
                  onChange={(e) => setNewChore({ ...newChore, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="cleaning">🧹 Cleaning (Shared)</option>
                  <option value="kitchen">🍽️ Kitchen</option>
                  <option value="yard">🌱 Yard Work</option>
                  <option value="pets">🐕 Pet Care</option>
                  <option value="personal">👤 Personal</option>
                  <option value="other">📦 Other</option>
                </select>
                <div className="flex items-center space-x-3">
                  <select
                    value={newChore.assignedTo}
                    onChange={(e) => setNewChore({ ...newChore, assignedTo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-purple-200 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={newChore.category !== 'cleaning'}
                  >
                    <option value="">{newChore.category === 'cleaning' ? 'Assign to... (Optional)' : 'Assign to...'}</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.avatar} {member.name} {member.hasAccount ? '(Account)' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newChore.points}
                    onChange={(e) => setNewChore({ ...newChore, points: parseInt(e.target.value) })}
                    className="px-3 py-2 border border-purple-200 dark:border-purple-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={1}>⭐ 1 pt</option>
                    <option value={2}>⭐ 2 pts</option>
                    <option value={3}>⭐ 3 pts</option>
                    <option value={5}>⭐ 5 pts</option>
                    <option value={10}>⭐ 10 pts</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium"
                >
                  Add Chore
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChore(false)
                    setNewChore({ title: '', points: 1, assignedTo: '', assignedToType: 'member', priority: 'medium', category: 'other' })
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddChore(true)}
              className="w-full border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-2xl p-4 text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <div className="text-xl">+</div>
              <span className="font-medium">Add New Chore</span>
            </button>
          )}

          {/* Completed Chores Summary */}
          {actualCompletedToday > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border border-green-100 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">🎉 Great Progress!</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {actualCompletedToday} of {actualTotalChores} chores completed ({actualCompletionRate}%)
                    </p>
                  </div>
                  <div className="text-3xl">
                    {actualCompletionRate === 100 ? '🏆' : actualCompletionRate >= 75 ? '⭐' : '👍'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Chore Edit Form Component
const ChoreEditForm: React.FC<{
  chore: Chore
  familyMembers: FamilyMember[]
  onSave: (updates: Partial<Chore>) => Promise<any>
  onCancel: () => void
  onDelete: () => void
}> = ({ chore, familyMembers, onSave, onCancel, onDelete }) => {
  const [title, setTitle] = useState(chore.title)
  const [points, setPoints] = useState(chore.points)
  const [assignedTo, setAssignedTo] = useState(() => {
    // Find the assigned member by name
    const assignee = familyMembers.find(m => m.name === chore.assignedTo)
    return assignee?.id || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (title.trim()) {
      try {
        setLoading(true)
        
        // Determine assignment type and ID
        let assignedToId = assignedTo
        let assignedToType: 'user' | 'member' = 'member'
        
        // Find the member to check if they have an account
        const selectedMember = familyMembers.find(m => m.id === assignedTo)
        if (selectedMember?.hasAccount) {
          assignedToType = 'user'
        }

        await onSave({ 
          title: title.trim(), 
          points, 
          assignedTo: assignedToId
        })
      } catch (error) {
        console.error('Failed to update chore:', error)
        alert('Failed to update chore. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
        disabled={loading}
      />
      <div className="flex space-x-3">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        >
          <option value="">Assign to...</option>
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.avatar} {member.name} {member.hasAccount ? '(Account)' : ''}
            </option>
          ))}
        </select>
        <select
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={loading}
        >
          <option value={1}>⭐ 1 pt</option>
          <option value={2}>⭐ 2 pts</option>
          <option value={3}>⭐ 3 pts</option>
          <option value={5}>⭐ 5 pts</option>
          <option value={10}>⭐ 10 pts</option>
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default ChoreBoard