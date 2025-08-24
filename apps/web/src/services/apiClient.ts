import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

interface RequestConfig extends RequestInit {
  retries?: number;
  backoff?: number;
}

class ApiClient {
  private baseURL: string;
  private retries: number;
  private backoff: number;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    this.retries = 3;
    this.backoff = 1000;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getAuthHeaders(): HeadersInit {
    const { tokens } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        useUIStore.getState().addNotification({
          type: 'warning',
          title: 'Rate Limited',
          message: `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
          duration: waitTime,
        });
        
        await this.delay(waitTime);
        throw new Error('Rate limited');
      }

      // Handle authentication errors
      if (response.status === 401) {
        useAuthStore.getState().logout();
        useUIStore.getState().addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Your session has expired. Please log in again.',
        });
        throw new Error('Unauthorized');
      }

      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async requestWithRetry<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...config,
        headers: {
          ...this.getAuthHeaders(),
          ...config.headers,
        },
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (attempt < (config.retries || this.retries) && error instanceof Error) {
        const waitTime = (config.backoff || this.backoff) * Math.pow(2, attempt - 1);
        
        console.warn(`Request failed, retrying in ${waitTime}ms...`, error);
        await this.delay(waitTime);
        
        return this.requestWithRetry<T>(url, config, attempt + 1);
      }
      
      throw error;
    }
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(url, {
      method: 'GET',
      ...config,
    });
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(url, {
      method: 'DELETE',
      ...config,
    });
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error(`Health check failed: ${response.status}`);
    } catch (error) {
      throw new Error(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
