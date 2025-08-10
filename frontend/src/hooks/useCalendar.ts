import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  category: string;
  priority: string;
  color: string;
  assignedTo: Array<{
    memberId: string;
    memberType: 'user' | 'familyMember';
    name: string;
  }>;
  recurring?: {
    enabled: boolean;
    frequency?: string;
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
    monthlyType?: string;
  };
  reminders?: Array<{
    type: string;
    time: number;
    sent: boolean;
  }>;
  isCompleted: boolean;
  completedAt?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useCalendar = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    monthlyEvents: 0,
    todayEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    completionRate: 0
  });

  const fetchEvents = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    assignedTo?: string;
  }) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCalendarEvents(token, params);
      
      if (response.success) {
        setEvents(response.events);
      } else {
        throw new Error(response.message || 'Failed to fetch calendar events');
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTodayEvents = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getTodayEvents(token);
      
      if (response.success) {
        setTodayEvents(response.events);
      }
    } catch (err) {
      console.error('Error fetching today events:', err);
    }
  }, [token]);

  const fetchUpcomingEvents = useCallback(async (days?: number) => {
    if (!token) return;

    try {
      const response = await apiService.getUpcomingEvents(token, days);
      
      if (response.success) {
        setUpcomingEvents(response.events);
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiService.getCalendarStats(token);
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error fetching calendar stats:', err);
    }
  }, [token]);

  const addEvent = async (eventData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    location?: string;
    category?: string;
    priority?: string;
    color?: string;
    assignedTo?: Array<{
      memberId: string;
      memberType: 'user' | 'familyMember';
      name: string;
    }>;
    recurring?: any;
    reminders?: any[];
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.createCalendarEvent(token, eventData);
      
      if (response.success) {
        // Add to local state immediately for optimistic UI
        setEvents(prev => [...prev, response.event]);
        // Refresh related data
        fetchTodayEvents();
        fetchUpcomingEvents();
        fetchStats();
        return response.event;
      } else {
        throw new Error(response.message || 'Failed to create calendar event');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add calendar event';
      setError(error);
      throw new Error(error);
    }
  };

  const updateEvent = async (eventId: string, updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    allDay?: boolean;
    location?: string;
    category?: string;
    priority?: string;
    color?: string;
  }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await apiService.updateCalendarEvent(token, eventId, updates);
      
      if (response.success) {
        // Update local state immediately
        setEvents(prev => prev.map(event => 
          event.id === eventId ? { ...event, ...response.event } : event
        ));
        // Refresh related data
        fetchTodayEvents();
        fetchUpcomingEvents();
        return response.event;
      } else {
        throw new Error(response.message || 'Failed to update calendar event');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update calendar event';
      setError(error);
      throw new Error(error);
    }
  };

  const completeEvent = async (eventId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, isCompleted: true, completedAt: new Date().toISOString() }
          : event
      ));

      const response = await apiService.completeCalendarEvent(token, eventId);
      
      if (response.success) {
        // Refresh stats
        fetchStats();
        return response.event;
      } else {
        // Revert optimistic update on failure
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, isCompleted: false, completedAt: undefined }
            : event
        ));
        throw new Error(response.message || 'Failed to complete calendar event');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to complete calendar event';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      // Optimistic update
      const eventToRemove = events.find(event => event.id === eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));

      const response = await apiService.deleteCalendarEvent(token, eventId);
      
      if (response.success) {
        // Refresh related data
        fetchTodayEvents();
        fetchUpcomingEvents();
        fetchStats();
        return true;
      } else {
        // Revert optimistic update on failure
        if (eventToRemove) {
          setEvents(prev => [...prev, eventToRemove]);
        }
        throw new Error(response.message || 'Failed to delete calendar event');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete calendar event';
      setError(error);
      throw new Error(error);
    }
  };

  // Get events for a specific month
  const getEventsForMonth = useCallback((year: number, month: number) => {
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    
    return fetchEvents({
      startDate: startOfMonth,
      endDate: endOfMonth
    });
  }, [fetchEvents]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      return (eventStart >= dateStart && eventStart <= dateEnd) ||
             (eventEnd >= dateStart && eventEnd <= dateEnd) ||
             (eventStart <= dateStart && eventEnd >= dateEnd);
    });
  }, [events]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchTodayEvents();
      fetchUpcomingEvents();
      fetchStats();
    }
  }, [token, fetchEvents, fetchTodayEvents, fetchUpcomingEvents, fetchStats]);

  return {
    events,
    todayEvents,
    upcomingEvents,
    stats,
    loading,
    error,
    addEvent,
    updateEvent,
    completeEvent,
    deleteEvent,
    fetchEvents,
    getEventsForMonth,
    getEventsForDate,
    refreshEvents: fetchEvents,
    refreshTodayEvents: fetchTodayEvents,
    refreshUpcomingEvents: fetchUpcomingEvents,
    refreshStats: fetchStats,
  };
};