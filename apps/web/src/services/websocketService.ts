// apps/web/src/services/websocketService.ts
import { authService } from './authService';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: number | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private isConnecting = false;
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for auth state changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken') {
        if (e.newValue) {
          this.connect();
        } else {
          this.disconnect();
        }
      }
    });
  }

  connect(url?: string): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;

      const wsUrl = url || this.getWebSocketUrl();

      // Add authentication token to WebSocket URL
      const token = localStorage.getItem('accessToken');
      const fullWsUrl = token ? `${wsUrl}?token=${token}` : wsUrl;

      this.ws = new WebSocket(fullWsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.eventHandlers.onConnect?.();
        resolve();
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.eventHandlers.onDisconnect?.();

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        this.eventHandlers.onError?.(error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    });
  }

  private getWebSocketUrl(): string {
    // In production, use wss for secure WebSocket connection
    if (import.meta.env.PROD) {
      return 'wss://www.cryonel.com/ws';
    }

    // Development: Use local API server
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws`;
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds

      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect().then(() => {
        this.eventHandlers.onReconnect?.();
      }).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', data: {}, timestamp: new Date().toISOString() });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle different message types
    switch (message.type) {
      case 'pong':
        // Heartbeat response, no action needed
        break;

      case 'auth_required':
        // Re-authenticate if needed
        this.handleAuthRequired();
        break;

      case 'error':
        console.error('WebSocket error message:', message.data);
        break;

      default:
        // Pass message to event handlers
        this.eventHandlers.onMessage?.(message);
        break;
    }
  }

  private async handleAuthRequired(): Promise<void> {
    const token = authService.getAccessToken();
    if (token) {
      this.send({
        type: 'authenticate',
        data: { token },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Token not available, disconnect and let auth flow handle reconnection
      this.disconnect();
    }
  }

  // Subscribe to specific channels
  subscribe(channel: string, params?: Record<string, any>): void {
    this.send({
      type: 'subscribe',
      data: { channel, ...params },
      timestamp: new Date().toISOString(),
    });
  }

  // Unsubscribe from specific channels
  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe',
      data: { channel },
      timestamp: new Date().toISOString(),
    });
  }

  // Set event handlers
  on(event: keyof WebSocketEventHandlers, handler: any): void {
    this.eventHandlers[event] = handler;
  }

  // Remove event handlers
  off(event: keyof WebSocketEventHandlers): void {
    delete this.eventHandlers[event];
  }

  // Get connection status
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection latency (if available)
  getLatency(): number | null {
    // This would be implemented with ping/pong timing
    // For now, return null
    return null;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
