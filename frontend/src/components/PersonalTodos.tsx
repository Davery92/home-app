'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'
import Card from './ui/Card'

interface PersonalTodo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  dueDate?: string
  completedAt?: string
  tags: string[]
  userId: string
  order: number
  createdAt: string
  updatedAt: string
}

interface TodoStats {
  total: number
  completed: number
  pending: number
  high: number
  urgent: number
  overdue: number
}

const PersonalTodos: React.FC = () => {
  const { token } = useAuth()
  const [todos, setTodos] = useState<PersonalTodo[]>([])
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    pending: 0,
    high: 0,
    urgent: 0,
    overdue: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'high' | 'urgent'>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<PersonalTodo | null>(null)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    dueDate: '',
    tags: [] as string[],
    tagInput: ''
  })

  const fetchTodos = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await apiService.getPersonalTodos(token)
      
      if (response.success) {
        setTodos(response.todos)
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [token])

  const getFilteredTodos = () => {
    switch (filter) {
      case 'pending':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      case 'high':
        return todos.filter(todo => todo.priority === 'high' && !todo.completed)
      case 'urgent':
        return todos.filter(todo => todo.priority === 'urgent' && !todo.completed)
      default:
        return todos
    }
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

  const handleToggleTodo = async (todoId: string) => {
    if (!token) return
    
    try {
      const response = await apiService.togglePersonalTodo(token, todoId)
      
      if (response.success) {
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? { ...todo, completed: !todo.completed, completedAt: response.todo.completedAt } : todo
        ))
        // Refresh stats
        fetchTodos()
      }
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newTodo.title.trim()) return
    
    try {
      const todoData = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim(),
        priority: newTodo.priority,
        category: newTodo.category.trim(),
        dueDate: newTodo.dueDate || undefined,
        tags: newTodo.tags
      }

      const response = await apiService.createPersonalTodo(token, todoData)
      
      if (response.success) {
        setTodos(prev => [response.todo, ...prev])
        setNewTodo({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          dueDate: '',
          tags: [],
          tagInput: ''
        })
        setShowAddForm(false)
        fetchTodos() // Refresh stats
      }
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!token || !confirm('Are you sure you want to delete this todo?')) return
    
    try {
      const response = await apiService.deletePersonalTodo(token, todoId)
      
      if (response.success) {
        setTodos(prev => prev.filter(todo => todo.id !== todoId))
        fetchTodos() // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleClearCompleted = async () => {
    if (!token || !confirm('Delete all completed todos?')) return
    
    try {
      const response = await apiService.deleteCompletedPersonalTodos(token)
      
      if (response.success) {
        setTodos(prev => prev.filter(todo => !todo.completed))
        fetchTodos() // Refresh stats
      }
    } catch (error) {
      console.error('Error clearing completed todos:', error)
    }
  }

  const addTag = () => {
    if (newTodo.tagInput.trim() && !newTodo.tags.includes(newTodo.tagInput.trim())) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewTodo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading todos...</span>
        </div>
      </Card>
    )
  }

  const filteredTodos = getFilteredTodos()

  return (
    <Card className="p-6 bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">📝</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Personal To Dos</h3>
            <p className="text-gray-500">
              {stats.pending} pending • {stats.completed} completed
              {stats.overdue > 0 && <span className="text-red-600"> • {stats.overdue} overdue</span>}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Todo</span>
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
          <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className="text-sm text-gray-600">Urgent</div>
        </div>
        <div className="bg-white/50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '📋 All', count: stats.total },
          { key: 'pending', label: '⏳ Pending', count: stats.pending },
          { key: 'completed', label: '✅ Completed', count: stats.completed },
          { key: 'high', label: '⚡ High Priority', count: stats.high },
          { key: 'urgent', label: '🚨 Urgent', count: stats.urgent }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-500 text-white'
                : 'bg-white/50 text-gray-700 hover:bg-white/80'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
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

      {/* Add Todo Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/70 rounded-lg border">
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Todo title..."
                value={newTodo.title}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">💭 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">⚡ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={newTodo.category}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <textarea
                placeholder="Description (optional)..."
                value={newTodo.description}
                onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Tags */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTodo.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTodo.tagInput}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Todo
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

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No todos found for the selected filter.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-500 hover:text-blue-600"
              >
                View all todos
              </button>
            )}
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div
              key={todo.id}
              className={`p-4 rounded-lg border transition-all ${
                todo.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white/70 border-gray-200 hover:bg-white/90'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      todo.completed ? 'text-green-700 line-through' : 'text-gray-800'
                    }`}>
                      {todo.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(todo.priority)}`}>
                        {getPriorityIcon(todo.priority)} {todo.priority}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {todo.description && (
                    <p className={`text-sm mt-1 ${
                      todo.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {todo.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {todo.category && (
                      <span>📁 {todo.category}</span>
                    )}
                    
                    {todo.dueDate && (
                      <span className={
                        isOverdue(todo.dueDate) && !todo.completed
                          ? 'text-red-600 font-medium'
                          : ''
                      }>
                        📅 {new Date(todo.dueDate).toLocaleDateString()}
                        {isOverdue(todo.dueDate) && !todo.completed && ' (Overdue)'}
                      </span>
                    )}
                    
                    {todo.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {todo.tags.map(tag => (
                          <span key={tag} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {todo.completedAt && (
                      <span className="text-green-600">
                        ✅ {new Date(todo.completedAt).toLocaleDateString()}
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

export default PersonalTodos