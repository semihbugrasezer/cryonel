// apps/web/src/pages/CopyTradingPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import {
    TrendingUp,
    Users,
    DollarSign,
    Star,
    Copy,
    UserCheck,
    UserX,
    Filter,
    Search
} from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { DataTable } from '../components/common/DataTable';
import { PnLChart } from '../components/charts/PnLChart';

interface MasterTrader {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    followers: number;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    monthlyPnL: number;
    maxDrawdown: number;
    riskLevel: 'low' | 'medium' | 'high';
    isFollowing: boolean;
    copyAmount: number;
    copyPercentage: number;
    status: 'active' | 'paused' | 'stopped';
}

interface CopyTrade {
    id: string;
    masterId: string;
    masterName: string;
    symbol: string;
    side: 'buy' | 'sell';
    entryPrice: number;
    currentPrice: number;
    quantity: number;
    pnl: number;
    pnlPercentage: number;
    status: 'open' | 'closed' | 'pending';
    timestamp: string;
}

export default function CopyTradingPage() {
    const [masterTraders, setMasterTraders] = useState<MasterTrader[]>([]);
    const [copyTrades, setCopyTrades] = useState<CopyTrade[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('rating');

    // Mock data - replace with API calls
    useEffect(() => {
        const mockMasters: MasterTrader[] = [
            {
                id: '1',
                name: 'CryptoWhale',
                avatar: '🐋',
                rating: 4.9,
                followers: 1247,
                totalTrades: 156,
                winRate: 78.2,
                totalPnL: 45620,
                monthlyPnL: 8920,
                maxDrawdown: 12.5,
                riskLevel: 'medium',
                isFollowing: true,
                copyAmount: 1000,
                copyPercentage: 15,
                status: 'active'
            },
            {
                id: '2',
                name: 'SolanaPro',
                avatar: '☀️',
                rating: 4.7,
                followers: 892,
                totalTrades: 203,
                winRate: 82.1,
                totalPnL: 67890,
                monthlyPnL: 12450,
                maxDrawdown: 8.9,
                riskLevel: 'low',
                isFollowing: false,
                copyAmount: 0,
                copyPercentage: 0,
                status: 'active'
            },
            {
                id: '3',
                name: 'ArbitrageKing',
                avatar: '👑',
                rating: 4.8,
                followers: 2156,
                totalTrades: 89,
                winRate: 91.2,
                totalPnL: 123450,
                monthlyPnL: 23450,
                maxDrawdown: 5.2,
                riskLevel: 'low',
                isFollowing: true,
                copyAmount: 2500,
                copyPercentage: 25,
                status: 'active'
            }
        ];

        const mockTrades: CopyTrade[] = [
            {
                id: '1',
                masterId: '1',
                masterName: 'CryptoWhale',
                symbol: 'SOL/USDT',
                side: 'buy',
                entryPrice: 98.50,
                currentPrice: 102.30,
                quantity: 10.15,
                pnl: 38.95,
                pnlPercentage: 3.95,
                status: 'open',
                timestamp: '2024-01-15T10:30:00Z'
            },
            {
                id: '2',
                masterId: '3',
                masterName: 'ArbitrageKing',
                symbol: 'BTC/USDT',
                side: 'sell',
                entryPrice: 43250,
                currentPrice: 42890,
                quantity: 0.23,
                pnl: 82.8,
                pnlPercentage: 0.83,
                status: 'open',
                timestamp: '2024-01-15T09:15:00Z'
            }
        ];

        setMasterTraders(mockMasters);
        setCopyTrades(mockTrades);
    }, []);

    const handleFollow = (masterId: string) => {
        setMasterTraders(prev =>
            prev.map(master =>
                master.id === masterId
                    ? { ...master, isFollowing: true, status: 'active' }
                    : master
            )
        );
    };

    const handleUnfollow = (masterId: string) => {
        setMasterTraders(prev =>
            prev.map(master =>
                master.id === masterId
                    ? { ...master, isFollowing: false, status: 'stopped' }
                    : master
            )
        );
    };

    const handleCopyAmountChange = (masterId: string, amount: number) => {
        setMasterTraders(prev =>
            prev.map(master =>
                master.id === masterId
                    ? { ...master, copyAmount: amount }
                    : master
            )
        );
    };

    const handleCopyPercentageChange = (masterId: string, percentage: number) => {
        setMasterTraders(prev =>
            prev.map(master =>
                master.id === masterId
                    ? { ...master, copyPercentage: percentage }
                    : master
            )
        );
    };

    const filteredMasters = masterTraders.filter(master => {
        const matchesSearch = master.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'all' || master.riskLevel === riskFilter;
        return matchesSearch && matchesRisk;
    });

    const sortedMasters = [...filteredMasters].sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                return b.rating - a.rating;
            case 'followers':
                return b.followers - a.followers;
            case 'winRate':
                return b.winRate - a.winRate;
            case 'totalPnL':
                return b.totalPnL - a.totalPnL;
            case 'monthlyPnL':
                return b.monthlyPnL - a.monthlyPnL;
            default:
                return 0;
        }
    });

    const totalFollowers = masterTraders.reduce((sum, master) => sum + master.followers, 0);
    const totalCopyAmount = masterTraders.reduce((sum, master) => sum + master.copyAmount, 0);
    const activeCopies = masterTraders.filter(master => master.isFollowing).length;
    const totalPnL = copyTrades.reduce((sum, trade) => sum + trade.pnl, 0);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
            case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-600 border-green-500/30';
            case 'paused': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
            case 'stopped': return 'bg-red-500/20 text-red-600 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-hi">Copy Trading</h1>
                    <p className="text-text-low">Follow successful traders and copy their strategies</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Copy Settings
                    </Button>
                    <Button className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Find Masters
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Total Followers"
                    value={totalFollowers.toLocaleString()}
                    icon={<Users className="h-5 w-5" />}
                    trend="+12%"
                    trendDirection="up"
                />
                <KPICard
                    label="Active Copies"
                    value={activeCopies.toString()}
                    icon={<Copy className="h-5 w-5" />}
                    trend="+2"
                    trendDirection="up"
                />
                <KPICard
                    label="Total Copy Amount"
                    value={`$${totalCopyAmount.toLocaleString()}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend="+8.5%"
                    trendDirection="up"
                />
                <KPICard
                    label="Total PnL"
                    value={`$${totalPnL.toFixed(2)}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    trend={totalPnL >= 0 ? "+5.2%" : "-2.1%"}
                    trendDirection={totalPnL >= 0 ? "up" : "down"}
                />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="masters" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="masters">Master Traders</TabsTrigger>
                    <TabsTrigger value="copies">My Copies</TabsTrigger>
                </TabsList>

                <TabsContent value="masters" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters & Search
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-low" />
                                    <Input
                                        placeholder="Search masters..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={riskFilter} onValueChange={setRiskFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Risk Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Risk Levels</SelectItem>
                                        <SelectItem value="low">Low Risk</SelectItem>
                                        <SelectItem value="medium">Medium Risk</SelectItem>
                                        <SelectItem value="high">High Risk</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rating">Rating</SelectItem>
                                        <SelectItem value="followers">Followers</SelectItem>
                                        <SelectItem value="winRate">Win Rate</SelectItem>
                                        <SelectItem value="totalPnL">Total PnL</SelectItem>
                                        <SelectItem value="monthlyPnL">Monthly PnL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Masters Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sortedMasters.map((master) => (
                            <Card key={master.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">{master.avatar}</div>
                                            <div>
                                                <CardTitle className="text-xl">{master.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-4 w-4 ${i < Math.floor(master.rating)
                                                                        ? 'text-yellow-500 fill-current'
                                                                        : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-text-low">({master.rating})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={getRiskColor(master.riskLevel)}>
                                                {master.riskLevel.charAt(0).toUpperCase() + master.riskLevel.slice(1)} Risk
                                            </Badge>
                                            <Badge className={getStatusColor(master.status)}>
                                                {master.status.charAt(0).toUpperCase() + master.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-hi">{master.followers.toLocaleString()}</div>
                                            <div className="text-sm text-text-low">Followers</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-hi">{master.totalTrades}</div>
                                            <div className="text-sm text-text-low">Total Trades</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-hi">{master.winRate}%</div>
                                            <div className="text-sm text-text-low">Win Rate</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-hi">{master.maxDrawdown}%</div>
                                            <div className="text-sm text-text-low">Max Drawdown</div>
                                        </div>
                                    </div>

                                    {/* PnL Display */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-low">Total PnL:</span>
                                            <span className={`font-semibold ${master.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${master.totalPnL.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-low">Monthly PnL:</span>
                                            <span className={`font-semibold ${master.monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${master.monthlyPnL.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Copy Trading Controls */}
                                    {master.isFollowing ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Copy Amount:</span>
                                                <Input
                                                    type="number"
                                                    value={master.copyAmount}
                                                    onChange={(e) => handleCopyAmountChange(master.id, parseFloat(e.target.value))}
                                                    className="w-24 text-right"
                                                    min="0"
                                                    step="100"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Copy %:</span>
                                                <Input
                                                    type="number"
                                                    value={master.copyPercentage}
                                                    onChange={(e) => handleCopyPercentageChange(master.id, parseFloat(e.target.value))}
                                                    className="w-20 text-right"
                                                    min="0"
                                                    max="100"
                                                    step="5"
                                                />
                                            </div>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleUnfollow(master.id)}
                                                className="w-full flex items-center gap-2"
                                            >
                                                <UserX className="h-4 w-4" />
                                                Stop Following
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Copy Amount:</span>
                                                <Input
                                                    type="number"
                                                    placeholder="1000"
                                                    className="w-24 text-right"
                                                    min="0"
                                                    step="100"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Copy %:</span>
                                                <Input
                                                    type="number"
                                                    placeholder="15"
                                                    className="w-20 text-right"
                                                    min="0"
                                                    max="100"
                                                    step="5"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleFollow(master.id)}
                                                className="w-full flex items-center gap-2"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                                Start Following
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="copies" className="space-y-4">
                    {/* Copy Trades Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Copy Trading Performance</CardTitle>
                            <CardDescription>Overview of your copied trades and performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <PnLChart data={copyTrades} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Copy Trades Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Copy Trades</CardTitle>
                            <CardDescription>Currently open positions from your followed masters</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={copyTrades.filter(trade => trade.status === 'open')}
                                columns={[
                                    { key: 'masterName', label: 'Master' },
                                    { key: 'symbol', label: 'Symbol' },
                                    { key: 'side', label: 'Side' },
                                    { key: 'entryPrice', label: 'Entry Price' },
                                    { key: 'currentPrice', label: 'Current Price' },
                                    { key: 'quantity', label: 'Quantity' },
                                    { key: 'pnl', label: 'PnL' },
                                    { key: 'pnlPercentage', label: 'PnL %' },
                                    { key: 'status', label: 'Status' }
                                ]}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
