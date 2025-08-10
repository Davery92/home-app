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
}

export const apiService = new ApiService();
export default apiService;