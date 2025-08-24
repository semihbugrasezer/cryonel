// apps/web/src/services/authService.ts
import { LoginCredentials, RegisterData, User, AuthTokens, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class AuthService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        // Load tokens from localStorage on initialization
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');

        // If no refresh token in localStorage, try to get from cookies
        if (!this.refreshToken) {
            this.refreshToken = this.getRefreshTokenFromCookie();
        }
    }

    getRefreshTokenFromCookie(): string | null {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'refreshToken') {
                return value;
            }
        }
        return null;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                if (response.status === 401 && this.refreshToken) {
                    // Try to refresh token
                    const refreshSuccess = await this.refreshAccessToken();
                    if (refreshSuccess) {
                        // Retry the original request
                        headers['Authorization'] = `Bearer ${this.accessToken}`;
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers,
                        });

                        if (retryResponse.ok) {
                            return await retryResponse.json();
                        }
                    }
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data,
            };
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

    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
        const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.success && response.data) {
            this.setTokens(response.data.tokens);
        }

        return response;
    }

    async register(userData: RegisterData): Promise<ApiResponse<{ user: User }>> {
        const response = await this.makeRequest<{ user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        // Registration successful but no auto-login
        // Frontend will handle manual login after registration
        return response;
    }

    async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.tokens) {
                    this.setTokens(data.tokens);
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
        }

        // If refresh fails, clear tokens
        this.clearTokens();
        return false;
    }

    async logout(): Promise<void> {
        if (this.refreshToken) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
        }

        this.clearTokens();
    }

    async getCurrentUser(): Promise<ApiResponse<User>> {
        return this.makeRequest<User>('/auth/me');
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    async enable2FA(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
        return this.makeRequest<{ qrCode: string; secret: string }>('/auth/2fa/enable', {
            method: 'POST',
        });
    }

    async verify2FA(code: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>('/auth/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async disable2FA(code: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>('/auth/2fa/disable', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    setTokens(tokens: AuthTokens): void {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;

        // Store access token in localStorage
        if (tokens.accessToken) {
            localStorage.setItem('accessToken', tokens.accessToken);
        }

        // Note: refresh token is stored in httpOnly cookie by backend
        // We don't store it in localStorage for security
    }

    private clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }
}

export const authService = new AuthService();
export default authService;
