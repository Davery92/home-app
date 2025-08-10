'use client'

import React, { useState } from 'react'
import Card from './ui/Card'

export interface FamilyMember {
  id: string
  name: string
  avatar: string
  totalPoints: number
  completedToday: number
  color: string
  hasAccount?: boolean
}

interface FamilyMembersModalProps {
  isOpen: boolean
  onClose: () => void
  familyMembers: FamilyMember[]
  onUpdateMembers: (members: FamilyMember[]) => void
  onAddMember?: (memberData: { name: string; avatar: string; color: string }) => Promise<any>
  onUpdateMember?: (memberId: string, updates: { name?: string; avatar?: string; color?: string }) => Promise<any>
  onDeleteMember?: (memberId: string) => Promise<any>
}

const FamilyMembersModal: React.FC<FamilyMembersModalProps> = ({
  isOpen,
  onClose,
  familyMembers,
  onUpdateMembers,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}) => {
  const [members, setMembers] = useState<FamilyMember[]>(familyMembers)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Update local state when props change
  React.useEffect(() => {
    setMembers(familyMembers)
  }, [familyMembers])

  if (!isOpen) return null

  const updateMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    if (onUpdateMember) {
      try {
        setLoading(true)
        await onUpdateMember(memberId, updates)
        setEditingMember(null)
      } catch (error) {
        console.error('Failed to update member:', error)
        alert('Failed to update family member. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Fallback to local state update
      const updatedMembers = members.map(member =>
        member.id === memberId ? { ...member, ...updates } : member
      )
      setMembers(updatedMembers)
      onUpdateMembers(updatedMembers)
      setEditingMember(null)
    }
  }

  const addMember = async (newMember: Omit<FamilyMember, 'id' | 'totalPoints' | 'completedToday'>) => {
    if (onAddMember) {
      try {
        setLoading(true)
        await onAddMember(newMember)
        setShowAddForm(false)
      } catch (error) {
        console.error('Failed to add member:', error)
        alert('Failed to add family member. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Fallback to local state update
      const member: FamilyMember = {
        ...newMember,
        id: Date.now().toString(),
        totalPoints: 0,
        completedToday: 0,
        hasAccount: false
      }
      const updatedMembers = [...members, member]
      setMembers(updatedMembers)
      onUpdateMembers(updatedMembers)
      setShowAddForm(false)
    }
  }

  const removeMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member?.hasAccount) {
      alert("Cannot remove members who have user accounts. They need to leave the family themselves.")
      return
    }
    
    if (confirm(`Remove ${member?.name} from the family? This action cannot be undone.`)) {
      if (onDeleteMember) {
        try {
          setLoading(true)
          await onDeleteMember(memberId)
        } catch (error) {
          console.error('Failed to delete member:', error)
          alert('Failed to remove family member. Please try again.')
        } finally {
          setLoading(false)
        }
      } else {
        // Fallback to local state update
        const updatedMembers = members.filter(m => m.id !== memberId)
        setMembers(updatedMembers)
        onUpdateMembers(updatedMembers)
      }
    }
  }

  const editableMembers = members.filter(m => !m.hasAccount)
  const accountHolders = members.filter(m => m.hasAccount)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Family Members</h2>
              <p className="text-sm text-gray-500">Manage your family's members and chore assignments</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <span className="text-gray-400 hover:text-gray-600 text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Account Holders Section */}
          {accountHolders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <span className="text-green-500">🔐</span>
                <span>Account Holders</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountHolders.map((member) => (
                  <div key={member.id} className={`bg-gradient-to-r ${member.color} rounded-xl p-4 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{member.avatar}</span>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs opacity-90">Has account</p>
                        </div>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Protected</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>⭐ {member.totalPoints} points</span>
                      <span>✅ {member.completedToday} today</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <span className="text-blue-500">✏️</span>
                <span>Editable Members</span>
              </h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Member</span>
              </button>
            </div>

            {editableMembers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 mb-4">No editable family members yet.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Add First Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editableMembers.map((member) => (
                  <div key={member.id} className={`bg-gradient-to-r ${member.color} rounded-xl p-4 text-white relative group`}>
                    {editingMember === member.id ? (
                      <EditMemberForm
                        member={member}
                        onSave={(updates) => updateMember(member.id, updates)}
                        onCancel={() => setEditingMember(null)}
                      />
                    ) : (
                      <>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingMember(member.id)}
                              className="bg-white/20 hover:bg-white/30 rounded-full p-1"
                            >
                              <span className="text-xs">✏️</span>
                            </button>
                            <button
                              onClick={() => removeMember(member.id)}
                              className="bg-red-500/70 hover:bg-red-500 rounded-full p-1"
                            >
                              <span className="text-xs">🗑️</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{member.avatar}</span>
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-xs opacity-90">No account</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>⭐ {member.totalPoints} points</span>
                          <span>✅ {member.completedToday} today</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Member Form */}
          {showAddForm && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <AddMemberForm
                onSave={addMember}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              <strong>{members.length}</strong> total members • 
              <strong className="text-green-600 ml-1">{accountHolders.length}</strong> with accounts • 
              <strong className="text-blue-600 ml-1">{editableMembers.length}</strong> editable
            </p>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Edit Member Form Component
const EditMemberForm: React.FC<{
  member: FamilyMember
  onSave: (updates: Partial<FamilyMember>) => void
  onCancel: () => void
}> = ({ member, onSave, onCancel }) => {
  const [name, setName] = useState(member.name)
  const [avatar, setAvatar] = useState(member.avatar)
  const [color, setColor] = useState(member.color)

  const avatarOptions = ['👩', '👨', '🧒', '👧', '👶', '🧑', '👴', '👵', '🧙‍♀️', '🧙‍♂️', '👸', '🤴']

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim(), avatar, color })
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-2 py-1 text-sm bg-white/90 border border-white/30 rounded text-gray-800"
        placeholder="Name"
        autoFocus
      />
      <div className="flex space-x-1 flex-wrap">
        {avatarOptions.slice(0, 8).map((av, idx) => (
          <button
            key={idx}
            onClick={() => setAvatar(av)}
            className={`p-1 rounded text-xs ${avatar === av ? 'bg-white/40' : 'bg-white/20'} hover:bg-white/40`}
          >
            {av}
          </button>
        ))}
      </div>
      <div className="flex space-x-2">
        <button onClick={handleSave} className="flex-1 bg-white/20 hover:bg-white/30 py-1 px-2 rounded text-xs">
          Save
        </button>
        <button onClick={onCancel} className="flex-1 bg-white/20 hover:bg-white/30 py-1 px-2 rounded text-xs">
          Cancel
        </button>
      </div>
    </div>
  )
}

// Add Member Form Component
const AddMemberForm: React.FC<{
  onSave: (member: Omit<FamilyMember, 'id' | 'totalPoints' | 'completedToday'>) => void
  onCancel: () => void
}> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('👤')
  const [color, setColor] = useState('from-blue-400 to-indigo-400')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave({ name: name.trim(), avatar, color, hasAccount: false })
    }
  }

  const colorOptions = [
    { value: 'from-pink-400 to-rose-400', label: 'Pink' },
    { value: 'from-blue-400 to-indigo-400', label: 'Blue' },
    { value: 'from-green-400 to-emerald-400', label: 'Green' },
    { value: 'from-purple-400 to-pink-400', label: 'Purple' },
    { value: 'from-yellow-400 to-orange-400', label: 'Orange' },
    { value: 'from-red-400 to-pink-400', label: 'Red' },
    { value: 'from-teal-400 to-blue-400', label: 'Teal' },
    { value: 'from-indigo-400 to-purple-400', label: 'Indigo' }
  ]

  const avatarOptions = ['👩', '👨', '🧒', '👧', '👶', '🧑', '👴', '👵', '🧙‍♀️', '🧙‍♂️', '👸', '🤴']

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Family Member</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter name..."
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
          <div className="flex space-x-2 flex-wrap gap-2">
            {avatarOptions.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(av)}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  avatar === av 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{av}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  color === option.value 
                    ? 'border-blue-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`bg-gradient-to-r ${option.value} rounded p-1 text-white text-center text-xs font-medium`}>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Add Member
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default FamilyMembersModal