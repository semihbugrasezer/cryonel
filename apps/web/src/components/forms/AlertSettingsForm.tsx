import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const alertSettingsSchema = z.object({
  // Trading Alerts
  enableTradeAlerts: z.boolean().default(true),
  tradeThreshold: z.number().min(0.01, "Threshold must be at least 0.01%"),
  enableLossAlerts: z.boolean().default(true),
  lossThreshold: z.number().min(0.1, "Loss threshold must be at least 0.1%"),
  enableProfitAlerts: z.boolean().default(true),
  profitThreshold: z.number().min(0.1, "Profit threshold must be at least 0.1%"),
  
  // System Alerts
  enableSystemAlerts: z.boolean().default(true),
  enableConnectionAlerts: z.boolean().default(true),
  enableErrorAlerts: z.boolean().default(true),
  
  // Notification Methods
  enableEmail: z.boolean().default(false),
  emailAddress: z.string().email("Invalid email address").optional(),
  enablePush: z.boolean().default(true),
  enableSMS: z.boolean().default(false),
  phoneNumber: z.string().optional(),
  
  // Alert Frequency
  alertFrequency: z.enum(["immediate", "5min", "15min", "1hour", "daily"]),
  quietHours: z.boolean().default(false),
  quietStart: z.string().optional(),
  quietEnd: z.string().optional(),
  
  // Custom Alerts
  enableCustomAlerts: z.boolean().default(false),
  customAlerts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    condition: z.string(),
    threshold: z.number(),
    enabled: z.boolean(),
  })).default([]),
});

type AlertSettingsFormData = z.infer<typeof alertSettingsSchema>;

interface AlertSettingsFormProps {
  onSubmit: (data: AlertSettingsFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<AlertSettingsFormData>;
  loading?: boolean;
  className?: string;
}

const ALERT_FREQUENCIES = [
  { value: "immediate", label: "Immediate", description: "Send alerts instantly" },
  { value: "5min", label: "5 Minutes", description: "Batch alerts every 5 minutes" },
  { value: "15min", label: "15 Minutes", description: "Batch alerts every 15 minutes" },
  { value: "1hour", label: "1 Hour", description: "Batch alerts every hour" },
  { value: "daily", label: "Daily", description: "Daily summary only" },
];

export function AlertSettingsForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  loading = false,
  className 
}: AlertSettingsFormProps) {
  const [customAlerts, setCustomAlerts] = useState<Array<{
    id: string;
    name: string;
    condition: string;
    threshold: number;
    enabled: boolean;
  }>>(initialData?.customAlerts?.map(alert => ({
    id: alert.id || crypto.randomUUID(),
    name: alert.name || '',
    condition: alert.condition || 'greater_than',
    threshold: alert.threshold || 0,
    enabled: alert.enabled ?? true
  })) || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<AlertSettingsFormData>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      enableTradeAlerts: initialData?.enableTradeAlerts ?? true,
      tradeThreshold: initialData?.tradeThreshold || 1.0,
      enableLossAlerts: initialData?.enableLossAlerts ?? true,
      lossThreshold: initialData?.lossThreshold || 2.0,
      enableProfitAlerts: initialData?.enableProfitAlerts ?? true,
      profitThreshold: initialData?.profitThreshold || 5.0,
      enableSystemAlerts: initialData?.enableSystemAlerts ?? true,
      enableConnectionAlerts: initialData?.enableConnectionAlerts ?? true,
      enableErrorAlerts: initialData?.enableErrorAlerts ?? true,
      enableEmail: initialData?.enableEmail ?? false,
      emailAddress: initialData?.emailAddress || "",
      enablePush: initialData?.enablePush ?? true,
      enableSMS: initialData?.enableSMS ?? false,
      phoneNumber: initialData?.phoneNumber || "",
      alertFrequency: initialData?.alertFrequency || "immediate",
      quietHours: initialData?.quietHours ?? false,
      quietStart: initialData?.quietStart || "22:00",
      quietEnd: initialData?.quietEnd || "08:00",
      enableCustomAlerts: initialData?.enableCustomAlerts ?? false,
      customAlerts: initialData?.customAlerts || [],
    },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: AlertSettingsFormData) => {
    try {
      const formData = { ...data, customAlerts };
      await onSubmit(formData);
      reset();
      setCustomAlerts([]);
    } catch (error) {
      console.error("Failed to submit alert settings:", error);
    }
  };

  const addCustomAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      name: "",
      condition: "price_above",
      threshold: 0,
      enabled: true,
    };
    setCustomAlerts([...customAlerts, newAlert]);
  };

  const removeCustomAlert = (id: string) => {
    setCustomAlerts(customAlerts.filter(alert => alert.id !== id));
  };

  const updateCustomAlert = (id: string, field: string, value: any) => {
    setCustomAlerts(customAlerts.map(alert => 
      alert.id === id ? { ...alert, [field]: value } : alert
    ));
  };

  const getNotificationCount = () => {
    let count = 0;
    if (watchedValues.enableTradeAlerts) count++;
    if (watchedValues.enableSystemAlerts) count++;
    if (watchedValues.enableEmail) count++;
    if (watchedValues.enablePush) count++;
    if (watchedValues.enableSMS) count++;
    if (watchedValues.enableCustomAlerts) count += customAlerts.length;
    return count;
  };

  return (
    <Card className={cn("w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle>Alert & Notification Settings</CardTitle>
        <div className="text-sm text-muted-foreground">
          Configure when and how you receive notifications about trading activities and system events
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Trading Alerts */}
          <div className="space-y-4">
            <h3 className="font-medium">Trading Alerts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTradeAlerts"
                    checked={watchedValues.enableTradeAlerts}
                    onCheckedChange={(checked) => setValue("enableTradeAlerts", checked)}
                  />
                  <Label htmlFor="enableTradeAlerts">Enable Trade Alerts</Label>
                </div>
                
                {watchedValues.enableTradeAlerts && (
                  <div className="space-y-2">
                    <Label htmlFor="tradeThreshold">Trade Threshold (%)</Label>
                    <Input
                      id="tradeThreshold"
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register("tradeThreshold", { valueAsNumber: true })}
                      className="w-32"
                    />
                    {errors.tradeThreshold && (
                      <p className="text-sm text-red-600">{errors.tradeThreshold.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableLossAlerts"
                    checked={watchedValues.enableLossAlerts}
                    onCheckedChange={(checked) => setValue("enableLossAlerts", checked)}
                  />
                  <Label htmlFor="enableLossAlerts">Enable Loss Alerts</Label>
                </div>
                
                {watchedValues.enableLossAlerts && (
                  <div className="space-y-2">
                    <Label htmlFor="lossThreshold">Loss Threshold (%)</Label>
                    <Input
                      id="lossThreshold"
                      type="number"
                      step="0.1"
                      min="0.1"
                      {...register("lossThreshold", { valueAsNumber: true })}
                      className="w-32"
                    />
                    {errors.lossThreshold && (
                      <p className="text-sm text-red-600">{errors.lossThreshold.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableProfitAlerts"
                  checked={watchedValues.enableProfitAlerts}
                  onCheckedChange={(checked) => setValue("enableProfitAlerts", checked)}
                />
                <Label htmlFor="enableProfitAlerts">Enable Profit Alerts</Label>
              </div>
              
              {watchedValues.enableProfitAlerts && (
                <div className="space-y-2">
                  <Label htmlFor="profitThreshold">Profit Threshold (%)</Label>
                  <Input
                    id="profitThreshold"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register("profitThreshold", { valueAsNumber: true })}
                    className="w-32"
                  />
                  {errors.profitThreshold && (
                    <p className="text-sm text-red-600">{errors.profitThreshold.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* System Alerts */}
          <div className="space-y-4">
            <h3 className="font-medium">System Alerts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableSystemAlerts"
                  checked={watchedValues.enableSystemAlerts}
                  onCheckedChange={(checked) => setValue("enableSystemAlerts", checked)}
                />
                <Label htmlFor="enableSystemAlerts">System Events</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableConnectionAlerts"
                  checked={watchedValues.enableConnectionAlerts}
                  onCheckedChange={(checked) => setValue("enableConnectionAlerts", checked)}
                />
                <Label htmlFor="enableConnectionAlerts">Connection Status</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableErrorAlerts"
                  checked={watchedValues.enableErrorAlerts}
                  onCheckedChange={(checked) => setValue("enableErrorAlerts", checked)}
                />
                <Label htmlFor="enableErrorAlerts">Error Notifications</Label>
              </div>
            </div>
          </div>

          {/* Notification Methods */}
          <div className="space-y-4">
            <h3 className="font-medium">Notification Methods</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableEmail"
                    checked={watchedValues.enableEmail}
                    onCheckedChange={(checked) => setValue("enableEmail", checked)}
                  />
                  <Label htmlFor="enableEmail">Email Notifications</Label>
                </div>
                
                {watchedValues.enableEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      {...register("emailAddress")}
                      placeholder="your@email.com"
                      className={errors.emailAddress ? "border-red-500" : ""}
                    />
                    {errors.emailAddress && (
                      <p className="text-sm text-red-600">{errors.emailAddress.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Push Notifications */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enablePush"
                    checked={watchedValues.enablePush}
                    onCheckedChange={(checked) => setValue("enablePush", checked)}
                  />
                  <Label htmlFor="enablePush">Push Notifications</Label>
                </div>
                <div className="text-xs text-muted-foreground">
                  Browser and mobile push notifications
                </div>
              </div>

              {/* SMS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSMS"
                    checked={watchedValues.enableSMS}
                    onCheckedChange={(checked) => setValue("enableSMS", checked)}
                  />
                  <Label htmlFor="enableSMS">SMS Notifications</Label>
                </div>
                
                {watchedValues.enableSMS && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register("phoneNumber")}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                )}
              </div>

              {/* Alert Frequency */}
              <div className="space-y-3">
                <Label htmlFor="alertFrequency">Alert Frequency</Label>
                <Select value={watchedValues.alertFrequency} onValueChange={(value) => setValue("alertFrequency", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div>
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-xs text-muted-foreground">{freq.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="font-medium">Quiet Hours</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="quietHours"
                  checked={watchedValues.quietHours}
                  onCheckedChange={(checked) => setValue("quietHours", checked)}
                />
                <Label htmlFor="quietHours">Enable Quiet Hours</Label>
              </div>
              
              {watchedValues.quietHours && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quietStart">Start Time</Label>
                    <Input
                      id="quietStart"
                      type="time"
                      {...register("quietStart")}
                      defaultValue="22:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quietEnd">End Time</Label>
                    <Input
                      id="quietEnd"
                      type="time"
                      {...register("quietEnd")}
                      defaultValue="08:00"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Alerts */}
          <div className="space-y-4">
            <h3 className="font-medium">Custom Alerts</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableCustomAlerts"
                  checked={watchedValues.enableCustomAlerts}
                  onCheckedChange={(checked) => setValue("enableCustomAlerts", checked)}
                />
                <Label htmlFor="enableCustomAlerts">Enable Custom Alerts</Label>
              </div>
              
              {watchedValues.enableCustomAlerts && (
                <div className="space-y-4">
                  {customAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Custom Alert</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomAlert(alert.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={alert.name}
                            onChange={(e) => updateCustomAlert(alert.id, "name", e.target.value)}
                            placeholder="Alert name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select value={alert.condition} onValueChange={(value) => updateCustomAlert(alert.id, "condition", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="price_above">Price Above</SelectItem>
                              <SelectItem value="price_below">Price Below</SelectItem>
                              <SelectItem value="volume_above">Volume Above</SelectItem>
                              <SelectItem value="spread_above">Spread Above</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={alert.threshold}
                            onChange={(e) => updateCustomAlert(alert.id, "threshold", parseFloat(e.target.value))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomAlert}
                  >
                    Add Custom Alert
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-3">Notification Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Alerts:</span>
                <div className="font-medium">{getNotificationCount()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Frequency:</span>
                <div className="font-medium capitalize">{watchedValues.alertFrequency}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Quiet Hours:</span>
                <div className="font-medium">{watchedValues.quietHours ? "Enabled" : "Disabled"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Methods:</span>
                <div className="font-medium">
                  {[watchedValues.enableEmail, watchedValues.enablePush, watchedValues.enableSMS]
                    .filter(Boolean).length} active
                </div>
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
              disabled={loading || !isValid}
            >
              {loading ? "Saving..." : "Save Alert Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
