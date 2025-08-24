import { create } from 'zustand';
import { Trade, Position, Strategy, Signal, PnLState } from '../types';

interface TradingState {
    trades: Trade[];
    positions: Position[];
    strategies: Strategy[];
    signals: Signal[];
    pnl: PnLState;
    isLoading: boolean;
    error: string | null;
}

interface TradingActions {
    setTrades: (trades: Trade[]) => void;
    addTrade: (trade: Trade) => void;
    updateTrade: (id: string, updates: Partial<Trade>) => void;
    removeTrade: (id: string) => void;

    setPositions: (positions: Position[]) => void;
    addPosition: (position: Position) => void;
    updatePosition: (id: string, updates: Partial<Position>) => void;
    removePosition: (id: string) => void;

    setStrategies: (strategies: Strategy[]) => void;
    addStrategy: (strategy: Strategy) => void;
    updateStrategy: (id: string, updates: Partial<Strategy>) => void;
    removeStrategy: (id: string) => void;

    setSignals: (signals: Signal[]) => void;
    addSignal: (signal: Signal) => void;
    updateSignal: (id: string, updates: Partial<Signal>) => void;
    removeSignal: (id: string) => void;

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    
    // PnL actions
    setPnL: (pnl: PnLState) => void;
    updatePnL: (updates: Partial<PnLState>) => void;
}

type TradingStore = TradingState & TradingActions;

export const useTradingStore = create<TradingStore>((set, get) => ({
    // State
    trades: [],
    positions: [],
    strategies: [],
    signals: [],
    pnl: {
        total: 0,
        percentage: 0,
        daily: 0,
        weekly: 0,
        monthly: 0
    },
    isLoading: false,
    error: null,

    // Actions
    setTrades: (trades) => set({ trades }),
    addTrade: (trade) => set((state) => ({
        trades: [...state.trades, trade]
    })),
    updateTrade: (id, updates) => set((state) => ({
        trades: state.trades.map(trade =>
            trade.id === id ? { ...trade, ...updates } : trade
        )
    })),
    removeTrade: (id) => set((state) => ({
        trades: state.trades.filter(trade => trade.id !== id)
    })),

    setPositions: (positions) => set({ positions }),
    addPosition: (position) => set((state) => ({
        positions: [...state.positions, position]
    })),
    updatePosition: (id, updates) => set((state) => ({
        positions: state.positions.map(pos =>
            pos.id === id ? { ...pos, ...updates } : pos
        )
    })),
    removePosition: (id) => set((state) => ({
        positions: state.positions.filter(pos => pos.id !== id)
    })),

    setStrategies: (strategies) => set({ strategies }),
    addStrategy: (strategy) => set((state) => ({
        strategies: [...state.strategies, strategy]
    })),
    updateStrategy: (id, updates) => set((state) => ({
        strategies: state.strategies.map(strat =>
            strat.id === id ? { ...strat, ...updates } : strat
        )
    })),
    removeStrategy: (id) => set((state) => ({
        strategies: state.strategies.filter(strat => strat.id !== id)
    })),

    setSignals: (signals) => set({ signals }),
    addSignal: (signal) => set((state) => ({
        signals: [...state.signals, signal]
    })),
    updateSignal: (id, updates) => set((state) => ({
        signals: state.signals.map(sig =>
            sig.id === id ? { ...sig, ...updates } : sig
        )
    })),
    removeSignal: (id) => set((state) => ({
        signals: state.signals.filter(sig => sig.id !== id)
    })),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    
    // PnL actions
    setPnL: (pnl) => set({ pnl }),
    updatePnL: (updates) => set((state) => ({
        pnl: { ...state.pnl, ...updates }
    })),
}));

// Selector for active trades
export const useActiveTrades = () => {
    const trades = useTradingStore((state) => state.trades);
    return trades.filter(trade => trade.status === 'open');
};
