import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const riskLimitsSchema = z.object({
    maxPositionSize: z.number().min(0.01, "Position size must be at least 0.01%").max(100, "Position size cannot exceed 100%"),
    maxDailyLoss: z.number().min(0.1, "Daily loss limit must be at least 0.1%").max(50, "Daily loss limit cannot exceed 50%"),
    maxDrawdown: z.number().min(1, "Max drawdown must be at least 1%").max(100, "Max drawdown cannot exceed 100%"),
    stopLossPercent: z.number().min(0.1, "Stop loss must be at least 0.1%").max(50, "Stop loss cannot exceed 50%"),
    takeProfitPercent: z.number().min(0.1, "Take profit must be at least 0.1%").max(100, "Take profit cannot exceed 100%"),
    maxSlippage: z.number().min(0.01, "Max slippage must be at least 0.01%").max(10, "Max slippage cannot exceed 10%"),
    enableStopLoss: z.boolean().default(true),
    enableTakeProfit: z.boolean().default(true),
    enableTrailingStop: z.boolean().default(false),
    trailingStopPercent: z.number().min(0.1, "Trailing stop must be at least 0.1%").max(20, "Trailing stop cannot exceed 20%"),
    maxOpenPositions: z.number().min(1, "Must allow at least 1 position").max(100, "Cannot exceed 100 positions"),
    cooldownMinutes: z.number().min(0, "Cooldown cannot be negative").max(1440, "Cooldown cannot exceed 24 hours"),
});

type RiskLimitsFormData = z.infer<typeof riskLimitsSchema>;

interface RiskLimitsFormProps {
    onSubmit: (data: RiskLimitsFormData) => Promise<void>;
    onCancel?: () => void;
    initialData?: Partial<RiskLimitsFormData>;
    loading?: boolean;
    className?: string;
}

export function RiskLimitsForm({
    onSubmit,
    onCancel,
    initialData,
    loading = false,
    className
}: RiskLimitsFormProps) {
    const [previewMode, setPreviewMode] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        watch,
        reset,
    } = useForm<RiskLimitsFormData>({
        resolver: zodResolver(riskLimitsSchema),
        defaultValues: {
            maxPositionSize: initialData?.maxPositionSize || 5,
            maxDailyLoss: initialData?.maxDailyLoss || 2,
            maxDrawdown: initialData?.maxDrawdown || 10,
            stopLossPercent: initialData?.stopLossPercent || 2,
            takeProfitPercent: initialData?.takeProfitPercent || 6,
            maxSlippage: initialData?.maxSlippage || 0.5,
            enableStopLoss: initialData?.enableStopLoss ?? true,
            enableTakeProfit: initialData?.enableTakeProfit ?? true,
            enableTrailingStop: initialData?.enableTrailingStop ?? false,
            trailingStopPercent: initialData?.trailingStopPercent || 1,
            maxOpenPositions: initialData?.maxOpenPositions || 5,
            cooldownMinutes: initialData?.cooldownMinutes || 30,
        },
    });

    const watchedValues = watch();

    const handleFormSubmit = async (data: RiskLimitsFormData) => {
        try {
            await onSubmit(data);
            reset();
        } catch (error) {
            console.error("Failed to submit risk limits:", error);
        }
    };

    const calculateRiskMetrics = (data: RiskLimitsFormData) => {
        const maxDailyLoss = data.maxDailyLoss;
        const maxDrawdown = data.maxDrawdown;
        const positionSize = data.maxPositionSize;

        // Simple risk calculation examples
        const riskScore = Math.round((maxDailyLoss + maxDrawdown + positionSize) / 3);
        const riskLevel = riskScore < 5 ? "Low" : riskScore < 15 ? "Medium" : "High";

        return { riskScore, riskLevel };
    };

    const { riskScore, riskLevel } = calculateRiskMetrics(watchedValues);

    const getRiskColor = (level: string) => {
        switch (level) {
            case "Low": return "text-green-600 bg-green-100";
            case "Medium": return "text-yellow-600 bg-yellow-100";
            case "High": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    if (previewMode) {
        return (
            <Card className={cn("w-full max-w-2xl", className)}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Risk Limits Preview</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewMode(false)}
                        >
                            Edit
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Risk Summary */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Risk Assessment</span>
                            <Badge className={cn("px-3 py-1", getRiskColor(riskLevel))}>
                                {riskLevel} Risk
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Risk Score:</span>
                                <div className="font-medium">{riskScore}/30</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Max Daily Loss:</span>
                                <div className="font-medium">{watchedValues.maxDailyLoss}%</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Max Drawdown:</span>
                                <div className="font-medium">{watchedValues.maxDrawdown}%</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Position Size:</span>
                                <div className="font-medium">{watchedValues.maxPositionSize}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Limits Summary */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Configured Limits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Stop Loss</div>
                                <div className="font-medium">{watchedValues.stopLossPercent}%</div>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Take Profit</div>
                                <div className="font-medium">{watchedValues.takeProfitPercent}%</div>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Max Slippage</div>
                                <div className="font-medium">{watchedValues.maxSlippage}%</div>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Open Positions</div>
                                <div className="font-medium">{watchedValues.maxOpenPositions}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => handleFormSubmit(watchedValues)}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? "Saving..." : "Save Risk Limits"}
                        </Button>
                        {onCancel && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle>Risk Management Settings</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Configure risk limits to protect your capital and manage trading exposure
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Position Sizing */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Position Sizing</h3>

                        <div className="space-y-2">
                            <Label htmlFor="maxPositionSize">Maximum Position Size (%)</Label>
                            <div className="flex items-center gap-3">
                                <Slider
                                    value={[watchedValues.maxPositionSize]}
                                    onValueChange={([value]) => setValue("maxPositionSize", value)}
                                    max={100}
                                    min={0.01}
                                    step={0.01}
                                    className="flex-1"
                                />
                                <Input
                                    id="maxPositionSize"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="100"
                                    {...register("maxPositionSize", { valueAsNumber: true })}
                                    className="w-20"
                                />
                            </div>
                            {errors.maxPositionSize && (
                                <p className="text-sm text-red-600">{errors.maxPositionSize.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxOpenPositions">Maximum Open Positions</Label>
                            <Input
                                id="maxOpenPositions"
                                type="number"
                                min="1"
                                max="100"
                                {...register("maxOpenPositions", { valueAsNumber: true })}
                                className="w-32"
                            />
                            {errors.maxOpenPositions && (
                                <p className="text-sm text-red-600">{errors.maxOpenPositions.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Loss Limits */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Loss Limits</h3>

                        <div className="space-y-2">
                            <Label htmlFor="maxDailyLoss">Maximum Daily Loss (%)</Label>
                            <div className="flex items-center gap-3">
                                <Slider
                                    value={[watchedValues.maxDailyLoss]}
                                    onValueChange={([value]) => setValue("maxDailyLoss", value)}
                                    max={50}
                                    min={0.1}
                                    step={0.1}
                                    className="flex-1"
                                />
                                <Input
                                    id="maxDailyLoss"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="50"
                                    {...register("maxDailyLoss", { valueAsNumber: true })}
                                    className="w-20"
                                />
                            </div>
                            {errors.maxDailyLoss && (
                                <p className="text-sm text-red-600">{errors.maxDailyLoss.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxDrawdown">Maximum Drawdown (%)</Label>
                            <div className="flex items-center gap-3">
                                <Slider
                                    value={[watchedValues.maxDrawdown]}
                                    onValueChange={([value]) => setValue("maxDrawdown", value)}
                                    max={100}
                                    min={1}
                                    step={1}
                                    className="flex-1"
                                />
                                <Input
                                    id="maxDrawdown"
                                    type="number"
                                    min="1"
                                    max="100"
                                    {...register("maxDrawdown", { valueAsNumber: true })}
                                    className="w-20"
                                />
                            </div>
                            {errors.maxDrawdown && (
                                <p className="text-sm text-red-600">{errors.maxDrawdown.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Stop Loss & Take Profit */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Stop Loss & Take Profit</h3>

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

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enableTrailingStop"
                                checked={watchedValues.enableTrailingStop}
                                onCheckedChange={(checked) => setValue("enableTrailingStop", checked)}
                            />
                            <Label htmlFor="enableTrailingStop">Enable Trailing Stop</Label>
                        </div>

                        {watchedValues.enableTrailingStop && (
                            <div className="space-y-2">
                                <Label htmlFor="trailingStopPercent">Trailing Stop (%)</Label>
                                <Input
                                    id="trailingStopPercent"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="20"
                                    {...register("trailingStopPercent", { valueAsNumber: true })}
                                    className="w-32"
                                />
                                {errors.trailingStopPercent && (
                                    <p className="text-sm text-red-600">{errors.trailingStopPercent.message}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Trading Settings */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Trading Settings</h3>

                        <div className="space-y-2">
                            <Label htmlFor="maxSlippage">Maximum Slippage (%)</Label>
                            <Input
                                id="maxSlippage"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="10"
                                {...register("maxSlippage", { valueAsNumber: true })}
                                className="w-32"
                            />
                            {errors.maxSlippage && (
                                <p className="text-sm text-red-600">{errors.maxSlippage.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cooldownMinutes">Cooldown Period (minutes)</Label>
                            <Input
                                id="cooldownMinutes"
                                type="number"
                                min="0"
                                max="1440"
                                {...register("cooldownMinutes", { valueAsNumber: true })}
                                className="w-32"
                            />
                            {errors.cooldownMinutes && (
                                <p className="text-sm text-red-600">{errors.cooldownMinutes.message}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Wait time between trades after hitting loss limits
                            </div>
                        </div>
                    </div>

                    {/* Risk Warning */}
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertDescription className="text-orange-800">
                            <strong>Warning:</strong> These settings will automatically stop trading when limits are reached.
                            Review carefully before saving.
                        </AlertDescription>
                    </Alert>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPreviewMode(true)}
                            disabled={!isValid}
                        >
                            Preview
                        </Button>
                        <div className="flex-1" />
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
                        <Button
                            type="submit"
                            disabled={loading || !isValid}
                        >
                            {loading ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
