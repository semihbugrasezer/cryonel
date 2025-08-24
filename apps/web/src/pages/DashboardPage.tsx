// apps/web/src/pages/DashboardPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animationUtils } from '../utils/animations';
import { useAuthStore } from '../stores/authStore';
import { useTradingStore, useActiveTrades } from '../stores/tradingStore';
import { useConnectionStore } from '../stores/connectionStore';
import { websocketService } from '../services/websocketService';
import { apiService } from '../services/apiService';
import { KPICard } from '../components/common/KPICard';
import { DataTable } from '../components/common/DataTable';
import { LatencyPill } from '../components/common/LatencyPill';
import { StatBadge } from '../components/common/StatBadge';
import { TradeForDashboard, ConnectionHealth, PerformanceMetrics } from '../types';
import { mockData, generateMockPerformanceMetrics } from '../mocks/data';
import { 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    Zap, 
    Shield, 
    Target,
    BarChart3,
    Clock,
    DollarSign,
    Percent,
    AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { trades, pnl, updateTrade, addTrade } = useTradingStore();
    const activeTrades = useActiveTrades();
    const { websocket_status, setWebSocketStatus, setHealthData } = useConnectionStore();

    const [isLoading, setIsLoading] = useState(true);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
    const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth | null>(null);
    
    // Animation refs
    const pnlChartRef = useRef<HTMLDivElement>(null);
    const performanceChartRef = useRef<HTMLDivElement>(null);
    const activeTradesRef = useRef<HTMLDivElement>(null);
    const systemHealthRef = useRef<HTMLDivElement>(null);
    const statsCardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        initializeDashboard();
        setupWebSocket();

        return () => {
            websocketService.off('onMessage');
            websocketService.off('onConnect');
            websocketService.off('onDisconnect');
        };
    }, []);

    // Enhanced entrance animations with stats
    useEffect(() => {
        if (!isLoading) {
            // Animate stats cards with counters
            const animateStatsCards = () => {
                statsCardsRef.current.forEach((card, index) => {
                    if (card) {
                        const numberElement = card.querySelector('[data-animate-number]') as HTMLElement;
                        const targetValue = numberElement ? parseFloat(numberElement.textContent?.replace(/[^0-9.-]/g, '') || '0') : 0;
                        
                        animationUtils.statsCardEntrance(card, index * 150, targetValue);
                    }
                });
            };

            // Animate chart panels in sequence
            const animateChartPanels = () => {
                const panels = [pnlChartRef.current, performanceChartRef.current, activeTradesRef.current, systemHealthRef.current].filter(Boolean);
                
                panels.forEach((panel, index) => {
                    if (panel) {
                        animationUtils.cardEntrance(panel, 800 + (index * 150));
                    }
                });
            };

            // Animate system health stats with counters
            const animateHealthStats = () => {
                if (systemHealthRef.current && connectionHealth) {
                    const latencyElement = systemHealthRef.current.querySelector('[data-latency]') as HTMLElement;
                    const uptimeElement = systemHealthRef.current.querySelector('[data-uptime]') as HTMLElement;
                    const errorElement = systemHealthRef.current.querySelector('[data-error]') as HTMLElement;

                    if (latencyElement) {
                        setTimeout(() => {
                            animationUtils.animatedCounter(latencyElement, connectionHealth.latency, 2000, 0);
                        }, 1200);
                    }
                    if (uptimeElement) {
                        setTimeout(() => {
                            animationUtils.animatedCounter(uptimeElement, connectionHealth.uptime, 2000, 200);
                        }, 1200);
                    }
                    if (errorElement) {
                        setTimeout(() => {
                            animationUtils.animatedCounter(errorElement, connectionHealth.errorRate, 2000, 400);
                        }, 1200);
                    }
                }
            };

            const timer = setTimeout(() => {
                animateStatsCards();
                animateChartPanels();
                animateHealthStats();
            }, 100);
            
            return () => {
                clearTimeout(timer);
            };
        }
    }, [isLoading, connectionHealth]);

    const initializeDashboard = async () => {
        try {
            setIsLoading(true);

            // Use mock data in development/demo mode
            if (import.meta.env.DEV || !user) {
                // Load mock data
                mockData.trades.slice(0, 20).forEach(trade => addTrade(trade));
                
                // Set mock connection health
                const mockHealth: ConnectionHealth = {
                    latency: 45 + Math.random() * 30,
                    uptime: 99.5 + Math.random() * 0.5,
                    errorRate: Math.random() * 2,
                    status: 'connected'
                };
                setConnectionHealth(mockHealth);
                setHealthData(mockHealth);

                // Set mock performance metrics
                const mockMetrics = generateMockPerformanceMetrics();
                const dashboardMetrics: PerformanceMetrics = mockMetrics;
                setPerformanceMetrics(dashboardMetrics);
                
                // Set mock PnL
                const totalPnl = mockData.trades.reduce((acc, trade) => acc + trade.pnl, 0);
                const totalInvestment = 10000; // Mock investment
                const pnlPercentage = (totalPnl / totalInvestment) * 100;
                
                useTradingStore.getState().setPnL({
                    total: totalPnl,
                    percentage: pnlPercentage,
                    daily: totalPnl * 0.1,
                    weekly: totalPnl * 0.3,
                    monthly: totalPnl * 0.8
                });
            } else {
                // Load real data from API
                const [tradesResponse, healthResponse, metricsResponse] = await Promise.all([
                    apiService.getTrades({ limit: 50 }),
                    apiService.getConnectionHealth(),
                    apiService.getPerformanceMetrics()
                ]);

                if (tradesResponse.success && tradesResponse.data) {
                    tradesResponse.data.items.forEach(trade => addTrade(trade));
                }

                if (healthResponse.success && healthResponse.data) {
                    setConnectionHealth(healthResponse.data);
                    setHealthData(healthResponse.data);
                }

                if (metricsResponse.success && metricsResponse.data) {
                    setPerformanceMetrics(metricsResponse.data);
                }
            }
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupWebSocket = () => {
        // Connect to WebSocket
        websocketService.connect();

        // Set up event handlers
        websocketService.on('onConnect', () => {
            setWebSocketStatus('connected');

            // Subscribe to relevant channels
            websocketService.subscribe('trades', { userId: user?.id });
            websocketService.subscribe('pnl', { userId: user?.id });
            websocketService.subscribe('health', {});
            websocketService.subscribe('signals', {});
        });

        websocketService.on('onDisconnect', () => {
            setWebSocketStatus('disconnected');
        });

        websocketService.on('onMessage', (message) => {
            handleWebSocketMessage(message);
        });
    };

    const handleWebSocketMessage = (message: any) => {
        switch (message.type) {
            case 'trade_update':
                updateTrade(message.data.id, message.data);
                break;

            case 'new_trade':
                addTrade(message.data);
                break;

            case 'pnl_update':
                // Update PnL in store
                break;

            case 'health_update':
                setConnectionHealth(message.data);
                setHealthData(message.data);
                break;

            case 'signal_update':
                // Handle signal updates
                break;

            default:
                console.log('Unhandled WebSocket message:', message);
        }
    };

    const getConnectionStatusColor = () => {
        switch (websocket_status) {
            case 'connected': return 'success';
            case 'connecting': return 'warning';
            case 'disconnected': return 'error';
            default: return 'neutral';
        }
    };

    const getConnectionStatusText = () => {
        switch (websocket_status) {
            case 'connected': return 'Live';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Offline';
            default: return 'Unknown';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-primary-foreground animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Loading Dashboard</h3>
                    <p className="text-muted-foreground">Connecting to trading systems...</p>
                    <div className="mt-4 flex justify-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 sm:space-y-8">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8"
                >
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                            Trading Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                            Welcome back, <span className="text-primary font-semibold">{user?.username || user?.email}</span>
                        </p>
                    </div>

                    {/* Process Indicators - Now stacked for mobile */}
                    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                                    websocket_status === 'connected' ? 'bg-green-500 animate-pulse' : 
                                    websocket_status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                                }`} />
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    {getConnectionStatusText()}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                    connectionHealth?.latency && connectionHealth.latency < 50 
                                        ? 'text-success' 
                                        : connectionHealth?.latency && connectionHealth.latency < 150
                                            ? 'text-warning'
                                            : 'text-destructive'
                                }`} />
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    {connectionHealth?.latency || 0}ms
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                <span className="text-xs sm:text-sm text-muted-foreground">Secured</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div
                        ref={(el) => statsCardsRef.current[0] = el}
                        className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl border border-green-500/20 rounded-2xl p-4 sm:p-6 group hover:scale-105 transition-transform duration-300"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white" data-animate-number>
                                    ${pnl?.total?.toLocaleString() || '0'}
                                </div>
                                <div className={`text-xs sm:text-sm font-medium ${
                                    (pnl?.total || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {(pnl?.total || 0) >= 0 ? '+' : ''}{(pnl?.percentage || 0).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        <div className="text-slate-300 font-medium text-sm sm:text-base">Total PnL</div>
                        <div className="text-slate-400 text-xs sm:text-sm">All time performance</div>
                    </div>

                    <div
                        ref={(el) => statsCardsRef.current[1] = el}
                        className="bg-gradient-to-br from-slate-900/20 to-green-900/20 backdrop-blur-xl border border-slate-500/20 rounded-2xl p-4 sm:p-6 group hover:scale-105 transition-transform duration-300"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white" data-animate-number>
                                    {activeTrades.length}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-400">
                                    {trades.length} total
                                </div>
                            </div>
                        </div>
                        <div className="text-slate-300 font-medium text-sm sm:text-base">Active Trades</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Currently running</div>
                    </div>

                    <div
                        ref={(el) => statsCardsRef.current[2] = el}
                        className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 sm:p-6 group hover:scale-105 transition-transform duration-300"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white" data-animate-number>
                                    {((performanceMetrics?.win_rate || 0) * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-amber-400">Win Rate</div>
                            </div>
                        </div>
                        <div className="text-slate-300 font-medium text-sm sm:text-base">Success Rate</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Last 30 days</div>
                    </div>

                    <div
                        ref={(el) => statsCardsRef.current[3] = el}
                        className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 group hover:scale-105 transition-transform duration-300"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-right">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white" data-animate-number>
                                    {(Math.random() * 0.5 + 0.1).toFixed(2)}%
                                </div>
                                <div className="text-sm text-orange-400">Captured</div>
                            </div>
                        </div>
                        <div className="text-slate-300 font-medium text-sm sm:text-base">Avg Spread</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Profit margin</div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {/* PnL Chart */}
                    <div
                        ref={pnlChartRef}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6"
                    >
                        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">PnL Performance</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-1 sm:gap-2">
                                <button className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors">1D</button>
                                <button className="px-2 py-1 text-xs bg-amber-600 text-white rounded-lg transition-colors">7D</button>
                                <button className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors">30D</button>
                                <button className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors">1Y</button>
                            </div>
                        </div>
                        <div className="h-40 sm:h-48 lg:h-64 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600/30">
                            <div className="text-center">
                                <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-slate-500 mx-auto mb-2 sm:mb-3" />
                                <p className="text-slate-400 text-sm sm:text-lg font-medium">Chart Loading...</p>
                                <p className="text-slate-500 text-xs sm:text-sm">Real-time PnL visualization</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div
                        ref={performanceChartRef}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-500 to-amber-500 rounded-lg flex items-center justify-center">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">Performance Metrics</h3>
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 gap-1 sm:gap-2">
                                <div>
                                    <span className="text-slate-300 font-medium text-sm sm:text-base">Sharpe Ratio</span>
                                    <div className="text-slate-500 text-xs sm:text-sm">Risk-adjusted return</div>
                                </div>
                                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-400">
                                    {performanceMetrics?.sharpe_ratio?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 gap-1 sm:gap-2">
                                <div>
                                    <span className="text-slate-300 font-medium text-sm sm:text-base">Max Drawdown</span>
                                    <div className="text-slate-500 text-xs sm:text-sm">Maximum loss</div>
                                </div>
                                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400">
                                    -{((performanceMetrics?.max_drawdown || 0) * 100).toFixed(2)}%
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 gap-1 sm:gap-2">
                                <div>
                                    <span className="text-slate-300 font-medium text-sm sm:text-base">Total Trades</span>
                                    <div className="text-slate-500 text-xs sm:text-sm">All time</div>
                                </div>
                                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-400">{trades.length}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 gap-1 sm:gap-2">
                                <div>
                                    <span className="text-slate-300 font-medium text-sm sm:text-base">Avg Duration</span>
                                    <div className="text-slate-500 text-xs sm:text-sm">Per trade</div>
                                </div>
                                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                                    2h 15m
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Trades Table */}
                <div
                    ref={activeTradesRef}
                    className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">Active Positions</h3>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-colors text-sm sm:text-base"
                        >
                            <span className="hidden sm:inline">View All Trades</span>
                            <span className="sm:hidden">View All</span>
                        </motion.button>
                    </div>

                    {activeTrades.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-slate-700/50">
                            <DataTable
                                data={activeTrades}
                                columns={[
                                    {
                                        label: 'Symbol',
                                        key: 'market',
                                        cell: ({ row }) => (
                                            <div className="font-bold text-white">{row.original.market}</div>
                                        ),
                                    },
                                    {
                                        label: 'Side',
                                        key: 'side',
                                        cell: ({ row }) => (
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                row.original.side === 'buy' 
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                {row.original.side.toUpperCase()}
                                            </span>
                                        ),
                                    },
                                    {
                                        label: 'Size',
                                        key: 'size',
                                        cell: ({ row }) => (
                                            <div className="text-slate-300 font-mono">{row.original.size.toFixed(6)}</div>
                                        ),
                                    },
                                    {
                                        label: 'Entry Price',
                                        key: 'entry_price',
                                        cell: ({ row }) => (
                                            <div className="text-slate-300 font-mono">${row.original.entry_price.toFixed(2)}</div>
                                        ),
                                    },
                                    {
                                        label: 'Current PnL',
                                        key: 'pnl',
                                        cell: ({ row }) => (
                                            <div className={`font-bold font-mono ${row.original.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {row.original.pnl >= 0 ? '+' : ''}${row.original.pnl.toFixed(2)}
                                            </div>
                                        ),
                                    },
                                    {
                                        label: 'Duration',
                                        key: 'created_at',
                                        cell: ({ row }) => (
                                            <div className="text-slate-400 text-xs sm:text-sm">{new Date(row.original.created_at).toLocaleDateString()}</div>
                                        ),
                                    },
                                ]}
                                searchable
                                sortable
                                pagination
                            />
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-slate-500" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">No Active Trades</h4>
                            <p className="text-slate-400">Your active positions will appear here once you start trading</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-600 to-slate-700 hover:from-amber-700 hover:to-slate-800 text-white rounded-xl transition-all duration-300"
                            >
                                Start Trading
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* System Health */}
                {connectionHealth && (
                    <div
                        ref={systemHealthRef}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-slate-500 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">System Health</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-1" data-latency>
                                    {connectionHealth.latency}ms
                                </div>
                                <div className="text-slate-400">Network Latency</div>
                                <div className={`text-xs mt-1 ${
                                    connectionHealth.latency < 50 ? 'text-green-400' :
                                    connectionHealth.latency < 150 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                    {connectionHealth.latency < 50 ? 'Excellent' :
                                     connectionHealth.latency < 150 ? 'Good' : 'High'}
                                </div>
                            </div>
                            
                            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-1" data-uptime>
                                    {connectionHealth.uptime}%
                                </div>
                                <div className="text-slate-400">System Uptime</div>
                                <div className={`text-xs mt-1 ${
                                    connectionHealth.uptime > 99 ? 'text-green-400' :
                                    connectionHealth.uptime > 95 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                    {connectionHealth.uptime > 99 ? 'Excellent' :
                                     connectionHealth.uptime > 95 ? 'Good' : 'Poor'}
                                </div>
                            </div>
                            
                            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/30">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-1" data-error>
                                    {connectionHealth.errorRate}%
                                </div>
                                <div className="text-slate-400">Error Rate</div>
                                <div className={`text-xs mt-1 ${
                                    connectionHealth.errorRate < 1 ? 'text-green-400' :
                                    connectionHealth.errorRate < 5 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                    {connectionHealth.errorRate < 1 ? 'Excellent' :
                                     connectionHealth.errorRate < 5 ? 'Acceptable' : 'High'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
