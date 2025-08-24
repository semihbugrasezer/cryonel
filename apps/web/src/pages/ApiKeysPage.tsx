// apps/web/src/pages/ApiKeysPage.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/apiService';
import { CEXApiKey } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { StatBadge } from '../components/common/StatBadge';
import { LatencyPill } from '../components/common/LatencyPill';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    TestTube,
    Copy,
    CheckCircle,
    AlertCircle,
    Clock
} from 'lucide-react';

interface ApiKeyFormData {
    name: string;
    exchange: string;
    apiKey: string;
    secretKey: string;
    passphrase?: string;
    sandbox: boolean;
}

const EXCHANGES = [
    { value: 'binance', label: 'Binance', icon: '🔸' },
    { value: 'coinbase', label: 'Coinbase Pro', icon: '🟦' },
    { value: 'kraken', label: 'Kraken', icon: '🔷' },
    { value: 'kucoin', label: 'KuCoin', icon: '🟨' },
    { value: 'okx', label: 'OKX', icon: '🟣' },
    { value: 'bybit', label: 'Bybit', icon: '🟢' },
    { value: 'gate', label: 'Gate.io', icon: '🟠' },
    { value: 'huobi', label: 'Huobi', icon: '🔴' },
];

export default function ApiKeysPage() {
    const { user } = useAuthStore();
    const [apiKeys, setApiKeys] = useState<CEXApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState<ApiKeyFormData>({
        name: '',
        exchange: '',
        apiKey: '',
        secretKey: '',
        passphrase: '',
        sandbox: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadApiKeys();
    }, []);

    const loadApiKeys = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.getApiKeys();
            if (response.success && response.data) {
                setApiKeys(response.data);
            }
        } catch (error) {
            console.error('Failed to load API keys:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.exchange) {
            newErrors.exchange = 'Exchange is required';
        }

        if (!formData.apiKey.trim()) {
            newErrors.apiKey = 'API Key is required';
        }

        if (!formData.secretKey.trim()) {
            newErrors.secretKey = 'Secret Key is required';
        }

        if (formData.exchange === 'kraken' && !formData.passphrase?.trim()) {
            newErrors.passphrase = 'Passphrase is required for Kraken';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editingId) {
                // Update existing API key
                const response = await apiService.updateApiKey(editingId, {
                    name: formData.name,
                    exchange: formData.exchange,
                    sandbox: formData.sandbox,
                });

                if (response.success) {
                    setApiKeys(prev => prev.map(key =>
                        key.id === editingId ? { ...key, ...response.data } : key
                    ));
                    resetForm();
                }
            } else {
                // Add new API key
                const response = await apiService.addApiKey({
                    name: formData.name,
                    exchange: formData.exchange,
                    key_enc: formData.apiKey, // These should be encrypted in real implementation
                    secret_enc: formData.secretKey,
                    can_withdraw: false,
                    permissions: ['read', 'trade'],
                    passphrase: formData.passphrase,
                    sandbox: formData.sandbox,
                });

                if (response.success && response.data) {
                    setApiKeys(prev => [...prev, response.data]);
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    };

    const handleEdit = (apiKey: CEXApiKey) => {
        setEditingId(apiKey.id);
        setFormData({
            name: apiKey.name,
            exchange: apiKey.exchange,
            apiKey: apiKey.apiKey,
            secretKey: apiKey.secretKey,
            passphrase: apiKey.passphrase || '',
            sandbox: apiKey.sandbox,
        });
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiService.deleteApiKey(id);
            if (response.success) {
                setApiKeys(prev => prev.filter(key => key.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };

    const handleTest = async (id: string) => {
        try {
            const response = await apiService.testApiKey(id);
            if (response.success && response.data) {
                // Update the API key with test results
                setApiKeys(prev => prev.map(key =>
                    key.id === id ? { ...key, lastTested: new Date().toISOString() } : key
                ));

                // Show success notification
                alert(`API key test successful! Latency: ${response.data.latency}ms`);
            }
        } catch (error) {
            console.error('Failed to test API key:', error);
            alert('API key test failed. Please check your credentials.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            exchange: '',
            apiKey: '',
            secretKey: '',
            passphrase: '',
            sandbox: false,
        });
        setErrors({});
        setEditingId(null);
        setIsAdding(false);
    };

    const toggleSecretVisibility = (id: string) => {
        setShowSecrets(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    const getExchangeIcon = (exchange: string) => {
        const ex = EXCHANGES.find(e => e.value === exchange);
        return ex ? ex.icon : '🔗';
    };

    const getExchangeLabel = (exchange: string) => {
        const ex = EXCHANGES.find(e => e.value === exchange);
        return ex ? ex.label : exchange;
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
                    <h1 className="text-2xl font-bold text-text-hi">API Keys</h1>
                    <p className="text-text-low">Manage your exchange API connections</p>
                </div>

                <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add API Key
                </Button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-hi">
                            {editingId ? 'Edit API Key' : 'Add New API Key'}
                        </h3>
                        <Button variant="ghost" onClick={resetForm} size="sm">
                            Cancel
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="My Binance Account"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="exchange">Exchange</Label>
                                <select
                                    id="exchange"
                                    name="exchange"
                                    value={formData.exchange}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md bg-bg-1 text-text-hi ${errors.exchange ? 'border-red-500' : 'border-border'
                                        }`}
                                >
                                    <option value="">Select Exchange</option>
                                    {EXCHANGES.map(exchange => (
                                        <option key={exchange.value} value={exchange.value}>
                                            {exchange.icon} {exchange.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.exchange && <p className="text-sm text-red-500 mt-1">{errors.exchange}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="apiKey">API Key</Label>
                                <Input
                                    id="apiKey"
                                    name="apiKey"
                                    value={formData.apiKey}
                                    onChange={handleInputChange}
                                    placeholder="Enter your API key"
                                    className={errors.apiKey ? 'border-red-500' : ''}
                                />
                                {errors.apiKey && <p className="text-sm text-red-500 mt-1">{errors.apiKey}</p>}
                            </div>

                            <div>
                                <Label htmlFor="secretKey">Secret Key</Label>
                                <Input
                                    id="secretKey"
                                    name="secretKey"
                                    type="password"
                                    value={formData.secretKey}
                                    onChange={handleInputChange}
                                    placeholder="Enter your secret key"
                                    className={errors.secretKey ? 'border-red-500' : ''}
                                />
                                {errors.secretKey && <p className="text-sm text-red-500 mt-1">{errors.secretKey}</p>}
                            </div>
                        </div>

                        {formData.exchange === 'kraken' && (
                            <div>
                                <Label htmlFor="passphrase">Passphrase</Label>
                                <Input
                                    id="passphrase"
                                    name="passphrase"
                                    value={formData.passphrase}
                                    onChange={handleInputChange}
                                    placeholder="Enter your passphrase"
                                    className={errors.passphrase ? 'border-red-500' : ''}
                                />
                                {errors.passphrase && <p className="text-sm text-red-500 mt-1">{errors.passphrase}</p>}
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="sandbox"
                                name="sandbox"
                                checked={formData.sandbox}
                                onChange={handleInputChange}
                                className="rounded border-border"
                            />
                            <Label htmlFor="sandbox">Use Sandbox/Testnet</Label>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                {editingId ? 'Update API Key' : 'Add API Key'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* API Keys List */}
            <div className="space-y-4">
                {apiKeys.length === 0 ? (
                    <Card className="p-8 text-center">
                        <div className="text-text-low">
                            <p className="text-lg mb-2">No API keys configured</p>
                            <p className="text-sm">Add your first exchange API key to start trading</p>
                        </div>
                    </Card>
                ) : (
                    apiKeys.map((apiKey) => (
                        <Card key={apiKey.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{getExchangeIcon(apiKey.exchange)}</div>
                                    <div>
                                        <h4 className="font-medium text-text-hi">{apiKey.name}</h4>
                                        <p className="text-sm text-text-low">{getExchangeLabel(apiKey.exchange)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <StatBadge
                                        variant={apiKey.status === 'connected' ? 'default' : 'destructive'}
                                        text={apiKey.status}
                                    />
                                    {apiKey.sandbox && (
                                        <StatBadge variant="secondary" text="Sandbox" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-text-low">API Key:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            value={showSecrets[apiKey.id] ? apiKey.apiKey : '••••••••••••••••'}
                                            readOnly
                                            className="text-xs"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleSecretVisibility(apiKey.id)}
                                        >
                                            {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(apiKey.apiKey)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-text-low">Last Tested:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {apiKey.lastTested ? (
                                            <>
                                                <Clock className="h-4 w-4 text-text-low" />
                                                <span className="text-text-hi">
                                                    {new Date(apiKey.lastTested).toLocaleDateString()}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-text-low">Never tested</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-text-low">Created:</span>
                                    <div className="mt-1 text-text-hi">
                                        {new Date(apiKey.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTest(apiKey.id)}
                                        className="flex items-center gap-2"
                                    >
                                        <TestTube className="h-4 w-4" />
                                        Test Connection
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(apiKey)}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(apiKey.id)}
                                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
