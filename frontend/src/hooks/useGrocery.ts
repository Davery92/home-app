import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  priority: string;
  notes?: string;
  brand?: string;
  store?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  isPurchased: boolean;
  purchasedAt?: string;
  purchasedBy?: {
    id: string;
    name: string;
  };
  addedBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GroupedGroceryItems {
  [category: string]: GroceryItem[];
}

export const useGrocery = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [activeItems, setActiveItems] = useState<GroupedGroceryItems>({});
  const [purchasedItems, setPurchasedItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    purchasedItems: 0,
    activeCategories: 0,
    estimatedCost: 0,
    totalSpent: 0
  });

  const fetchItems = useCallback(async (params?: {
    category?: string;
    isPurchased?: boolean;
    priority?: string;
  }) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getGroceryItems(token, params);
      
      if (response.success) {
        setItems(response.items);
      } else {
        throw new Error(response.message || 'Failed to fetch grocery items');
      }
    } catch (err) {
      console.error('Error fetching grocery items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grocery items');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchActiveItems = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getActiveGroceryItems(token);
      
      if (response.success) {
        setActiveItems(response.items);
      }
    } catch (err) {
      console.error('Error fetching active items:', err);
    }
  }, [token]);

  const fetchPurchasedItems = useCallback(async (days?: number) => {
    if (!token) return;

    try {
      const response = await apiService.getPurchasedGroceryItems(token, days);
      
      if (response.success) {
        setPurchasedItems(response.items);
      }
    } catch (err) {
      console.error('Error fetching purchased items:', err);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getGroceryStats(token);
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error fetching grocery stats:', err);
    }
  }, [token]);

  const addItem = async (itemData: {
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
    priority?: string;
    notes?: string;
    brand?: string;
    store?: string;
    estimatedPrice?: number;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.createGroceryItem(token, itemData);
      
      if (response.success) {
        // Add to local state immediately for optimistic UI
        setItems(prev => [...prev, response.item]);
        // Refresh related data
        fetchActiveItems();
        fetchStats();
        return response.item;
      } else {
        throw new Error(response.message || 'Failed to create grocery item');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add grocery item';
      setError(error);
      throw new Error(error);
    }
  };

  const updateItem = async (itemId: string, updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    priority?: string;
    notes?: string;
    brand?: string;
    store?: string;
    estimatedPrice?: number;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.updateGroceryItem(token, itemId, updates);
      
      if (response.success) {
        // Update local state immediately
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...response.item } : item
        ));
        // Refresh related data
        fetchActiveItems();
        fetchStats();
        return response.item;
      } else {
        throw new Error(response.message || 'Failed to update grocery item');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update grocery item';
      setError(error);
      throw new Error(error);
    }
  };

  const purchaseItem = async (itemId: string, actualPrice?: number) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, isPurchased: true, actualPrice, purchasedAt: new Date().toISOString() }
          : item
      ));

      const response = await apiService.purchaseGroceryItem(token, itemId, actualPrice);
      
      if (response.success) {
        // Refresh related data
        fetchActiveItems();
        fetchPurchasedItems();
        fetchStats();
        return response.item;
      } else {
        // Revert optimistic update on failure
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, isPurchased: false, actualPrice: undefined, purchasedAt: undefined }
            : item
        ));
        throw new Error(response.message || 'Failed to purchase grocery item');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to purchase grocery item';
      setError(error);
      throw new Error(error);
    }
  };

  const unpurchaseItem = async (itemId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, isPurchased: false, actualPrice: undefined, purchasedAt: undefined }
          : item
      ));

      const response = await apiService.unpurchaseGroceryItem(token, itemId);
      
      if (response.success) {
        // Refresh related data
        fetchActiveItems();
        fetchPurchasedItems();
        fetchStats();
        return response.item;
      } else {
        // Revert optimistic update on failure
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, isPurchased: true }
            : item
        ));
        throw new Error(response.message || 'Failed to unpurchase grocery item');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unpurchase grocery item';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      const itemToRemove = items.find(item => item.id === itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));

      const response = await apiService.deleteGroceryItem(token, itemId);
      
      if (response.success) {
        // Refresh related data
        fetchActiveItems();
        fetchStats();
        return true;
      } else {
        // Revert optimistic update on failure
        if (itemToRemove) {
          setItems(prev => [...prev, itemToRemove]);
        }
        throw new Error(response.message || 'Failed to delete grocery item');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete grocery item';
      setError(error);
      throw new Error(error);
    }
  };

  const clearPurchasedItems = async () => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.clearPurchasedGroceryItems(token);
      
      if (response.success) {
        // Update local state
        setItems(prev => prev.filter(item => !item.isPurchased));
        setPurchasedItems([]);
        // Refresh stats
        fetchStats();
        return response.itemsCleared;
      } else {
        throw new Error(response.message || 'Failed to clear purchased items');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to clear purchased items';
      setError(error);
      throw new Error(error);
    }
  };

  // Helper function to get items by category
  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category && !item.isPurchased);
  }, [items]);

  // Helper function to get total estimated cost
  const getTotalEstimatedCost = useCallback(() => {
    return items
      .filter(item => !item.isPurchased && item.estimatedPrice)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  }, [items]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchItems();
      fetchActiveItems();
      fetchPurchasedItems();
      fetchStats();
    }
  }, [token, fetchItems, fetchActiveItems, fetchPurchasedItems, fetchStats]);

  return {
    items,
    activeItems,
    purchasedItems,
    stats,
    loading,
    error,
    addItem,
    updateItem,
    purchaseItem,
    unpurchaseItem,
    deleteItem,
    clearPurchasedItems,
    fetchItems,
    getItemsByCategory,
    getTotalEstimatedCost,
    refreshItems: fetchItems,
    refreshActiveItems: fetchActiveItems,
    refreshPurchasedItems: fetchPurchasedItems,
    refreshStats: fetchStats,
  };
};