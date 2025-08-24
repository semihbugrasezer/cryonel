// apps/api/src/types/index.ts

// User interface for database operations
export interface User {
    id: string;
    email: string;
    role: string;
    twofa_enabled: boolean;
    created_at: Date;
}

// API Key interface
export interface UserApiKey {
    id: string;
    user_id: string;
    exchange: string;
    key_enc: string;
    secret_enc: string;
    can_withdraw: boolean;
    created_at: Date;
}

// Trade interface
export interface Trade {
    id: number;
    user_id: string;
    venue: string;
    base: string;
    quote: string;
    side: 'buy' | 'sell';
    qty: number;
    price: number;
    fees: number;
    txid?: string;
    created_at: Date;
}

// Master Signal interface
export interface MasterSignal {
    id: number;
    master_id: string;
    symbol: string;
    action: 'open' | 'close';
    entry?: number;
    stop?: number;
    take_profit?: number[];
    meta?: Record<string, any>;
    created_at: Date;
}

// Database row type
export type DatabaseRow = Record<string, any>;
