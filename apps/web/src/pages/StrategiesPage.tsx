// apps/web/src/pages/StrategiesPage.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/apiService';
import { Strategy } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { StatBadge } from '../components/common/StatBadge';
import { DataTable } from '../components/common/DataTable';
import {
    Plus,
    Edit,
    Trash2,
    Play,
    Square,
    Settings,
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Target,
    AlertTriangle
} from 'lucide-react';

interface StrategyFormData {
    name: string;
    description: string;
    type: 'arbitrage' | 'grid' | 'dca' | 'momentum' | 'mean_reversion' | 'custom';
    symbols: string[];
    riskLevel: 'low' | 'medium' | 'high';
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    enabled: boolean;
}

const STRATEGY_TYPES = [
    { value: 'arbitrage', label: 'Arbitrage', icon: '⚡', description: 'Exploit price differences between exchanges' },
    { value: 'grid', label: 'Grid Trading', icon: '📊', description: 'Place orders at regular price intervals' },
    { value: 'dca', label: 'Dollar Cost Averaging', icon: '💰', description: 'Buy at regular intervals regardless of price' },
    { value: 'momentum', label: 'Momentum', icon: '🚀', description: 'Follow trending price movements' },
    { value: 'mean_reversion', label: 'Mean Reversion', icon: '🔄', description: 'Trade against extreme price movements' },
    { value: 'custom', label: 'Custom', icon: '⚙️', description: 'User-defined strategy logic' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Low Risk', color: 'success' },
    { value: 'medium', label: 'Medium Risk', color: 'warning' },
    { value: 'high', label: 'High Risk', color: 'error' },
];

export default function StrategiesPage() {
    const { user } = useAuthStore();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<StrategyFormData>({
        name: '',
        description: '',
        type: 'arbitrage',
        symbols: [],
        riskLevel: 'medium',
        maxPositionSize: 1000,
        stopLoss: 5,
        takeProfit: 10,
        enabled: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [symbolInput, setSymbolInput] = useState('');

    useEffect(() => {
        loadStrategies();
    }, []);

    const loadStrategies = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.getStrategies();
            if (response.success && response.data) {
                setStrategies(response.data);
            }
        } catch (error) {
            console.error('Failed to load strategies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddSymbol = () => {
        if (symbolInput.trim() && !formData.symbols.includes(symbolInput.trim().toUpperCase())) {
            setFormData(prev => ({
                ...prev,
                symbols: [...prev.symbols, symbolInput.trim().toUpperCase()],
            }));
            setSymbolInput('');
        }
    };

    const handleRemoveSymbol = (symbol: string) => {
        setFormData(prev => ({
            ...prev,
            symbols: prev.symbols.filter(s => s !== symbol),
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Strategy name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (formData.symbols.length === 0) {
            newErrors.symbols = 'At least one trading symbol is required';
        }

        if (formData.maxPositionSize <= 0) {
            newErrors.maxPositionSize = 'Position size must be greater than 0';
        }

        if (formData.stopLoss < 0 || formData.stopLoss > 100) {
            newErrors.stopLoss = 'Stop loss must be between 0 and 100';
        }

        if (formData.takeProfit < 0 || formData.takeProfit > 100) {
            newErrors.takeProfit = 'Take profit must be between 0 and 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editingId) {
                // Update existing strategy
                const response = await apiService.updateStrategy(editingId, {
                    name: formData.name,
                    description: formData.description,
                    type: formData.type,
                    symbols: formData.symbols,
                    riskLevel: formData.riskLevel,
                    maxPositionSize: formData.maxPositionSize,
                    stopLoss: formData.stopLoss,
                    takeProfit: formData.takeProfit,
                    enabled: formData.enabled,
                });

                if (response.success) {
                    setStrategies(prev => prev.map(strategy =>
                        strategy.id === editingId ? { ...strategy, ...response.data } : strategy
                    ));
                    resetForm();
                }
            } else {
                // Create new strategy
                const response = await apiService.createStrategy({
                    name: formData.name,
                    description: formData.description,
                    type: formData.type,
                    symbols: formData.symbols,
                    riskLevel: formData.riskLevel,
                    maxPositionSize: formData.maxPositionSize,
                    stopLoss: formData.stopLoss,
                    takeProfit: formData.takeProfit,
                    enabled: formData.enabled,
                });

                if (response.success && response.data) {
                    setStrategies(prev => [...prev, response.data]);
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Failed to save strategy:', error);
        }
    };

    const handleEdit = (strategy: Strategy) => {
        setEditingId(strategy.id);
        setFormData({
            name: strategy.name,
            description: strategy.description,
            type: strategy.type,
            symbols: strategy.symbols,
            riskLevel: strategy.riskLevel,
            maxPositionSize: strategy.maxPositionSize,
            stopLoss: strategy.stopLoss,
            takeProfit: strategy.takeProfit,
            enabled: strategy.enabled,
        });
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiService.deleteStrategy(id);
            if (response.success) {
                setStrategies(prev => prev.filter(strategy => strategy.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete strategy:', error);
        }
    };

    const handleStartStrategy = async (id: string) => {
        try {
            const response = await apiService.startStrategy(id);
            if (response.success) {
                setStrategies(prev => prev.map(strategy =>
                    strategy.id === id ? { ...strategy, status: 'running' } : strategy
                ));
            }
        } catch (error) {
            console.error('Failed to start strategy:', error);
        }
    };

    const handleStopStrategy = async (id: string) => {
        try {
            const response = await apiService.stopStrategy(id);
            if (response.success) {
                setStrategies(prev => prev.map(strategy =>
                    strategy.id === id ? { ...strategy, status: 'stopped' } : strategy
                ));
            }
        } catch (error) {
            console.error('Failed to stop strategy:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'arbitrage',
            symbols: [],
            riskLevel: 'medium',
            maxPositionSize: 1000,
            stopLoss: 5,
            takeProfit: 10,
            enabled: false,
        });
        setErrors({});
        setEditingId(null);
        setIsAdding(false);
        setSymbolInput('');
    };

    const getStrategyTypeInfo = (type: string) => {
        return STRATEGY_TYPES.find(t => t.value === type) || STRATEGY_TYPES[0];
    };

    const getRiskLevelInfo = (level: string) => {
        return RISK_LEVELS.find(r => r.value === level) || RISK_LEVELS[1];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-hi">Trading Strategies</h1>
                    <p className="text-text-low">Create and manage your automated trading strategies</p>
                </div>

                <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Strategy
                </Button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-hi">
                            {editingId ? 'Edit Strategy' : 'Create New Strategy'}
                        </h3>
                        <Button variant="ghost" onClick={resetForm} size="sm">
                            Cancel
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Strategy Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="My Arbitrage Strategy"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="type">Strategy Type</Label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-bg-1 text-text-hi border-border"
                                >
                                    {STRATEGY_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe your strategy..."
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md bg-bg-1 text-text-hi resize-none ${errors.description ? 'border-red-500' : 'border-border'
                                    }`}
                            />
                            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="riskLevel">Risk Level</Label>
                                <select
                                    id="riskLevel"
                                    name="riskLevel"
                                    value={formData.riskLevel}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-bg-1 text-text-hi border-border"
                                >
                                    {RISK_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="maxPositionSize">Max Position Size ($)</Label>
                                <Input
                                    id="maxPositionSize"
                                    name="maxPositionSize"
                                    type="number"
                                    value={formData.maxPositionSize}
                                    onChange={handleInputChange}
                                    placeholder="1000"
                                    className={errors.maxPositionSize ? 'border-red-500' : ''}
                                />
                                {errors.maxPositionSize && <p className="text-sm text-red-500 mt-1">{errors.maxPositionSize}</p>}
                            </div>

                            <div>
                                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                                <Input
                                    id="stopLoss"
                                    name="stopLoss"
                                    type="number"
                                    value={formData.stopLoss}
                                    onChange={handleInputChange}
                                    placeholder="5"
                                    className={errors.stopLoss ? 'border-red-500' : ''}
                                />
                                {errors.stopLoss && <p className="text-sm text-red-500 mt-1">{errors.stopLoss}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                                <Input
                                    id="takeProfit"
                                    name="takeProfit"
                                    type="number"
                                    value={formData.takeProfit}
                                    onChange={handleInputChange}
                                    placeholder="10"
                                    className={errors.takeProfit ? 'border-red-500' : ''}
                                />
                                {errors.takeProfit && <p className="text-sm text-red-500 mt-1">{errors.takeProfit}</p>}
                            </div>

                            <div>
                                <Label htmlFor="symbols">Trading Symbols</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={symbolInput}
                                        onChange={(e) => setSymbolInput(e.target.value)}
                                        placeholder="BTC/USDT"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymbol())}
                                    />
                                    <Button type="button" onClick={handleAddSymbol} variant="outline">
                                        Add
                                    </Button>
                                </div>
                                {formData.symbols.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.symbols.map(symbol => (
                                            <div key={symbol} className="flex items-center gap-1 bg-surf-1 px-2 py-1 rounded text-sm">
                                                <span>{symbol}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSymbol(symbol)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.symbols && <p className="text-sm text-red-500 mt-1">{errors.symbols}</p>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enabled"
                                name="enabled"
                                checked={formData.enabled}
                                onChange={handleInputChange}
                                className="rounded border-border"
                            />
                            <Label htmlFor="enabled">Enable strategy after creation</Label>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                {editingId ? 'Update Strategy' : 'Create Strategy'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Strategies List */}
            {strategies.length > 0 && (
                <DataTable
                    data={strategies}
                    columns={[
                        {
                            label: 'Strategy',
                            key: 'name',
                            cell: ({ row }) => {
                                const strategy = row.original;
                                const typeInfo = getStrategyTypeInfo(strategy.type);
                                return (
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{typeInfo.icon}</div>
                                        <div>
                                            <div className="font-medium text-text-hi">{strategy.name}</div>
                                            <div className="text-sm text-text-low">{typeInfo.label}</div>
                                        </div>
                                    </div>
                                );
                            },
                        },
                        {
                            label: 'Status',
                            key: 'status',
                            cell: ({ row }) => {
                                const status = row.original.status;
                                const variant = status === 'running' ? 'secondary' :
                                    status === 'stopped' ? 'outline' : 'destructive';
                                return (
                                    <StatBadge variant={variant}>{status}</StatBadge>
                                );
                            },
                        },
                        {
                            label: 'Symbols',
                            key: 'symbols',
                            cell: ({ row }) => (
                                <div className="flex flex-wrap gap-1">
                                    {row.original.symbols.slice(0, 3).map(symbol => (
                                        <span key={symbol} className="px-2 py-1 bg-surf-1 rounded text-xs">
                                            {symbol}
                                        </span>
                                    ))}
                                    {row.original.symbols.length > 3 && (
                                        <span className="px-2 py-1 bg-surf-1 rounded text-xs">
                                            +{row.original.symbols.length - 3}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            label: 'Risk',
                            key: 'riskLevel',
                            cell: ({ row }) => {
                                const riskInfo = getRiskLevelInfo(row.original.riskLevel);
                                return (
                                    <StatBadge variant={riskInfo.color as any}>{riskInfo.label}</StatBadge>
                                );
                            },
                        },
                        {
                            label: 'Performance',
                            key: 'pnl',
                            cell: ({ row }) => {
                                const pnl = row.original.pnl || 0;
                                return (
                                    <div className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                    </div>
                                );
                            },
                        },
                        {
                            label: 'Actions',
                            key: 'actions',
                            cell: ({ row }) => {
                                const strategy = row.original;
                                const isRunning = strategy.status === 'running';

                                return (
                                    <div className="flex items-center gap-2">
                                        {isRunning ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStopStrategy(strategy.id)}
                                                className="flex items-center gap-1 text-red-600"
                                            >
                                                <Square className="h-4 w-4" />
                                                Stop
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStartStrategy(strategy.id)}
                                                className="flex items-center gap-1 text-green-600"
                                            >
                                                <Play className="h-4 w-4" />
                                                Start
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(strategy)}
                                            className="flex items-center gap-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(strategy.id)}
                                            className="flex items-center gap-1 text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                );
                            },
                        },
                    ]}
                    searchable
                    sortable
                    pagination
                />
            )}

            {/* Empty State */}
            {strategies.length === 0 && !isAdding && (
                <Card className="p-8 text-center">
                    <div className="text-text-low">
                        <Settings className="h-16 w-16 mx-auto mb-4 text-text-low" />
                        <p className="text-lg mb-2">No strategies configured</p>
                        <p className="text-sm">Create your first trading strategy to start automated trading</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
