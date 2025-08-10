'use client'

import React, { useState, useEffect } from 'react'
import Card from './ui/Card'
import { useAuth } from '@/contexts/AuthContext'

interface FamilyMember {
  _id: string
  name: string
  email: string
  role: string
  joinedAt: string
  permissions: {
    manageFamily: boolean
    manageCalendar: boolean
    manageGrocery: boolean
    manageChores: boolean
    manageMeals: boolean
    inviteMembers: boolean
  }
}

interface Family {
  _id: string
  name: string
  description: string
  inviteCode: string
  memberCount: number
  members: FamilyMember[]
  settings: {
    allowChildrenToInvite: boolean
    requireApprovalForJoining: boolean
    shareCalendarWithAll: boolean
    allowAnonymousChores: boolean
    maxMembers: number
  }
  userRole: string
  userPermissions: any
}

interface FamilySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const FamilySettingsModal: React.FC<FamilySettingsModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth()
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview')
  const [showInviteCode, setShowInviteCode] = useState(false)

  useEffect(() => {
    if (isOpen && token) {
      fetchFamilyDetails()
    }
  }, [isOpen, token])

  if (!isOpen) return null

  const fetchFamilyDetails = async () => {
    try {
      setLoading(true)
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/families`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch family details')
      }

      setFamily(data.family)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = async () => {
    if (family?.inviteCode) {
      await navigator.clipboard.writeText(family.inviteCode)
      alert('Invite code copied to clipboard!')
    }
  }

  const shareInviteCode = () => {
    if (family && navigator.share) {
      navigator.share({
        title: `Join ${family.name}`,
        text: `You're invited to join ${family.name} family dashboard! Use invite code: ${family.inviteCode}`,
        url: window.location.origin
      })
    } else if (family) {
      const message = `You're invited to join ${family.name} family dashboard!\n\nVisit: ${window.location.origin}\nInvite Code: ${family.inviteCode}`
      copyInviteCode()
    }
  }

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      const response = await fetch(`${baseUrl}/api/families/members/${memberId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      })

      if (response.ok) {
        fetchFamilyDetails() // Refresh data
      }
    } catch (err) {
      console.error('Failed to update member role:', err)
    }
  }

  const removeMember = async (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from the family? This action cannot be undone.`)) {
      try {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:3001`
        const response = await fetch(`${baseUrl}/api/families/members/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          fetchFamilyDetails() // Refresh data
        }
      } catch (err) {
        console.error('Failed to remove member:', err)
      }
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Family Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3">
            <span className="text-white text-2xl">🏠</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{family?.name}</h3>
            <p className="text-sm text-gray-600">{family?.description || 'No description'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Members:</span>
            <span className="ml-2 font-semibold">{family?.memberCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Your Role:</span>
            <span className="ml-2 font-semibold capitalize">{family?.userRole}</span>
          </div>
        </div>
      </div>

      {/* Invite Code Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <span className="text-emerald-600">🔑</span>
            <span>Family Invite Code</span>
          </h3>
          <button
            onClick={() => setShowInviteCode(!showInviteCode)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {showInviteCode ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showInviteCode && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold tracking-widest text-gray-800 mb-2">
                  {family?.inviteCode}
                </div>
                <p className="text-xs text-gray-500">Share this code with family members to invite them</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={copyInviteCode}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>📋</span>
                <span>Copy Code</span>
              </button>
              <button
                onClick={shareInviteCode}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">👥</div>
            <div>
              <div className="text-lg font-bold text-gray-800">{family?.memberCount}</div>
              <div className="text-xs text-gray-500">Active Members</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📅</div>
            <div>
              <div className="text-lg font-bold text-gray-800">
                {new Date().toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMembersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Family Members</h3>
        <span className="text-sm text-gray-500">{family?.memberCount} members</span>
      </div>
      
      {family?.members.map((member) => (
        <div key={member._id} className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <span className="text-blue-600 text-lg">👤</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={member.role}
                onChange={(e) => updateMemberRole(member._id, e.target.value)}
                disabled={member._id === family?.members.find(m => m.name === family.name)?._id}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 capitalize"
              >
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="guardian">Guardian</option>
              </select>
              
              {family?.userRole === 'admin' && member._id !== family?.members.find(m => m.name === family.name)?._id && (
                <button
                  onClick={() => removeMember(member._id, member.name)}
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                >
                  <span className="text-sm">🗑️</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Joined {new Date(member.joinedAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Family Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <div className="font-medium text-gray-800">Maximum Members</div>
              <div className="text-sm text-gray-500">Limit the number of family members</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">{family?.settings.maxMembers}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <div className="font-medium text-gray-800">Calendar Sharing</div>
              <div className="text-sm text-gray-500">All members can view family calendar</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${family?.settings.shareCalendarWithAll ? 'text-green-600' : 'text-gray-400'}`}>
                {family?.settings.shareCalendarWithAll ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <div className="font-medium text-gray-800">Require Approval</div>
              <div className="text-sm text-gray-500">Admin approval required for joining</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${family?.settings.requireApprovalForJoining ? 'text-green-600' : 'text-gray-400'}`}>
                {family?.settings.requireApprovalForJoining ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl bg-white p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading family details...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !family) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl bg-white p-8">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Error Loading Family</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Family Settings</h2>
              <p className="text-sm text-gray-500">Manage your family dashboard</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <span className="text-gray-400 hover:text-gray-600 text-2xl">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'members', label: 'Members', icon: '👥' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Family created on {new Date().toLocaleDateString()}</p>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FamilySettingsModal