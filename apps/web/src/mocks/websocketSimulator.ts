import { Trade, Signal, ConnectionHealth } from '../types';
import { generateMockTrades, generateMockSignals } from './data';

// Simple EventEmitter implementation for browser
class EventEmitter {
    private events: { [key: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }

    off(event: string, listener: Function) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
    }
}

class WebSocketSimulator extends EventEmitter {
    private isRunning = false;
    private intervals: number[] = [];
    private mockTrades: Trade[];
    private mockSignals: Signal[];
    private connectionHealth: ConnectionHealth;

    constructor() {
        super();
        this.mockTrades = generateMockTrades(20);
        this.mockSignals = generateMockSignals(10);
        this.connectionHealth = {
            latency: 45 + Math.random() * 30,
            uptime: 99.5 + Math.random() * 0.5,
            errorRate: Math.random() * 2,
            status: 'connected',
            cex_latency: 45 + Math.random() * 100,
            rpc_latency: 120 + Math.random() * 200,
            websocket_status: 'connected',
            throttled: false,
            limits: {
                rate_limit: 1000,
                remaining: 950 + Math.floor(Math.random() * 50),
                reset_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            last_check: new Date().toISOString(),
        };
    }

    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('WebSocket Simulator started');

        // Simulate trade updates every 2-5 seconds
        this.intervals.push(
            window.setInterval(() => {
                this.simulateTradeUpdate();
            }, 2000 + Math.random() * 3000)
        );

        // Simulate signal updates every 5-15 seconds
        this.intervals.push(
            window.setInterval(() => {
                this.simulateSignalUpdate();
            }, 5000 + Math.random() * 10000)
        );

        // Simulate PnL updates every 1-3 seconds
        this.intervals.push(
            window.setInterval(() => {
                this.simulatePnLUpdate();
            }, 1000 + Math.random() * 2000)
        );

        // Simulate spread updates every 2-4 seconds
        this.intervals.push(
            window.setInterval(() => {
                this.simulateSpreadUpdate();
            }, 2000 + Math.random() * 2000)
        );

        // Simulate health updates every 10-30 seconds
        this.intervals.push(
            window.setInterval(() => {
                this.simulateHealthUpdate();
            }, 10000 + Math.random() * 20000)
        );

        // Simulate connection issues occasionally
        this.intervals.push(
            window.setInterval(() => {
                if (Math.random() < 0.05) { // 5% chance
                    this.simulateConnectionIssue();
                }
            }, 60000 + Math.random() * 120000)
        );
    }

    stop(): void {
        this.isRunning = false;
        this.intervals.forEach(window.clearInterval);
        this.intervals = [];
        console.log('WebSocket Simulator stopped');
    }

    private simulateTradeUpdate(): void {
        const trade = this.mockTrades[Math.floor(Math.random() * this.mockTrades.length)];
        if (!trade) return;

        // Update trade with new data
        const updatedTrade = {
            ...trade,
            current_price: trade.current_price * (1 + (Math.random() - 0.5) * 0.02),
            updated_at: new Date().toISOString(),
        };

        this.emit('trade_update', updatedTrade);
    }

    private simulateSignalUpdate(): void {
        const signal = this.mockSignals[Math.floor(Math.random() * this.mockSignals.length)];
        if (!signal) return;

        // Create new signal or update existing one
        const newSignal = {
            ...signal,
            id: `signal_${Date.now()}`,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        this.emit('signal_update', newSignal);
    }

    private simulatePnLUpdate(): void {
        const trade = this.mockTrades[Math.floor(Math.random() * this.mockTrades.length)];
        if (!trade) return;

        const newPnl = trade.pnl + (Math.random() - 0.5) * 100;
        const newPnlPercentage = (newPnl / (trade.entry_price * trade.size)) * 100;

        this.emit('pnl_update', {
            trade_id: trade.id,
            pnl: newPnl,
            pnl_percentage: newPnlPercentage,
        });
    }

    private simulateSpreadUpdate(): void {
        const trade = this.mockTrades[Math.floor(Math.random() * this.mockTrades.length)];
        if (!trade) return;

        const newSpread = Math.max(0, trade.spread + (Math.random() - 0.5) * 0.1);

        this.emit('spread_update', {
            trade_id: trade.id,
            spread: newSpread,
        });
    }

    private simulateHealthUpdate(): void {
        // Simulate realistic latency variations
        this.connectionHealth.cex_latency = Math.max(20, this.connectionHealth.cex_latency + (Math.random() - 0.5) * 20);
        this.connectionHealth.rpc_latency = Math.max(50, this.connectionHealth.rpc_latency + (Math.random() - 0.5) * 40);

        // Simulate rate limit changes
        this.connectionHealth.limits.remaining = Math.max(0, this.connectionHealth.limits.remaining - Math.floor(Math.random() * 10));

        // Simulate throttling occasionally
        if (this.connectionHealth.limits.remaining < 100 && Math.random() < 0.3) {
            this.connectionHealth.throttled = true;
        } else {
            this.connectionHealth.throttled = false;
        }

        this.connectionHealth.last_check = new Date().toISOString();

        this.emit('health_update', this.connectionHealth);
    }

    private simulateConnectionIssue(): void {
        console.log('Simulating connection issue...');

        // Simulate temporary disconnection
        this.connectionHealth.websocket_status = 'disconnected';
        this.emit('health_update', this.connectionHealth);

        // Reconnect after 2-5 seconds
        setTimeout(() => {
            this.connectionHealth.websocket_status = 'connected';
            this.emit('health_update', this.connectionHealth);
            console.log('Connection restored');
        }, 2000 + Math.random() * 3000);
    }

    // Simulate connection events
    connect(): void {
        this.connectionHealth.websocket_status = 'connected';
        this.emit('connect', {});
        this.emit('health_update', this.connectionHealth);
        this.start();
    }

    disconnect(): void {
        this.connectionHealth.websocket_status = 'disconnected';
        this.emit('disconnect', {});
        this.emit('health_update', this.connectionHealth);
        this.stop();
    }

    // Get current status
    getStatus(): 'connected' | 'connecting' | 'disconnected' {
        return this.connectionHealth.websocket_status;
    }

    // Check if simulator is running
    isActive(): boolean {
        return this.isRunning;
    }

    // Update mock data
    updateMockData(): void {
        this.mockTrades = generateMockTrades(20);
        this.mockSignals = generateMockSignals(10);
    }
}

// Create singleton instance
export const websocketSimulator = new WebSocketSimulator();

// Export for use in components
export default websocketSimulator;
