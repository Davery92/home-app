import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  completedToday: number;
  color: string;
  hasAccount?: boolean;
  role?: string;
  joinedAt?: string;
  createdAt?: string;
}

export const useFamilyMembers = () => {
  const { token, user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFamilyMembers(token);
      
      if (response.success) {
        setMembers(response.members);
      } else {
        throw new Error(response.message || 'Failed to fetch family members');
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch family members');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addMember = async (memberData: {
    name: string;
    avatar: string;
    color: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.createFamilyMember(token, memberData);
      
      if (response.success) {
        setMembers(prev => [...prev, response.member]);
        return response.member;
      } else {
        throw new Error(response.message || 'Failed to create family member');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add family member';
      setError(error);
      throw new Error(error);
    }
  };

  const updateMember = async (memberId: string, updates: {
    name?: string;
    avatar?: string;
    color?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.updateFamilyMember(token, memberId, updates);
      
      if (response.success) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, ...response.member } : member
        ));
        return response.member;
      } else {
        throw new Error(response.message || 'Failed to update family member');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update family member';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.deleteFamilyMember(token, memberId);
      
      if (response.success) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete family member');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete family member';
      setError(error);
      throw new Error(error);
    }
  };

  // Note: Current user is automatically included by the backend API as an account holder

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const clearMemberPoints = async (memberId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.clearMemberPoints(token, memberId);
      
      if (response.success) {
        // Update local state immediately
        setMembers(prev => prev.map(member =>
          member.id === memberId 
            ? { ...member, totalPoints: 0, completedToday: 0 }
            : member
        ));
        return response;
      } else {
        throw new Error(response.message || 'Failed to clear member points');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to clear member points';
      setError(error);
      throw new Error(error);
    }
  };

  const clearAllFamilyPoints = async () => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.clearAllFamilyPoints(token);
      
      if (response.success) {
        // Clear all points in local state immediately
        setMembers(prev => prev.map(member => ({
          ...member,
          totalPoints: 0,
          completedToday: 0
        })));
        return response;
      } else {
        throw new Error(response.message || 'Failed to clear all family points');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to clear all family points';
      setError(error);
      throw new Error(error);
    }
  };

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    clearMemberPoints,
    clearAllFamilyPoints,
    refreshMembers: fetchMembers,
  };
};