import { create } from 'zustand';
import { ConnectionHealth } from '../types';

interface ConnectionState {
    websocket_status: 'connected' | 'connecting' | 'disconnected';
    cex_latency: number;
    rpc_latency: number;
    throttled: boolean;
    rate_limit: number;
    remaining_requests: number;
    reset_time: string;
    last_check: string;
    error: string | null;
}

interface ConnectionActions {
    setWebSocketStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
    setHealthData: (health: Partial<ConnectionHealth>) => void;
    setError: (error: string | null) => void;
    updateLatency: (type: 'cex' | 'rpc', latency: number) => void;
    setThrottled: (throttled: boolean) => void;
    setRateLimit: (limit: number, remaining: number, resetTime: string) => void;
    clearError: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set) => ({
    // State
    websocket_status: 'disconnected',
    cex_latency: 0,
    rpc_latency: 0,
    throttled: false,
    rate_limit: 0,
    remaining_requests: 0,
    reset_time: '',
    last_check: new Date().toISOString(),
    error: null,

    // Actions
    setWebSocketStatus: (websocket_status) => set({ websocket_status }),

    setHealthData: (health) => set((state) => ({
        ...state,
        ...health,
        last_check: new Date().toISOString(),
    })),

    setError: (error) => set({ error }),

    updateLatency: (type, latency) => set((state) => ({
        ...state,
        [type === 'cex' ? 'cex_latency' : 'rpc_latency']: latency,
        last_check: new Date().toISOString(),
    })),

    setThrottled: (throttled) => set({ throttled }),

    setRateLimit: (limit, remaining, resetTime) => set({
        rate_limit: limit,
        remaining_requests: remaining,
        reset_time: resetTime,
    }),

    clearError: () => set({ error: null }),
}));
