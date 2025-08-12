'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { apiService } from '@/services/api'
import Card from './ui/Card'

interface CleaningTask {
  id: string
  title: string
  description?: string
  assignedTo: string
  assignedToType: 'user' | 'member'
  assignedToName: string
  room: string
  category: string
  priority: string
  estimatedMinutes: number
  dueDate?: string
  completed: boolean
  completedAt?: string
  completedByName?: string
  recurring: {
    enabled: boolean
    frequency?: string
  }
  supplies: Array<{
    name: string
    optional: boolean
  }>
  isOverdue?: boolean
  createdAt: string
  updatedAt: string
}

interface CleaningStats {
  total: number
  completed: number
  pending: number
  overdue: number
  high_priority: number
  urgent: number
}

const CleaningSchedule: React.FC = () => {
  const { token } = useAuth()
  const { members: familyMembers } = useFamilyMembers()
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [stats, setStats] = useState<CleaningStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    high_priority: 0,
    urgent: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'my_tasks'>('all')
  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToType: 'user' as 'user' | 'member',
    assignedToName: '',
    room: 'other',
    category: 'weekly',
    priority: 'medium',
    estimatedMinutes: 30,
    dueDate: '',
    recurringEnabled: false,
    recurringFrequency: 'weekly',
  })

  const rooms = [
    { key: 'kitchen', label: '🍳 Kitchen', icon: '🍳' },
    { key: 'bathroom', label: '🚿 Bathroom', icon: '🚿' },
    { key: 'living_room', label: '🛋️ Living Room', icon: '🛋️' },
    { key: 'bedroom', label: '🛏️ Bedroom', icon: '🛏️' },
    { key: 'laundry', label: '🧺 Laundry', icon: '🧺' },
    { key: 'garage', label: '🚗 Garage', icon: '🚗' },
    { key: 'outdoor', label: '🌿 Outdoor', icon: '🌿' },
    { key: 'office', label: '🏢 Office', icon: '🏢' },
    { key: 'dining_room', label: '🍽️ Dining Room', icon: '🍽️' },
    { key: 'other', label: '📦 Other', icon: '📦' }
  ]

  const categories = [
    { key: 'daily', label: '📅 Daily', icon: '📅' },
    { key: 'weekly', label: '📝 Weekly', icon: '📝' },
    { key: 'monthly', label: '🗓️ Monthly', icon: '🗓️' },
    { key: 'seasonal', label: '🍂 Seasonal', icon: '🍂' },
    { key: 'deep_clean', label: '🧽 Deep Clean', icon: '🧽' },
    { key: 'maintenance', label: '🔧 Maintenance', icon: '🔧' }
  ]

  const fetchTasks = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getCleaningTasks(token, {
        room: roomFilter !== 'all' ? roomFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })
      
      if (response.success) {
        setTasks(response.tasks)
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching cleaning tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [token, roomFilter, categoryFilter])

  const getFilteredTasks = () => {
    let filtered = tasks

    switch (filter) {
      case 'pending':
        filtered = tasks.filter(task => !task.completed)
        break
      case 'completed':
        filtered = tasks.filter(task => task.completed)
        break
      case 'overdue':
        filtered = tasks.filter(task => task.isOverdue && !task.completed)
        break
      case 'my_tasks':
        // Assuming we have access to current user info
        filtered = tasks.filter(task => 
          task.assignedToType === 'user' // This would need proper user matching
        )
        break
      default:
        filtered = tasks
    }

    return filtered
  }

  const getRoomIcon = (room: string) => {
    const roomObj = rooms.find(r => r.key === room)
    return roomObj?.icon || '📦'
  }

  const getCategoryIcon = (category: string) => {
    const categoryObj = categories.find(c => c.key === category)
    return categoryObj?.icon || '📝'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨'
      case 'high': return '⚡'
      case 'medium': return '📋'
      case 'low': return '💭'
      default: return '📋'
    }
  }

  const handleToggleTask = async (taskId: string) => {
    if (!token) return
    
    try {
      const response = await apiService.toggleCleaningTask(token, taskId)
      
      if (response.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            completed: !task.completed,
            completedAt: response.task.completedAt,
            completedByName: response.task.completedByName
          } : task
        ))
        fetchTasks() // Refresh stats
      }
    } catch (error) {
      console.error('Error toggling cleaning task:', error)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newTask.title.trim() || !newTask.assignedTo) return
    
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignedTo: newTask.assignedTo,
        assignedToType: newTask.assignedToType,
        assignedToName: newTask.assignedToName,
        room: newTask.room,
        category: newTask.category,
        priority: newTask.priority,
        estimatedMinutes: newTask.estimatedMinutes,
        dueDate: newTask.dueDate || undefined,
        recurring: {
          enabled: newTask.recurringEnabled,
          frequency: newTask.recurringFrequency
        },
      }

      const response = await apiService.createCleaningTask(token, taskData)
      
      if (response.success) {
        setTasks(prev => [response.task, ...prev])
        setNewTask({
          title: '',
          description: '',
          assignedTo: '',
          assignedToType: 'user',
          assignedToName: '',
          room: 'other',
          category: 'weekly',
          priority: 'medium',
          estimatedMinutes: 30,
          dueDate: '',
          recurringEnabled: false,
          recurringFrequency: 'weekly',
        })
        setShowAddForm(false)
        fetchTasks() // Refresh stats
      }
    } catch (error) {
      console.error('Error creating cleaning task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!token || !confirm('Are you sure you want to delete this cleaning task?')) return
    
    try {
      const response = await apiService.deleteCleaningTask(token, taskId)
      
      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        fetchTasks() // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting cleaning task:', error)
    }
  }

  const handleClearCompleted = async () => {
    if (!token || !confirm('Delete all completed cleaning tasks?')) return
    
    try {
      const response = await apiService.clearCompletedCleaningTasks(token)
      
      if (response.success) {
        setTasks(prev => prev.filter(task => !task.completed))
        fetchTasks() // Refresh stats
      }
    } catch (error) {
      console.error('Error clearing completed tasks:', error)
    }
  }


  const handleAssignmentChange = (assignedTo: string, assignedToType: 'user' | 'member') => {
    let assignedToName = ''
    
    if (assignedToType === 'member') {
      const member = familyMembers.find(m => m.id === assignedTo)
      assignedToName = member?.name || ''
    } else {
      // For users, you'd need to get user info - for now using a placeholder
      assignedToName = 'User' // This should be the actual user's name
    }
    
    setNewTask(prev => ({
      ...prev,
      assignedTo,
      assignedToType,
      assignedToName
    }))
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading cleaning schedule...</span>
        </div>
      </Card>
    )
  }

  const filteredTasks = getFilteredTasks()

  return (
    <Card className="p-6 bg-gradient-to-br from-white/90 to-green-50/90 backdrop-blur-sm border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🧹</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Cleaning Schedule</h3>
            <p className="text-gray-500">
              {stats.pending} pending • {stats.completed} completed
              {stats.overdue > 0 && <span className="text-red-600"> • {stats.overdue} overdue</span>}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Done</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.high_priority}</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className="text-sm text-gray-600">Urgent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Task Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: '📋 All', count: stats.total },
            { key: 'pending', label: '⏳ Pending', count: stats.pending },
            { key: 'completed', label: '✅ Completed', count: stats.completed },
            { key: 'overdue', label: '🚨 Overdue', count: stats.overdue },
            { key: 'my_tasks', label: '👤 My Tasks', count: 0 }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === filterOption.key
                  ? 'bg-green-500 text-white'
                  : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>

        {/* Room and Category Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Rooms</option>
              {rooms.map(room => (
                <option key={room.key} value={room.key}>{room.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.key} value={category.key}>{category.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clear Completed Button */}
      {stats.completed > 0 && (
        <div className="mb-4">
          <button
            onClick={handleClearCompleted}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            🗑️ Clear {stats.completed} Completed
          </button>
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <select
                  value={newTask.room}
                  onChange={(e) => setNewTask(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {rooms.map(room => (
                    <option key={room.key} value={room.key}>{room.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map(category => (
                    <option key={category.key} value={category.key}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">💭 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">⚡ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={newTask.estimatedMinutes}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="5"
                  max="480"
                />
              </div>
            </div>

            {/* Assignment and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={`${newTask.assignedToType}:${newTask.assignedTo}`}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(':')
                    handleAssignmentChange(id, type as 'user' | 'member')
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select assignee...</option>
                  <optgroup label="Family Members">
                    {familyMembers.map(member => (
                      <option key={member.id} value={`member:${member.id}`}>
                        {member.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newTask.recurringEnabled}
                    onChange={(e) => setNewTask(prev => ({ ...prev, recurringEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Recurring</span>
                </label>
              </div>
            </div>

            {newTask.recurringEnabled && (
              <div>
                <select
                  value={newTask.recurringFrequency}
                  onChange={(e) => setNewTask(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            )}

            <div>
              <textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
              />
            </div>


            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🧹</div>
            <p>No cleaning tasks found for the selected filter.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-green-500 hover:text-green-600"
              >
                View all tasks
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-all ${
                task.completed 
                  ? 'bg-green-50 border-green-200' 
                  : task.isOverdue
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white/70 border-gray-200 hover:bg-white/90'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium flex items-center space-x-2 ${
                      task.completed ? 'text-green-700 line-through' : 'text-gray-800'
                    }`}>
                      <span>{getRoomIcon(task.room)}</span>
                      <span>{task.title}</span>
                      {task.recurring.enabled && <span className="text-xs">🔄</span>}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{getCategoryIcon(task.category)} {task.category}</span>
                    <span>👤 {task.assignedToName}</span>
                    <span>⏱️ {task.estimatedMinutes}min</span>
                    
                    {task.dueDate && (
                      <span className={
                        task.isOverdue && !task.completed
                          ? 'text-red-600 font-medium'
                          : ''
                      }>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                        {task.isOverdue && !task.completed && ' (Overdue)'}
                      </span>
                    )}
                    
                    
                    {task.completedAt && (
                      <span className="text-green-600">
                        ✅ {new Date(task.completedAt).toLocaleDateString()} by {task.completedByName}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default CleaningSchedule