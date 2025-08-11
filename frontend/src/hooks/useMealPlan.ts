import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface MealPlan {
  id: string;
  title: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  scheduledDate: string;
  recipe: {
    ingredients: Array<{
      name: string;
      amount: string;
      unit?: string;
      notes?: string;
    }>;
    instructions: Array<{
      step: number;
      instruction: string;
      duration?: number;
    }>;
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    cuisine?: string;
    dietaryTags: string[];
    nutritionInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
    };
  };
  aiGenerated: boolean;
  aiPrompt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo: Array<{
    id: string;
    name: string;
  }>;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  completedAt?: string;
  completedBy?: {
    id: string;
    name: string;
  };
  rating?: number;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  totalTime: number;
  difficultyDisplay: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanStats {
  totalMeals: number;
  todaysMeals: number;
  thisWeekMeals: number;
  completedMeals: number;
  favoriteMeals: number;
  mealsByType: {
    [key: string]: number;
  };
}

export const useMealPlan = () => {
  const { token } = useAuth();
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<MealPlan[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<MealPlan[]>([]);
  const [stats, setStats] = useState<MealPlanStats>({
    totalMeals: 0,
    todaysMeals: 0,
    thisWeekMeals: 0,
    completedMeals: 0,
    favoriteMeals: 0,
    mealsByType: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    mealType?: string;
    status?: string;
  }) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getMealPlans(token, params);
      
      if (response.success) {
        setMeals(response.meals);
      } else {
        throw new Error(response.message || 'Failed to fetch meal plans');
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meal plans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTodaysMeals = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getTodaysMeals(token);
      
      if (response.success) {
        setTodaysMeals(response.meals);
      }
    } catch (err) {
      console.error('Error fetching today\'s meals:', err);
    }
  }, [token]);

  const fetchFavoriteMeals = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getFavoriteMeals(token);
      
      if (response.success) {
        setFavoriteMeals(response.meals);
      }
    } catch (err) {
      console.error('Error fetching favorite meals:', err);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getMealStats(token);
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error fetching meal stats:', err);
    }
  }, [token]);

  const generateAIMeal = async (mealData: {
    prompt: string;
    mealType: string;
    servings?: number;
    dietaryRestrictions?: string[];
    cuisine?: string;
    difficulty?: string;
    maxTime?: number;
    availableIngredients?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.generateAIMeal(token, mealData);
      
      if (response.success) {
        return response.meal;
      } else {
        throw new Error(response.message || 'Failed to generate AI meal');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to generate AI meal';
      setError(error);
      throw new Error(error);
    }
  };

  const generateAIWeeklyMeals = async (mealData: {
    prompt: string;
    servings?: number;
    dietaryRestrictions?: string[];
    cuisine?: string;
    difficulty?: string;
    maxTime?: number;
    availableIngredients?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.generateAIWeeklyMeals(token, mealData);
      
      if (response.success) {
        return response.meals;
      } else {
        throw new Error(response.message || 'Failed to generate AI weekly meals');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to generate AI weekly meals';
      setError(error);
      throw new Error(error);
    }
  };

  const createMealPlan = async (mealData: {
    title: string;
    description?: string;
    mealType: string;
    scheduledDate: string;
    recipe: {
      ingredients: Array<{
        name: string;
        amount: string;
        unit?: string;
        notes?: string;
      }>;
      instructions: Array<{
        step: number;
        instruction: string;
        duration?: number;
      }>;
      prepTime?: number;
      cookTime?: number;
      servings?: number;
      difficulty?: string;
      cuisine?: string;
      dietaryTags?: string[];
      nutritionInfo?: any;
    };
    assignedTo?: string[];
    notes?: string;
    tags?: string[];
    aiGenerated?: boolean;
    aiPrompt?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.createMealPlan(token, mealData);
      
      if (response.success) {
        // Add to local state immediately for optimistic UI
        setMeals(prev => [...prev, response.meal]);
        // Refresh related data
        fetchTodaysMeals();
        fetchStats();
        return response.meal;
      } else {
        throw new Error(response.message || 'Failed to create meal plan');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create meal plan';
      setError(error);
      throw new Error(error);
    }
  };

  const updateMealPlan = async (mealId: string, updates: {
    title?: string;
    description?: string;
    mealType?: string;
    scheduledDate?: string;
    recipe?: any;
    notes?: string;
    tags?: string[];
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.updateMealPlan(token, mealId, updates);
      
      if (response.success) {
        // Update local state immediately
        setMeals(prev => prev.map(meal => 
          meal.id === mealId ? { ...meal, ...response.meal } : meal
        ));
        // Refresh related data
        fetchTodaysMeals();
        fetchStats();
        return response.meal;
      } else {
        throw new Error(response.message || 'Failed to update meal plan');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update meal plan';
      setError(error);
      throw new Error(error);
    }
  };

  const completeMeal = async (mealId: string, rating?: number) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      setMeals(prev => prev.map(meal => 
        meal.id === mealId 
          ? { ...meal, status: 'completed' as const, rating, completedAt: new Date().toISOString() }
          : meal
      ));

      const response = await apiService.completeMeal(token, mealId, rating);
      
      if (response.success) {
        // Refresh related data
        fetchTodaysMeals();
        fetchStats();
        return response.meal;
      } else {
        // Revert optimistic update on failure
        setMeals(prev => prev.map(meal => 
          meal.id === mealId 
            ? { ...meal, status: 'planned' as const, rating: undefined, completedAt: undefined }
            : meal
        ));
        throw new Error(response.message || 'Failed to complete meal');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to complete meal';
      setError(error);
      throw new Error(error);
    }
  };

  const toggleFavorite = async (mealId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      const originalMeal = meals.find(meal => meal.id === mealId);
      const newFavoriteStatus = !originalMeal?.isFavorite;
      
      setMeals(prev => prev.map(meal => 
        meal.id === mealId ? { ...meal, isFavorite: newFavoriteStatus } : meal
      ));

      const response = await apiService.toggleMealFavorite(token, mealId);
      
      if (response.success) {
        // Refresh favorite meals
        fetchFavoriteMeals();
        fetchStats();
        return response.meal;
      } else {
        // Revert optimistic update on failure
        setMeals(prev => prev.map(meal => 
          meal.id === mealId ? { ...meal, isFavorite: !newFavoriteStatus } : meal
        ));
        throw new Error(response.message || 'Failed to toggle favorite');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteMealPlan = async (mealId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      const mealToRemove = meals.find(meal => meal.id === mealId);
      setMeals(prev => prev.filter(meal => meal.id !== mealId));

      const response = await apiService.deleteMealPlan(token, mealId);
      
      if (response.success) {
        // Refresh related data
        fetchTodaysMeals();
        fetchStats();
        return true;
      } else {
        // Revert optimistic update on failure
        if (mealToRemove) {
          setMeals(prev => [...prev, mealToRemove]);
        }
        throw new Error(response.message || 'Failed to delete meal plan');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete meal plan';
      setError(error);
      throw new Error(error);
    }
  };

  const getShoppingList = async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.getMealShoppingList(token, params);
      
      if (response.success) {
        return response.shoppingList;
      } else {
        throw new Error(response.message || 'Failed to generate shopping list');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to generate shopping list';
      setError(error);
      throw new Error(error);
    }
  };

  // Helper functions
  const getMealsByType = useCallback((mealType: string) => {
    return meals.filter(meal => meal.mealType === mealType);
  }, [meals]);

  const getMealsByDate = useCallback((date: string) => {
    return meals.filter(meal => meal.scheduledDate.startsWith(date));
  }, [meals]);

  const getMealsByDateRange = useCallback((startDate: string, endDate: string) => {
    return meals.filter(meal => {
      const mealDate = new Date(meal.scheduledDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return mealDate >= start && mealDate <= end;
    });
  }, [meals]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchMeals();
      fetchTodaysMeals();
      fetchFavoriteMeals();
      fetchStats();
    }
  }, [token, fetchMeals, fetchTodaysMeals, fetchFavoriteMeals, fetchStats]);

  return {
    meals,
    todaysMeals,
    favoriteMeals,
    stats,
    loading,
    error,
    generateAIMeal,
    generateAIWeeklyMeals,
    createMealPlan,
    updateMealPlan,
    completeMeal,
    toggleFavorite,
    deleteMealPlan,
    getShoppingList,
    fetchMeals,
    getMealsByType,
    getMealsByDate,
    getMealsByDateRange,
    refreshMeals: fetchMeals,
    refreshTodaysMeals: fetchTodaysMeals,
    refreshFavorites: fetchFavoriteMeals,
    refreshStats: fetchStats,
  };
};