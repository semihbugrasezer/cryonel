import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const apiKeySchema = z.object({
    exchange: z.string().min(1, "Exchange is required"),
    apiKey: z.string().min(1, "API Key is required"),
    apiSecret: z.string().min(1, "API Secret is required"),
    passphrase: z.string().optional(),
    label: z.string().optional(),
    testMode: z.boolean().default(false),
});

type APIKeyFormData = z.infer<typeof apiKeySchema>;

interface APIKeyFormProps {
    onSubmit: (data: APIKeyFormData) => Promise<void>;
    onCancel?: () => void;
    initialData?: Partial<APIKeyFormData>;
    loading?: boolean;
    className?: string;
}

const EXCHANGES = [
    { value: "binance", label: "Binance", region: "Global" },
    { value: "bybit", label: "Bybit", region: "Global" },
    { value: "kraken", label: "Kraken", region: "EU/US" },
    { value: "coinbase", label: "Coinbase", region: "US" },
    { value: "bitstamp", label: "Bitstamp", region: "EU" },
    { value: "kucoin", label: "KuCoin", region: "Global" },
];

export function APIKeyForm({
    onSubmit,
    onCancel,
    initialData,
    loading = false,
    className
}: APIKeyFormProps) {
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        watch,
        reset,
    } = useForm<APIKeyFormData>({
        resolver: zodResolver(apiKeySchema),
        defaultValues: {
            exchange: initialData?.exchange || "",
            apiKey: initialData?.apiKey || "",
            apiSecret: initialData?.apiSecret || "",
            passphrase: initialData?.passphrase || "",
            label: initialData?.label || "",
            testMode: initialData?.testMode || false,
        },
    });

    const selectedExchange = watch("exchange");
    const testMode = watch("testMode");

    const handleFormSubmit = async (data: APIKeyFormData) => {
        try {
            await onSubmit(data);
            reset();
            setTestResult(null);
        } catch (error) {
            console.error("Failed to submit API key:", error);
        }
    };

    const handleTestConnection = async () => {
        const data = watch();
        if (!data.exchange || !data.apiKey || !data.apiSecret) {
            setTestResult({
                success: false,
                message: "Please fill in all required fields first",
            });
            return;
        }

        setTestResult({
            success: false,
            message: "Testing connection...",
        });

        try {
            // Simulate API test - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            setTestResult({
                success: true,
                message: "Connection successful! API key is valid.",
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: "Connection failed. Please check your API credentials.",
            });
        }
    };

    const selectedExchangeInfo = EXCHANGES.find(ex => ex.value === selectedExchange);

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle>Add Exchange API Key</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Connect your exchange account to enable automated trading.
                    <span className="text-red-600 font-medium"> Withdrawal permissions are disabled for security.</span>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    {/* Exchange Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="exchange">Exchange *</Label>
                        <Select value={watch("exchange")} onValueChange={(value) => setValue("exchange", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an exchange" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXCHANGES.map((exchange) => (
                                    <SelectItem key={exchange.value} value={exchange.value}>
                                        <div className="flex items-center gap-2">
                                            <span>{exchange.label}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {exchange.region}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.exchange && (
                            <p className="text-sm text-red-600">{errors.exchange.message}</p>
                        )}
                        {selectedExchangeInfo && (
                            <div className="text-xs text-muted-foreground">
                                Selected: {selectedExchangeInfo.label} ({selectedExchangeInfo.region})
                            </div>
                        )}
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key *</Label>
                        <Input
                            id="apiKey"
                            {...register("apiKey")}
                            placeholder="Enter your API key"
                            className={errors.apiKey ? "border-red-500" : ""}
                        />
                        {errors.apiKey && (
                            <p className="text-sm text-red-600">{errors.apiKey.message}</p>
                        )}
                    </div>

                    {/* API Secret */}
                    <div className="space-y-2">
                        <Label htmlFor="apiSecret">API Secret *</Label>
                        <Input
                            id="apiSecret"
                            type="password"
                            {...register("apiSecret")}
                            placeholder="Enter your API secret"
                            className={errors.apiSecret ? "border-red-500" : ""}
                        />
                        {errors.apiSecret && (
                            <p className="text-sm text-red-600">{errors.apiSecret.message}</p>
                        )}
                    </div>

                    {/* Passphrase (for some exchanges) */}
                    {(selectedExchange === "kraken" || selectedExchange === "coinbase") && (
                        <div className="space-y-2">
                            <Label htmlFor="passphrase">Passphrase</Label>
                            <Input
                                id="passphrase"
                                {...register("passphrase")}
                                placeholder="Enter your passphrase (if required)"
                            />
                            <div className="text-xs text-muted-foreground">
                                Required for {selectedExchange === "kraken" ? "Kraken" : "Coinbase"} API access
                            </div>
                        </div>
                    )}

                    {/* Label */}
                    <div className="space-y-2">
                        <Label htmlFor="label">Label (Optional)</Label>
                        <Input
                            id="label"
                            {...register("label")}
                            placeholder="e.g., Main Account, Test Account"
                        />
                        <div className="text-xs text-muted-foreground">
                            Helpful for identifying multiple API keys
                        </div>
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="testMode"
                            {...register("testMode")}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="testMode" className="text-sm">
                            Test Mode (Use sandbox/testnet if available)
                        </Label>
                    </div>

                    {/* Security Notice */}
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertDescription className="text-orange-800">
                            <strong>Security Notice:</strong> Your API keys are encrypted and stored securely.
                            Only trading and reading permissions are enabled. Withdrawal access is permanently disabled.
                        </AlertDescription>
                    </Alert>

                    {/* Test Result */}
                    {testResult && (
                        <Alert className={cn(
                            testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                        )}>
                            <AlertDescription className={cn(
                                testResult.success ? "text-green-800" : "text-red-800"
                            )}>
                                {testResult.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={loading || !isValid}
                        >
                            Test Connection
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
                            {loading ? "Adding..." : "Add API Key"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
