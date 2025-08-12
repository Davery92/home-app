// API Service Layer for Frontend-Backend Communication

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL 
  : `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001/api`;

class ApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Family Members API
  async getFamilyMembers(token: string) {
    const response = await fetch(`${API_BASE_URL}/family-members`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createFamilyMember(token: string, memberData: {
    name: string;
    avatar: string;
    color: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/family-members`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(memberData),
    });
    return this.handleResponse(response);
  }

  async updateFamilyMember(token: string, memberId: string, updates: {
    name?: string;
    avatar?: string;
    color?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteFamilyMember(token: string, memberId: string) {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async clearMemberPoints(token: string, memberId: string) {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}/clear-points`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async clearAllFamilyPoints(token: string) {
    const response = await fetch(`${API_BASE_URL}/family-members/clear-all-points`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Calendar API
  async getCalendarEvents(token: string, params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    assignedTo?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);

    const response = await fetch(`${API_BASE_URL}/calendar?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getTodayEvents(token: string) {
    const response = await fetch(`${API_BASE_URL}/calendar/today`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getUpcomingEvents(token: string, days?: number) {
    const queryParams = new URLSearchParams();
    if (days) queryParams.append('days', days.toString());

    const response = await fetch(`${API_BASE_URL}/calendar/upcoming?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createCalendarEvent(token: string, eventData: {
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
  }) {
    const response = await fetch(`${API_BASE_URL}/calendar`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(eventData),
    });
    return this.handleResponse(response);
  }

  async updateCalendarEvent(token: string, eventId: string, updates: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    allDay?: boolean;
    location?: string;
    category?: string;
    priority?: string;
    color?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async completeCalendarEvent(token: string, eventId: string) {
    const response = await fetch(`${API_BASE_URL}/calendar/${eventId}/complete`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteCalendarEvent(token: string, eventId: string) {
    const response = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getCalendarStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/calendar/stats`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Grocery API
  async getGroceryItems(token: string, params?: {
    category?: string;
    isPurchased?: boolean;
    priority?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isPurchased !== undefined) queryParams.append('isPurchased', params.isPurchased.toString());
    if (params?.priority) queryParams.append('priority', params.priority);

    const response = await fetch(`${API_BASE_URL}/grocery?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getActiveGroceryItems(token: string) {
    const response = await fetch(`${API_BASE_URL}/grocery/active`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getPurchasedGroceryItems(token: string, days?: number) {
    const queryParams = new URLSearchParams();
    if (days) queryParams.append('days', days.toString());

    const response = await fetch(`${API_BASE_URL}/grocery/purchased?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createGroceryItem(token: string, itemData: {
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
    priority?: string;
    notes?: string;
    brand?: string;
    store?: string;
    estimatedPrice?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/grocery`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(itemData),
    });
    return this.handleResponse(response);
  }

  async updateGroceryItem(token: string, itemId: string, updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    priority?: string;
    notes?: string;
    brand?: string;
    store?: string;
    estimatedPrice?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/grocery/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async purchaseGroceryItem(token: string, itemId: string, actualPrice?: number) {
    const response = await fetch(`${API_BASE_URL}/grocery/${itemId}/purchase`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ actualPrice }),
    });
    return this.handleResponse(response);
  }

  async unpurchaseGroceryItem(token: string, itemId: string) {
    const response = await fetch(`${API_BASE_URL}/grocery/${itemId}/unpurchase`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteGroceryItem(token: string, itemId: string) {
    const response = await fetch(`${API_BASE_URL}/grocery/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async clearPurchasedGroceryItems(token: string) {
    const response = await fetch(`${API_BASE_URL}/grocery/purchased/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getGroceryStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/grocery/stats`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Chores API
  async getChores(token: string) {
    const response = await fetch(`${API_BASE_URL}/chores`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createChore(token: string, choreData: {
    title: string;
    description?: string;
    points: number;
    assignedTo: string;
    assignedToType: 'user' | 'member';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other';
  }) {
    const response = await fetch(`${API_BASE_URL}/chores`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(choreData),
    });
    return this.handleResponse(response);
  }

  async updateChore(token: string, choreId: string, updates: {
    title?: string;
    description?: string;
    points?: number;
    assignedTo?: string;
    assignedToType?: 'user' | 'member';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: 'cleaning' | 'kitchen' | 'yard' | 'pets' | 'personal' | 'other';
  }) {
    const response = await fetch(`${API_BASE_URL}/chores/${choreId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async toggleChore(token: string, choreId: string) {
    const response = await fetch(`${API_BASE_URL}/chores/${choreId}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteChore(token: string, choreId: string) {
    const response = await fetch(`${API_BASE_URL}/chores/${choreId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Auth API (existing functionality)
  async getCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  // Meals API
  async getMealPlans(token: string, params?: {
    startDate?: string;
    endDate?: string;
    mealType?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.mealType) queryParams.append('mealType', params.mealType);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/meals?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getTodaysMeals(token: string) {
    const response = await fetch(`${API_BASE_URL}/meals/today`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getFavoriteMeals(token: string) {
    const response = await fetch(`${API_BASE_URL}/meals/favorites`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async generateAIMeal(token: string, mealData: {
    prompt: string;
    mealType: string;
    servings?: number;
    dietaryRestrictions?: string[];
    cuisine?: string;
    difficulty?: string;
    maxTime?: number;
    availableIngredients?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/meals/ai-generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(mealData),
    });
    return this.handleResponse(response);
  }

  async generateAIWeeklyMeals(token: string, mealData: {
    prompt: string;
    servings?: number;
    dietaryRestrictions?: string[];
    cuisine?: string;
    difficulty?: string;
    maxTime?: number;
    availableIngredients?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/meals/ai-generate-weekly`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(mealData),
    });
    return this.handleResponse(response);
  }

  async createMealPlan(token: string, mealData: {
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
  }) {
    const response = await fetch(`${API_BASE_URL}/meals`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(mealData),
    });
    return this.handleResponse(response);
  }

  async updateMealPlan(token: string, mealId: string, updates: {
    title?: string;
    description?: string;
    mealType?: string;
    scheduledDate?: string;
    recipe?: any;
    notes?: string;
    tags?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async completeMeal(token: string, mealId: string, rating?: number) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/complete`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ rating }),
    });
    return this.handleResponse(response);
  }

  async toggleMealFavorite(token: string, mealId: string) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}/favorite`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteMealPlan(token: string, mealId: string) {
    const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getMealStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/meals/stats`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getMealShoppingList(token: string, params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/meals/shopping-list?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Personal Todo API methods
  async getPersonalTodos(token: string, params?: {
    completed?: boolean;
    priority?: string;
    category?: string;
    limit?: number;
    skip?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const response = await fetch(`${API_BASE_URL}/todos?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPersonalTodo(token: string, todoData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    dueDate?: string;
    tags?: string[];
    order?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(todoData),
    });
    return this.handleResponse(response);
  }

  async updatePersonalTodo(token: string, todoId: string, updates: {
    title?: string;
    description?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    dueDate?: string;
    tags?: string[];
    order?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deletePersonalTodo(token: string, todoId: string) {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async togglePersonalTodo(token: string, todoId: string) {
    const response = await fetch(`${API_BASE_URL}/todos/${todoId}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async bulkCompletePersonalTodos(token: string, todoIds: string[]) {
    const response = await fetch(`${API_BASE_URL}/todos/bulk/complete`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ todoIds }),
    });
    return this.handleResponse(response);
  }

  async deleteCompletedPersonalTodos(token: string) {
    const response = await fetch(`${API_BASE_URL}/todos/bulk/completed`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Cleaning Tasks API
  async getCleaningTasks(token: string, params?: {
    room?: string;
    category?: string;
    completed?: boolean;
    assignedTo?: string;
    limit?: number;
    skip?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.room) queryParams.append('room', params.room);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const response = await fetch(`${API_BASE_URL}/cleaning?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createCleaningTask(token: string, taskData: {
    title: string;
    description?: string;
    assignedTo: string;
    assignedToType: 'user' | 'member';
    assignedToName: string;
    room?: string;
    category?: string;
    priority?: string;
    estimatedMinutes?: number;
    dueDate?: string;
    recurring?: {
      enabled: boolean;
      frequency?: string;
    };
    supplies?: Array<{
      name: string;
      optional?: boolean;
    }>;
  }) {
    const response = await fetch(`${API_BASE_URL}/cleaning`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(taskData),
    });
    return this.handleResponse(response);
  }

  async updateCleaningTask(token: string, taskId: string, updates: {
    title?: string;
    description?: string;
    assignedTo?: string;
    assignedToType?: 'user' | 'member';
    assignedToName?: string;
    room?: string;
    category?: string;
    priority?: string;
    estimatedMinutes?: number;
    dueDate?: string;
    completed?: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/cleaning/${taskId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async toggleCleaningTask(token: string, taskId: string) {
    const response = await fetch(`${API_BASE_URL}/cleaning/${taskId}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteCleaningTask(token: string, taskId: string) {
    const response = await fetch(`${API_BASE_URL}/cleaning/${taskId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async clearCompletedCleaningTasks(token: string) {
    const response = await fetch(`${API_BASE_URL}/cleaning/completed`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Personal Reminders API
  async getPersonalReminders(token: string, params?: {
    type?: string;
    priority?: string;
    completed?: boolean;
    upcoming?: boolean;
    overdue?: boolean;
    category?: string;
    limit?: number;
    skip?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    if (params?.upcoming !== undefined) queryParams.append('upcoming', params.upcoming.toString());
    if (params?.overdue !== undefined) queryParams.append('overdue', params.overdue.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const response = await fetch(`${API_BASE_URL}/personal-reminders?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPersonalReminder(token: string, reminderData: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    dueDate: string;
    reminderTime: string;
    allDay?: boolean;
    recurring?: {
      enabled: boolean;
      frequency?: string;
      interval?: number;
      endDate?: string;
    };
    notifications?: {
      enabled: boolean;
      methods?: string[];
      advance?: Array<{
        value: number;
        unit: string;
      }>;
    };
    location?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    tags?: string[];
    category?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(reminderData),
    });
    return this.handleResponse(response);
  }

  async updatePersonalReminder(token: string, reminderId: string, updates: {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    dueDate?: string;
    reminderTime?: string;
    completed?: boolean;
    allDay?: boolean;
    location?: string;
    tags?: string[];
    category?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders/${reminderId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async togglePersonalReminder(token: string, reminderId: string) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders/${reminderId}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async snoozePersonalReminder(token: string, reminderId: string, minutes?: number) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders/${reminderId}/snooze`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ minutes }),
    });
    return this.handleResponse(response);
  }

  async deletePersonalReminder(token: string, reminderId: string) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders/${reminderId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async clearCompletedPersonalReminders(token: string) {
    const response = await fetch(`${API_BASE_URL}/personal-reminders/completed`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Pet Care API
  async getPets(token: string) {
    const response = await fetch(`${API_BASE_URL}/pets`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPet(token: string, petData: {
    name: string;
    type: string;
    breed?: string;
    birthDate?: string;
    gender?: string;
    spayedNeutered?: boolean;
    weight?: {
      value?: number;
      unit?: string;
    };
    veterinarian?: {
      name?: string;
      clinic?: string;
      phone?: string;
      email?: string;
      address?: string;
    };
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(petData),
    });
    return this.handleResponse(response);
  }

  async updatePet(token: string, petId: string, updates: {
    name?: string;
    breed?: string;
    birthDate?: string;
    gender?: string;
    spayedNeutered?: boolean;
    weight?: {
      value?: number;
      unit?: string;
    };
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deletePet(token: string, petId: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getPetVaccines(token: string, petId: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/vaccines`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPetVaccine(token: string, petId: string, vaccineData: {
    vaccineName: string;
    vaccineType: string;
    administeredDate: string;
    expirationDate: string;
    nextDueDate: string;
    veterinarian?: {
      name?: string;
      clinic?: string;
      phone?: string;
      licenseNumber?: string;
    };
    batchLotNumber?: string;
    manufacturer?: string;
    isCore?: boolean;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/vaccines`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(vaccineData),
    });
    return this.handleResponse(response);
  }

  async updatePetVaccine(token: string, petId: string, vaccineId: string, updates: {
    vaccineName?: string;
    administeredDate?: string;
    expirationDate?: string;
    nextDueDate?: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/vaccines/${vaccineId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deletePetVaccine(token: string, petId: string, vaccineId: string) {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}/vaccines/${vaccineId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getUpcomingVaccines(token: string, days?: number) {
    const queryParams = new URLSearchParams();
    if (days) queryParams.append('days', days.toString());

    const response = await fetch(`${API_BASE_URL}/pets/vaccines/upcoming?${queryParams}`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getOverdueVaccines(token: string) {
    const response = await fetch(`${API_BASE_URL}/pets/vaccines/overdue`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getVaccineStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/pets/vaccines/stats`, {
      headers: this.getAuthHeaders(token),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
export default apiService;