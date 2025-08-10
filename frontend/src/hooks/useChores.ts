import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Chore {
  id: string;
  title: string;
  description?: string;
  points: number;
  isCompleted: boolean;
  assignedTo: string;
  assignedBy: string;
  dueDate?: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other';
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastReset?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const useChores = () => {
  const { token } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChores = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getChores(token);
      
      if (response.success) {
        setChores(response.chores);
      } else {
        throw new Error(response.message || 'Failed to fetch chores');
      }
    } catch (err) {
      console.error('Error fetching chores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chores');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addChore = async (choreData: {
    title: string;
    description?: string;
    points: number;
    assignedTo: string;
    assignedToType: 'user' | 'member';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other';
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.createChore(token, choreData);
      
      if (response.success) {
        setChores(prev => [response.chore, ...prev]);
        return response.chore;
      } else {
        throw new Error(response.message || 'Failed to create chore');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add chore';
      setError(error);
      throw new Error(error);
    }
  };

  const updateChore = async (choreId: string, updates: {
    title?: string;
    description?: string;
    points?: number;
    assignedTo?: string;
    assignedToType?: 'user' | 'member';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other';
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.updateChore(token, choreId, updates);
      
      if (response.success) {
        setChores(prev => prev.map(chore => 
          chore.id === choreId ? { ...chore, ...response.chore } : chore
        ));
        return response.chore;
      } else {
        throw new Error(response.message || 'Failed to update chore');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update chore';
      setError(error);
      throw new Error(error);
    }
  };

  const toggleChore = async (choreId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.toggleChore(token, choreId);
      
      if (response.success) {
        setChores(prev => prev.map(chore => 
          chore.id === choreId 
            ? { ...chore, isCompleted: response.chore.isCompleted, completedAt: response.chore.completedAt }
            : chore
        ));
        return response.chore;
      } else {
        throw new Error(response.message || 'Failed to toggle chore');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to toggle chore';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.deleteChore(token, choreId);
      
      if (response.success) {
        setChores(prev => prev.filter(chore => chore.id !== choreId));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete chore');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete chore';
      setError(error);
      throw new Error(error);
    }
  };

  // Fetch chores on mount
  useEffect(() => {
    fetchChores();
  }, [fetchChores]);

  // Computed values
  const completedToday = chores.filter(chore => chore.isCompleted).length;
  const totalChores = chores.length;
  const completionRate = totalChores > 0 ? Math.round((completedToday / totalChores) * 100) : 0;

  return {
    chores,
    loading,
    error,
    completedToday,
    totalChores,
    completionRate,
    addChore,
    updateChore,
    toggleChore,
    deleteChore,
    refreshChores: fetchChores,
  };
};