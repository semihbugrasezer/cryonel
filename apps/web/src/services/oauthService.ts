// apps/web/src/services/oauthService.ts
import { User, AuthTokens } from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface OAuthResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: AuthTokens;
  };
  error?: {
    code: string;
    message: string;
  };
}

class OAuthService {
  async authenticateWithGoogle(): Promise<OAuthResponse> {
    try {
      // Force real OAuth for testing
      // if (import.meta.env.DEV) {
      //   return await this.mockOAuthFlow('google');
      // }

      // In production, redirect to the backend OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/oauth/google`;

      // Return a pending response since we're redirecting
      return {
        success: true,
        data: undefined // Will be handled by callback
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GOOGLE_AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Google authentication failed'
        }
      };
    }
  }

  async authenticateWithGitHub(): Promise<OAuthResponse> {
    try {
      // Force real OAuth for testing
      // if (import.meta.env.DEV) {
      //   return await this.mockOAuthFlow('github');
      // }

      // In production, redirect to the backend OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/oauth/github`;

      // Return a pending response since we're redirecting
      return {
        success: true,
        data: undefined // Will be handled by callback
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GITHUB_AUTH_ERROR',
          message: error instanceof Error ? error.message : 'GitHub authentication failed'
        }
      };
    }
  }

  async handleOAuthCallback(searchParams: URLSearchParams): Promise<OAuthResponse> {
    try {
      // Backend'den gelen parametre isimleri: accessToken, provider
      const accessToken = searchParams.get('accessToken');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        return {
          success: false,
          error: {
            code: 'OAUTH_ERROR',
            message: `OAuth authentication failed: ${error}`
          }
        };
      }

      if (!accessToken) {
        return {
          success: false,
          error: {
            code: 'MISSING_TOKENS',
            message: 'OAuth access token not found in callback'
          }
        };
      }

      // Backend'de refresh token cookie olarak set ediliyor, burada sadece access token var
      // Refresh token'ı cookie'den alacağız
      const refreshTokenFromCookie = authService.getRefreshTokenFromCookie();
      const tokens: AuthTokens = {
        accessToken,
        refreshToken: refreshTokenFromCookie || ''
      };

      // Set tokens in both auth service and auth store
      (authService as any).setTokens(tokens);
      
      // Also set in localStorage for immediate availability
      if (tokens.accessToken) {
        localStorage.setItem('accessToken', tokens.accessToken);
      }
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }

      // Get current user info
      const userResponse = await authService.getCurrentUser();
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: {
            code: 'USER_FETCH_ERROR',
            message: 'Failed to fetch user information after OAuth'
          }
        };
      }

      return {
        success: true,
        data: {
          user: userResponse.data,
          tokens
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'OAuth callback failed'
        }
      };
    }
  }

  // Fallback mock method for development/testing
  private async mockOAuthFlow(provider: 'google' | 'github'): Promise<OAuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock user data based on provider
    const userData = this.generateMockUserData(provider);

    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      return {
        success: true,
        data: {
          user: userData,
          tokens: {
            accessToken: this.generateAccessToken(),
            refreshToken: this.generateRefreshToken()
          }
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'OAUTH_ERROR',
          message: `${provider} authentication was cancelled or failed`
        }
      };
    }
  }

  private generateMockUserData(provider: 'google' | 'github'): User {
    const baseUser = {
      id: `mock_${provider}_${Date.now()}`,
      email: provider === 'google'
        ? 'trader@gmail.com'
        : 'trader@github.local',
      username: provider === 'google'
        ? 'TraderPro'
        : 'github_trader',
      firstName: 'Demo',
      lastName: 'Trader',
      role: 'user' as const,
      isVerified: true,
      twofa_enabled: false,
      preferences: {
        theme: 'light' as const,
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return baseUser;
  }

  private generateAccessToken(): string {
    return `mock_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRefreshToken(): string {
    return `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async simulateOAuthCallback(provider: 'google' | 'github', code: string): Promise<OAuthResponse> {
    // This would normally handle the callback from the OAuth provider
    // For now, just simulate a successful authentication
    return this.mockOAuthFlow(provider);
  }
}

export const oauthService = new OAuthService();
export default oauthService;