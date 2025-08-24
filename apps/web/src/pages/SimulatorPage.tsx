// apps/web/src/pages/SimulatorPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import {
    Play,
    Pause,
    Square,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    Target,
    Clock,
    BarChart3,
    Settings,
    Download,
    Upload,
    Zap,
    Shield,
    DollarSign,
    Activity
} from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { DataTable } from '../components/common/DataTable';
import { PnLChart } from '../components/charts/PnLChart';
import { EquityCurve } from '../components/charts/EquityCurve';

interface SimulatedTrade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    pnlPercentage: number;
    timestamp: string;
    strategy: string;
    status: 'open' | 'closed';
}

interface Strategy {
    id: string;
    name: string;
    description: string;
    type: 'arbitrage' | 'trend' | 'mean-reversion' | 'custom';
    riskLevel: 'low' | 'medium' | 'high';
    isActive: boolean;
    performance: {
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        sharpeRatio: number;
        maxDrawdown: number;
    };
}

interface BacktestResult {
    id: string;
    strategyName: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgTrade: number;
    profitFactor: number;
}

export default function SimulatorPage() {
    const [activeTab, setActiveTab] = useState('paper-trading');
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(1);
    const [initialCapital, setInitialCapital] = useState(10000);
    const [currentCapital, setCurrentCapital] = useState(10000);
    const [simulatedTrades, setSimulatedTrades] = useState<SimulatedTrade[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [timeRange, setTimeRange] = useState('1M');
    const [riskLevel, setRiskLevel] = useState(5);

    // Mock data - replace with API calls
    useEffect(() => {
        const mockStrategies: Strategy[] = [
            {
                id: '1',
                name: 'Arbitrage Bot',
                description: 'Automated CEX-DEX arbitrage with risk management',
                type: 'arbitrage',
                riskLevel: 'low',
                isActive: true,
                performance: {
                    totalTrades: 45,
                    winRate: 89.2,
                    totalPnL: 2340,
                    sharpeRatio: 2.1,
                    maxDrawdown: 3.2
                }
            },
            {
                id: '2',
                name: 'Trend Following',
                description: 'Momentum-based trend following strategy',
                type: 'trend',
                riskLevel: 'medium',
                isActive: false,
                performance: {
                    totalTrades: 23,
                    winRate: 65.2,
                    totalPnL: 1890,
                    sharpeRatio: 1.4,
                    maxDrawdown: 8.7
                }
            },
            {
                id: '3',
                name: 'Mean Reversion',
                description: 'Statistical mean reversion with Bollinger Bands',
                type: 'mean-reversion',
                riskLevel: 'medium',
                isActive: true,
                performance: {
                    totalTrades: 67,
                    winRate: 72.1,
                    totalPnL: 3120,
                    sharpeRatio: 1.8,
                    maxDrawdown: 5.4
                }
            }
        ];

        const mockTrades: SimulatedTrade[] = [
            {
                id: '1',
                symbol: 'SOL/USDT',
                side: 'buy',
                entryPrice: 98.50,
                exitPrice: 102.30,
                quantity: 10.15,
                pnl: 38.95,
                pnlPercentage: 3.95,
                timestamp: '2024-01-15T10:30:00Z',
                strategy: 'Arbitrage Bot',
                status: 'closed'
            },
            {
                id: '2',
                symbol: 'BTC/USDT',
                side: 'sell',
                entryPrice: 43250,
                exitPrice: 42890,
                quantity: 0.23,
                pnl: 82.8,
                pnlPercentage: 0.83,
                timestamp: '2024-01-15T09:15:00Z',
                strategy: 'Mean Reversion',
                status: 'closed'
            },
            {
                id: '3',
                symbol: 'ETH/USDT',
                side: 'buy',
                entryPrice: 2650,
                exitPrice: 0,
                quantity: 1.5,
                pnl: 0,
                pnlPercentage: 0,
                timestamp: '2024-01-15T11:00:00Z',
                strategy: 'Trend Following',
                status: 'open'
            }
        ];

        const mockBacktests: BacktestResult[] = [
            {
                id: '1',
                strategyName: 'Arbitrage Bot',
                startDate: '2024-01-01',
                endDate: '2024-01-15',
                initialCapital: 10000,
                finalCapital: 12340,
                totalReturn: 23.4,
                annualizedReturn: 156.8,
                sharpeRatio: 2.1,
                maxDrawdown: 3.2,
                winRate: 89.2,
                totalTrades: 45,
                avgTrade: 52.0,
                profitFactor: 3.2
            }
        ];

        setStrategies(mockStrategies);
        setSimulatedTrades(mockTrades);
        setBacktestResults(mockBacktests);
    }, []);

    const handleStartSimulation = () => {
        setIsSimulationRunning(true);
        // Start simulation logic here
    };

    const handlePauseSimulation = () => {
        setIsSimulationRunning(false);
        // Pause simulation logic here
    };

    const handleStopSimulation = () => {
        setIsSimulationRunning(false);
        // Stop and reset simulation logic here
    };

    const handleResetSimulation = () => {
        setCurrentCapital(initialCapital);
        setSimulatedTrades([]);
        // Reset simulation logic here
    };

    const handleStrategyToggle = (strategyId: string) => {
        setStrategies(prev =>
            prev.map(strategy =>
                strategy.id === strategyId
                    ? { ...strategy, isActive: !strategy.isActive }
                    : strategy
            )
        );
    };

    const handleBacktest = () => {
        if (!selectedStrategy) return;

        // Run backtest logic here
        const newBacktest: BacktestResult = {
            id: Date.now().toString(),
            strategyName: strategies.find(s => s.id === selectedStrategy)?.name || '',
            startDate: '2024-01-01',
            endDate: '2024-01-15',
            initialCapital: initialCapital,
            finalCapital: currentCapital,
            totalReturn: ((currentCapital - initialCapital) / initialCapital) * 100,
            annualizedReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0,
            totalTrades: simulatedTrades.length,
            avgTrade: 0,
            profitFactor: 0
        };

        setBacktestResults(prev => [newBacktest, ...prev]);
    };

    const totalPnL = simulatedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = simulatedTrades.length > 0
        ? (simulatedTrades.filter(trade => trade.pnl > 0).length / simulatedTrades.length) * 100
        : 0;
    const totalTrades = simulatedTrades.length;
    const activeTrades = simulatedTrades.filter(trade => trade.status === 'open').length;

    const getStrategyTypeColor = (type: string) => {
        switch (type) {
            case 'arbitrage': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
            case 'trend': return 'bg-green-500/20 text-green-600 border-green-500/30';
            case 'mean-reversion': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
            case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-hi">Trading Simulator</h1>
                    <p className="text-text-low">Test strategies with paper trading and backtesting</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Results
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Import Strategy
                    </Button>
                </div>
            </div>

            {/* Simulation Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Simulation Controls
                    </CardTitle>
                    <CardDescription>Control the trading simulation and adjust parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-hi mb-2">Initial Capital</label>
                            <Input
                                type="number"
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                                className="w-full"
                                min="1000"
                                step="1000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-hi mb-2">Simulation Speed</label>
                            <Select value={simulationSpeed.toString()} onValueChange={(value) => setSimulationSpeed(parseInt(value))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.25">0.25x</SelectItem>
                                    <SelectItem value="0.5">0.5x</SelectItem>
                                    <SelectItem value="1">1x</SelectItem>
                                    <SelectItem value="2">2x</SelectItem>
                                    <SelectItem value="5">5x</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-hi mb-2">Time Range</label>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1W">1 Week</SelectItem>
                                    <SelectItem value="1M">1 Month</SelectItem>
                                    <SelectItem value="3M">3 Months</SelectItem>
                                    <SelectItem value="6M">6 Months</SelectItem>
                                    <SelectItem value="1Y">1 Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-hi mb-2">Risk Level: {riskLevel}</label>
                            <Slider
                                value={[riskLevel]}
                                onValueChange={(value) => setRiskLevel(value[0])}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isSimulationRunning ? (
                            <Button onClick={handleStartSimulation} className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Start Simulation
                            </Button>
                        ) : (
                            <Button onClick={handlePauseSimulation} variant="secondary" className="flex items-center gap-2">
                                <Pause className="h-4 w-4" />
                                Pause
                            </Button>
                        )}
                        <Button onClick={handleStopSimulation} variant="destructive" className="flex items-center gap-2">
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                        <Button onClick={handleResetSimulation} variant="outline" className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Current Capital"
                    value={`$${currentCapital.toLocaleString()}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend={`${((currentCapital - initialCapital) / initialCapital * 100).toFixed(2)}%`}
                    trendDirection={currentCapital >= initialCapital ? "up" : "down"}
                />
                <KPICard
                    label="Total PnL"
                    value={`$${totalPnL.toFixed(2)}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    trend={totalPnL >= 0 ? "+" : ""}
                    trendDirection={totalPnL >= 0 ? "up" : "down"}
                />
                <KPICard
                    label="Win Rate"
                    value={`${winRate.toFixed(1)}%`}
                    icon={<Target className="h-5 w-5" />}
                    trend={`${totalTrades} trades`}
                    trendDirection="up"
                />
                <KPICard
                    label="Active Trades"
                    value={activeTrades.toString()}
                    icon={<Activity className="h-5 w-5" />}
                    trend={`${totalTrades} total`}
                    trendDirection="up"
                />
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="paper-trading">Paper Trading</TabsTrigger>
                    <TabsTrigger value="strategies">Strategies</TabsTrigger>
                    <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
                </TabsList>

                <TabsContent value="paper-trading" className="space-y-4">
                    {/* Performance Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Portfolio Performance</CardTitle>
                            <CardDescription>Real-time equity curve and performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <EquityCurve data={simulatedTrades} initialCapital={initialCapital} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Trades */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Trades</CardTitle>
                            <CardDescription>Currently open positions in the simulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={simulatedTrades.filter(trade => trade.status === 'open')}
                                columns={[
                                    { key: 'symbol', label: 'Symbol' },
                                    { key: 'side', label: 'Side' },
                                    { key: 'entryPrice', label: 'Entry Price' },
                                    { key: 'quantity', label: 'Quantity' },
                                    { key: 'strategy', label: 'Strategy' },
                                    { key: 'timestamp', label: 'Entry Time' },
                                    { key: 'status', label: 'Status' }
                                ]}
                                renderCell={(item, column) => {
                                    switch (column.key) {
                                        case 'side':
                                            return (
                                                <Badge variant={item.side === 'buy' ? 'default' : 'secondary'}>
                                                    {item.side.toUpperCase()}
                                                </Badge>
                                            );
                                        case 'strategy':
                                            return <span className="text-sm">{item.strategy}</span>;
                                        case 'timestamp':
                                            return new Date(item.timestamp).toLocaleString();
                                        case 'status':
                                            return (
                                                <Badge variant="outline">
                                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                </Badge>
                                            );
                                        default:
                                            return item[column.key as keyof SimulatedTrade];
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Trade History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trade History</CardTitle>
                            <CardDescription>All completed trades in the simulation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={simulatedTrades.filter(trade => trade.status === 'closed')}
                                columns={[
                                    { key: 'symbol', label: 'Symbol' },
                                    { key: 'side', label: 'Side' },
                                    { key: 'entryPrice', label: 'Entry' },
                                    { key: 'exitPrice', label: 'Exit' },
                                    { key: 'quantity', label: 'Quantity' },
                                    { key: 'pnl', label: 'PnL' },
                                    { key: 'pnlPercentage', label: 'PnL %' },
                                    { key: 'strategy', label: 'Strategy' },
                                    { key: 'timestamp', label: 'Time' }
                                ]}
                                renderCell={(item, column) => {
                                    switch (column.key) {
                                        case 'side':
                                            return (
                                                <Badge variant={item.side === 'buy' ? 'default' : 'secondary'}>
                                                    {item.side.toUpperCase()}
                                                </Badge>
                                            );
                                        case 'pnl':
                                            return (
                                                <span className={item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    ${item.pnl.toFixed(2)}
                                                </span>
                                            );
                                        case 'pnlPercentage':
                                            return (
                                                <span className={item.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {item.pnlPercentage.toFixed(2)}%
                                                </span>
                                            );
                                        case 'strategy':
                                            return <span className="text-sm">{item.strategy}</span>;
                                        case 'timestamp':
                                            return new Date(item.timestamp).toLocaleString();
                                        default:
                                            return item[column.key as keyof SimulatedTrade];
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategies" className="space-y-4">
                    {/* Strategy Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Strategy Management
                            </CardTitle>
                            <CardDescription>Configure and manage trading strategies</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {strategies.map((strategy) => (
                                    <Card key={strategy.id} className="relative">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl">{strategy.name}</CardTitle>
                                                    <CardDescription className="mt-2">{strategy.description}</CardDescription>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge className={getStrategyTypeColor(strategy.type)}>
                                                        {strategy.type.charAt(0).toUpperCase() + strategy.type.slice(1)}
                                                    </Badge>
                                                    <Badge className={getRiskColor(strategy.riskLevel)}>
                                                        {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)} Risk
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Performance Metrics */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{strategy.performance.totalTrades}</div>
                                                    <div className="text-sm text-text-low">Total Trades</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{strategy.performance.winRate}%</div>
                                                    <div className="text-sm text-text-low">Win Rate</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{strategy.performance.totalPnL}</div>
                                                    <div className="text-sm text-text-low">Total PnL</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{strategy.performance.sharpeRatio}</div>
                                                    <div className="text-sm text-text-low">Sharpe Ratio</div>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Strategy Controls */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Active Strategy</span>
                                                <Switch
                                                    checked={strategy.isActive}
                                                    onCheckedChange={() => handleStrategyToggle(strategy.id)}
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" className="flex-1">
                                                    <BarChart3 className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                                <Button variant="outline" className="flex-1">
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Configure
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="backtesting" className="space-y-4">
                    {/* Backtest Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Backtest Configuration
                            </CardTitle>
                            <CardDescription>Configure and run strategy backtests</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-hi mb-2">Select Strategy</label>
                                    <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a strategy" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {strategies.map(strategy => (
                                                <SelectItem key={strategy.id} value={strategy.id}>
                                                    {strategy.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-hi mb-2">Start Date</label>
                                    <Input type="date" defaultValue="2024-01-01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-hi mb-2">End Date</label>
                                    <Input type="date" defaultValue="2024-01-15" />
                                </div>
                            </div>
                            <Button onClick={handleBacktest} disabled={!selectedStrategy} className="flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Run Backtest
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Backtest Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Backtest Results</CardTitle>
                            <CardDescription>Historical performance analysis of strategies</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {backtestResults.map((result) => (
                                    <Card key={result.id} className="border-l-4 border-l-primary">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{result.strategyName}</CardTitle>
                                                    <CardDescription>
                                                        {result.startDate} to {result.endDate}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className="text-lg font-bold">
                                                    {result.totalReturn.toFixed(2)}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">${result.finalCapital.toLocaleString()}</div>
                                                    <div className="text-sm text-text-low">Final Capital</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{result.totalTrades}</div>
                                                    <div className="text-sm text-text-low">Total Trades</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{result.winRate.toFixed(1)}%</div>
                                                    <div className="text-sm text-text-low">Win Rate</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-text-hi">{result.sharpeRatio.toFixed(2)}</div>
                                                    <div className="text-sm text-text-low">Sharpe Ratio</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
