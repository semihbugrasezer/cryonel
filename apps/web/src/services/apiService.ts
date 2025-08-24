// apps/web/src/services/apiService.ts
import { authService } from './authService';
import {
    CEXApiKey,
    Trade,
    Strategy,
    Signal,
    Master,
    Follower,
    Alert,
    ConnectionHealth,
    PerformanceMetrics,
    RiskLimits,
    ApiResponse,
    PaginatedResponse
} from '../types';

const API_BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

class ApiService {
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const token = authService.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Try to refresh token
                    const refreshSuccess = await authService.refreshAccessToken();
                    if (refreshSuccess) {
                        // Retry the original request
                        const newToken = authService.getAccessToken();
                        if (newToken) {
                            headers['Authorization'] = `Bearer ${newToken}`;
                            const retryResponse = await fetch(url, {
                                ...options,
                                headers,
                            });

                            if (retryResponse.ok) {
                                return await retryResponse.json();
                            }
                        }
                    }
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network error occurred',
                },
            };
        }
    }

    // CEX API Key Management
    async getApiKeys(): Promise<ApiResponse<CEXApiKey[]>> {
        return this.makeRequest<CEXApiKey[]>('/keys');
    }

    async addApiKey(apiKey: Omit<CEXApiKey, 'id' | 'created_at'>): Promise<ApiResponse<CEXApiKey>> {
        return this.makeRequest<CEXApiKey>('/keys', {
            method: 'POST',
            body: JSON.stringify(apiKey),
        });
    }

    async updateApiKey(id: string, updates: Partial<CEXApiKey>): Promise<ApiResponse<CEXApiKey>> {
        return this.makeRequest<CEXApiKey>(`/keys/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteApiKey(id: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(`/keys/${id}`, {
            method: 'DELETE',
        });
    }

    async testApiKey(id: string): Promise<ApiResponse<{ status: string; latency: number }>> {
        return this.makeRequest<{ status: string; latency: number }>(`/keys/${id}/test`, {
            method: 'POST',
        });
    }

    // Trading Operations
    async getTrades(params?: {
        page?: number;
        limit?: number;
        from?: string;
        to?: string;
        venue?: string;
        symbol?: string;
    }): Promise<ApiResponse<PaginatedResponse<Trade>>> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.from) searchParams.append('from', params.from);
        if (params?.to) searchParams.append('to', params.to);
        if (params?.venue) searchParams.append('venue', params.venue);
        if (params?.symbol) searchParams.append('symbol', params.symbol);

        const queryString = searchParams.toString();
        const endpoint = `/trades${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<PaginatedResponse<Trade>>(endpoint);
    }

    async getTrade(id: string): Promise<ApiResponse<Trade>> {
        return this.makeRequest<Trade>(`/trades/${id}`);
    }

    async exportTrades(params?: {
        from?: string;
        to?: string;
        venue?: string;
        symbol?: string;
        format?: 'csv' | 'json';
    }): Promise<ApiResponse<{ downloadUrl: string }>> {
        const searchParams = new URLSearchParams();
        if (params?.from) searchParams.append('from', params.from);
        if (params?.to) searchParams.append('to', params.to);
        if (params?.venue) searchParams.append('venue', params.venue);
        if (params?.symbol) searchParams.append('symbol', params.symbol);
        if (params?.format) searchParams.append('format', params.format);

        const queryString = searchParams.toString();
        const endpoint = `/trades/export${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<{ downloadUrl: string }>(endpoint, {
            method: 'POST',
        });
    }

    // Strategy Management
    async getStrategies(): Promise<ApiResponse<Strategy[]>> {
        return this.makeRequest<Strategy[]>('/strategies');
    }

    async getStrategy(id: string): Promise<ApiResponse<Strategy>> {
        return this.makeRequest<Strategy>(`/strategies/${id}`);
    }

    async createStrategy(strategy: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Strategy>> {
        return this.makeRequest<Strategy>('/strategies', {
            method: 'POST',
            body: JSON.stringify(strategy),
        });
    }

    async updateStrategy(id: string, updates: Partial<Strategy>): Promise<ApiResponse<Strategy>> {
        return this.makeRequest<Strategy>(`/strategies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteStrategy(id: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(`/strategies/${id}`, {
            method: 'DELETE',
        });
    }

    async startStrategy(id: string): Promise<ApiResponse<{ status: string }>> {
        return this.makeRequest<{ status: string }>(`/strategies/${id}/start`, {
            method: 'POST',
        });
    }

    async stopStrategy(id: string): Promise<ApiResponse<{ status: string }>> {
        return this.makeRequest<{ status: string }>(`/strategies/${id}/stop`, {
            method: 'POST',
        });
    }

    // Copy Trading
    async getMasters(): Promise<ApiResponse<Master[]>> {
        return this.makeRequest<Master[]>('/copy-trading/masters');
    }

    async getMaster(id: string): Promise<ApiResponse<Master>> {
        return this.makeRequest<Master>(`/copy-trading/masters/${id}`);
    }

    async followMaster(masterId: string, allocation: number): Promise<ApiResponse<Follower>> {
        return this.makeRequest<Follower>('/copy-trading/follow', {
            method: 'POST',
            body: JSON.stringify({ masterId, allocation }),
        });
    }

    async unfollowMaster(masterId: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(`/copy-trading/unfollow/${masterId}`, {
            method: 'POST',
        });
    }

    async getFollowers(): Promise<ApiResponse<Follower[]>> {
        return this.makeRequest<Follower[]>('/copy-trading/followers');
    }

    // Alerts
    async getAlerts(): Promise<ApiResponse<Alert[]>> {
        return this.makeRequest<Alert[]>('/alerts');
    }

    async createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<ApiResponse<Alert>> {
        return this.makeRequest<Alert>('/alerts', {
            method: 'POST',
            body: JSON.stringify(alert),
        });
    }

    async updateAlert(id: string, updates: Partial<Alert>): Promise<ApiResponse<Alert>> {
        return this.makeRequest<Alert>(`/alerts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteAlert(id: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(`/alerts/${id}`, {
            method: 'DELETE',
        });
    }

    // System Health & Monitoring
    async getConnectionHealth(): Promise<ApiResponse<ConnectionHealth>> {
        return this.makeRequest<ConnectionHealth>('/health/connection');
    }

    async getPerformanceMetrics(params?: {
        from?: string;
        to?: string;
        strategy?: string;
    }): Promise<ApiResponse<PerformanceMetrics>> {
        const searchParams = new URLSearchParams();
        if (params?.from) searchParams.append('from', params.from);
        if (params?.to) searchParams.append('to', params.to);
        if (params?.strategy) searchParams.append('strategy', params.strategy);

        const queryString = searchParams.toString();
        const endpoint = `/performance${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<PerformanceMetrics>(endpoint);
    }

    async getRiskLimits(): Promise<ApiResponse<RiskLimits>> {
        return this.makeRequest<RiskLimits>('/risk/limits');
    }

    async updateRiskLimits(limits: Partial<RiskLimits>): Promise<ApiResponse<RiskLimits>> {
        return this.makeRequest<RiskLimits>('/risk/limits', {
            method: 'PUT',
            body: JSON.stringify(limits),
        });
    }

    // AI Features
    async getAIInsights(params: {
        type: 'ideas' | 'explain' | 'alerts';
        payload: Record<string, any>;
        model?: string;
        maxTokens?: number;
    }): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/ai/insights', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // User Settings
    async getUserProfile(): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/user/profile');
    }

    async updateUserProfile(updates: Record<string, any>): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async getBillingInfo(): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/user/billing');
    }

    async updateBillingInfo(updates: Record<string, any>): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/user/billing', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }
}

export const apiService = new ApiService();
export default apiService;
