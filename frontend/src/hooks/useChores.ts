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

    // Optimistic update - immediately update UI
    setChores(prev => prev.map(chore => 
      chore.id === choreId 
        ? { 
            ...chore, 
            isCompleted: !chore.isCompleted, 
            completedAt: !chore.isCompleted ? new Date().toISOString() : null 
          }
        : chore
    ));

    try {
      const response = await apiService.toggleChore(token, choreId);
      
      if (response.success) {
        // Update with server response (in case server data differs)
        setChores(prev => prev.map(chore => 
          chore.id === choreId 
            ? { ...chore, isCompleted: response.chore.isCompleted, completedAt: response.chore.completedAt }
            : chore
        ));
        return response.chore;
      } else {
        // Revert optimistic update on failure
        setChores(prev => prev.map(chore => 
          chore.id === choreId 
            ? { ...chore, isCompleted: !chore.isCompleted, completedAt: chore.completedAt }
            : chore
        ));
        throw new Error(response.message || 'Failed to toggle chore');
      }
    } catch (err) {
      // Revert optimistic update on error
      setChores(prev => prev.map(chore => 
        chore.id === choreId 
          ? { ...chore, isCompleted: !chore.isCompleted, completedAt: chore.completedAt }
          : chore
      ));
      
      const error = err instanceof Error ? err.message : 'Failed to toggle chore';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!token) throw new Error('No authentication token');

    // Store the chore in case we need to restore it
    const choreToDelete = chores.find(chore => chore.id === choreId);
    
    // Optimistic update - immediately remove from UI
    setChores(prev => prev.filter(chore => chore.id !== choreId));

    try {
      const response = await apiService.deleteChore(token, choreId);
      
      if (response.success) {
        console.log('Chore deleted successfully:', choreId);
        return true;
      } else {
        // Restore chore on failure
        if (choreToDelete) {
          setChores(prev => [choreToDelete, ...prev]);
        }
        throw new Error(response.message || 'Failed to delete chore');
      }
    } catch (err) {
      // Restore chore on error
      if (choreToDelete) {
        setChores(prev => [choreToDelete, ...prev]);
      }
      
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

  const clearCompletedChores = async () => {
    if (!token) throw new Error('No authentication token');

    const completedChores = chores.filter(chore => chore.isCompleted);
    if (completedChores.length === 0) return;

    // Optimistic update - remove completed chores immediately
    setChores(prev => prev.filter(chore => !chore.isCompleted));

    try {
      // Delete all completed chores
      const deletePromises = completedChores.map(chore => 
        apiService.deleteChore(token, chore.id)
      );
      
      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.success);
      
      if (failedDeletes.length > 0) {
        // Restore failed chores
        const failedChoreIds = failedDeletes.map((_, index) => completedChores[index]);
        setChores(prev => [...prev, ...failedChoreIds]);
        throw new Error(`Failed to delete ${failedDeletes.length} chore(s)`);
      }
      
      console.log(`Cleared ${completedChores.length} completed chores`);
      return true;
    } catch (err) {
      // Restore all completed chores on error
      setChores(prev => [...prev, ...completedChores]);
      
      const error = err instanceof Error ? err.message : 'Failed to clear completed chores';
      setError(error);
      throw new Error(error);
    }
  };

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
    clearCompletedChores,
    refreshChores: fetchChores,
  };
};