import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const strategySchema = z.object({
  name: z.string().min(1, "Strategy name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long"),
  type: z.enum(["arbitrage", "copy-trading", "grid", "dca", "custom"]),
  baseAsset: z.string().min(1, "Base asset is required"),
  quoteAsset: z.string().min(1, "Quote asset is required"),
  exchanges: z.array(z.string()).min(1, "At least one exchange is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  maxInvestment: z.number().min(0.01, "Investment must be at least 0.01"),
  minSpread: z.number().min(0.001, "Min spread must be at least 0.001%"),
  maxSlippage: z.number().min(0.01, "Max slippage must be at least 0.01%"),
  enableStopLoss: z.boolean().default(true),
  stopLossPercent: z.number().min(0.1, "Stop loss must be at least 0.1%"),
  enableTakeProfit: z.boolean().default(true),
  takeProfitPercent: z.number().min(0.1, "Take profit must be at least 0.1%"),
  autoRebalance: z.boolean().default(false),
  rebalanceInterval: z.number().min(1, "Rebalance interval must be at least 1 hour"),
  isActive: z.boolean().default(true),
});

type StrategyFormData = z.infer<typeof strategySchema>;

interface StrategyFormProps {
  onSubmit: (data: StrategyFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<StrategyFormData>;
  loading?: boolean;
  className?: string;
}

const STRATEGY_TYPES = [
  { value: "arbitrage", label: "Arbitrage", description: "CEX ↔ DEX price differences" },
  { value: "copy-trading", label: "Copy Trading", description: "Follow successful traders" },
  { value: "grid", label: "Grid Trading", description: "Automated buy/sell grid" },
  { value: "dca", label: "Dollar Cost Average", description: "Regular investment intervals" },
  { value: "custom", label: "Custom Strategy", description: "User-defined logic" },
];

const RISK_LEVELS = [
  { value: "low", label: "Low Risk", description: "Conservative, lower returns" },
  { value: "medium", label: "Medium Risk", description: "Balanced risk/reward" },
  { value: "high", label: "High Risk", description: "Aggressive, higher returns" },
];

const AVAILABLE_EXCHANGES = [
  "binance", "bybit", "kraken", "coinbase", "bitstamp", "kucoin"
];

const AVAILABLE_ASSETS = [
  "BTC", "ETH", "SOL", "USDT", "USDC", "BNB", "ADA", "DOT", "LINK", "MATIC"
];

export function StrategyForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  loading = false,
  className 
}: StrategyFormProps) {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(
    initialData?.exchanges || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "arbitrage",
      baseAsset: initialData?.baseAsset || "",
      quoteAsset: initialData?.quoteAsset || "",
      exchanges: initialData?.exchanges || [],
      riskLevel: initialData?.riskLevel || "medium",
      maxInvestment: initialData?.maxInvestment || 100,
      minSpread: initialData?.minSpread || 0.5,
      maxSlippage: initialData?.maxSlippage || 0.5,
      enableStopLoss: initialData?.enableStopLoss ?? true,
      stopLossPercent: initialData?.stopLossPercent || 2,
      enableTakeProfit: initialData?.enableTakeProfit ?? true,
      takeProfitPercent: initialData?.takeProfitPercent || 6,
      autoRebalance: initialData?.autoRebalance ?? false,
      rebalanceInterval: initialData?.rebalanceInterval || 24,
      isActive: initialData?.isActive ?? true,
    },
  });

  const watchedValues = watch();
  const strategyType = watchedValues.type;

  const handleFormSubmit = async (data: StrategyFormData) => {
    try {
      const formData = { ...data, exchanges: selectedExchanges };
      await onSubmit(formData);
      reset();
      setSelectedExchanges([]);
    } catch (error) {
      console.error("Failed to submit strategy:", error);
    }
  };

  const toggleExchange = (exchange: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchange) 
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
  };

  const getStrategyTypeInfo = (type: string) => {
    return STRATEGY_TYPES.find(t => t.value === type);
  };

  const getRiskLevelInfo = (level: string) => {
    return RISK_LEVELS.find(r => r.value === level);
  };

  return (
    <Card className={cn("w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle>Create Trading Strategy</CardTitle>
        <div className="text-sm text-muted-foreground">
          Configure automated trading strategies with risk management and execution parameters
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Strategy Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Solana Arbitrage"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Strategy Type *</Label>
                <Select value={watchedValues.type} onValueChange={(value) => setValue("type", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your strategy and objectives..."
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Trading Pair */}
          <div className="space-y-4">
            <h3 className="font-medium">Trading Pair</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseAsset">Base Asset *</Label>
                <Select value={watchedValues.baseAsset} onValueChange={(value) => setValue("baseAsset", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ASSETS.map((asset) => (
                      <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.baseAsset && (
                  <p className="text-sm text-red-600">{errors.baseAsset.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quoteAsset">Quote Asset *</Label>
                <Select value={watchedValues.quoteAsset} onValueChange={(value) => setValue("quoteAsset", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quote asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ASSETS.map((asset) => (
                      <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.quoteAsset && (
                  <p className="text-sm text-red-600">{errors.quoteAsset.message}</p>
                )}
              </div>
            </div>

            {watchedValues.baseAsset && watchedValues.quoteAsset && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">
                  Trading Pair: {watchedValues.baseAsset}/{watchedValues.quoteAsset}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getStrategyTypeInfo(strategyType)?.description}
                </div>
              </div>
            )}
          </div>

          {/* Exchange Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Exchanges *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_EXCHANGES.map((exchange) => (
                <button
                  key={exchange}
                  type="button"
                  onClick={() => toggleExchange(exchange)}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-colors",
                    selectedExchanges.includes(exchange)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium capitalize">{exchange}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedExchanges.includes(exchange) ? "Selected" : "Click to select"}
                  </div>
                </button>
              ))}
            </div>
            {errors.exchanges && (
              <p className="text-sm text-red-600">{errors.exchanges.message}</p>
            )}
          </div>

          {/* Risk Management */}
          <div className="space-y-4">
            <h3 className="font-medium">Risk Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level *</Label>
                <Select value={watchedValues.riskLevel} onValueChange={(value) => setValue("riskLevel", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.riskLevel && (
                  <p className="text-sm text-red-600">{errors.riskLevel.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxInvestment">Max Investment (USD) *</Label>
                <Input
                  id="maxInvestment"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("maxInvestment", { valueAsNumber: true })}
                  placeholder="100.00"
                  className={errors.maxInvestment ? "border-red-500" : ""}
                />
                {errors.maxInvestment && (
                  <p className="text-sm text-red-600">{errors.maxInvestment.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSpread">Minimum Spread (%) *</Label>
                <Input
                  id="minSpread"
                  type="number"
                  step="0.001"
                  min="0.001"
                  {...register("minSpread", { valueAsNumber: true })}
                  placeholder="0.5"
                  className={errors.minSpread ? "border-red-500" : ""}
                />
                {errors.minSpread && (
                  <p className="text-sm text-red-600">{errors.minSpread.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSlippage">Max Slippage (%) *</Label>
                <Input
                  id="maxSlippage"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("maxSlippage", { valueAsNumber: true })}
                  placeholder="0.5"
                  className={errors.maxSlippage ? "border-red-500" : ""}
                />
                {errors.maxSlippage && (
                  <p className="text-sm text-red-600">{errors.maxSlippage.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="space-y-4">
            <h3 className="font-medium">Stop Loss & Take Profit</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableStopLoss"
                    checked={watchedValues.enableStopLoss}
                    onCheckedChange={(checked) => setValue("enableStopLoss", checked)}
                  />
                  <Label htmlFor="enableStopLoss">Enable Stop Loss</Label>
                </div>
                
                {watchedValues.enableStopLoss && (
                  <div className="space-y-2">
                    <Label htmlFor="stopLossPercent">Stop Loss (%)</Label>
                    <Input
                      id="stopLossPercent"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      {...register("stopLossPercent", { valueAsNumber: true })}
                      className="w-32"
                    />
                    {errors.stopLossPercent && (
                      <p className="text-sm text-red-600">{errors.stopLossPercent.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTakeProfit"
                    checked={watchedValues.enableTakeProfit}
                    onCheckedChange={(checked) => setValue("enableTakeProfit", checked)}
                  />
                  <Label htmlFor="enableTakeProfit">Enable Take Profit</Label>
                </div>
                
                {watchedValues.enableTakeProfit && (
                  <div className="space-y-2">
                    <Label htmlFor="takeProfitPercent">Take Profit (%)</Label>
                    <Input
                      id="takeProfitPercent"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      {...register("takeProfitPercent", { valueAsNumber: true })}
                      className="w-32"
                    />
                    {errors.takeProfitPercent && (
                      <p className="text-sm text-red-600">{errors.takeProfitPercent.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRebalance"
                    checked={watchedValues.autoRebalance}
                    onCheckedChange={(checked) => setValue("autoRebalance", checked)}
                  />
                  <Label htmlFor="autoRebalance">Auto Rebalance</Label>
                </div>
                
                {watchedValues.autoRebalance && (
                  <div className="space-y-2">
                    <Label htmlFor="rebalanceInterval">Rebalance Interval (hours)</Label>
                    <Input
                      id="rebalanceInterval"
                      type="number"
                      min="1"
                      max="168"
                      {...register("rebalanceInterval", { valueAsNumber: true })}
                      className="w-32"
                    />
                    {errors.rebalanceInterval && (
                      <p className="text-sm text-red-600">{errors.rebalanceInterval.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={watchedValues.isActive}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Strategy Active</Label>
                </div>
                <div className="text-xs text-muted-foreground">
                  Enable/disable strategy execution
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Summary */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-3">Strategy Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium capitalize">{watchedValues.type}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Risk:</span>
                <div className="font-medium capitalize">{watchedValues.riskLevel}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Exchanges:</span>
                <div className="font-medium">{selectedExchanges.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Investment:</span>
                <div className="font-medium">${watchedValues.maxInvestment}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="submit"
              disabled={loading || !isValid || selectedExchanges.length === 0}
            >
              {loading ? "Creating..." : "Create Strategy"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
