// apps/web/src/pages/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun, 
  Eye, 
  EyeOff,
  Key,
  Smartphone,
  Mail,
  MessageSquare,
  Zap,
  Download,
  Upload,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { FormDialog } from '../components/common/FormDialog';
import { UserSettings } from '../types';


interface SecurityLog {
  id: string;
  action: string;
  ip: string;
  location: string;
  device: string;
  timestamp: string;
  status: 'success' | 'failed' | 'suspicious';
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuthStore();

  // Mock data - replace with API calls
  useEffect(() => {
    const mockSettings: UserSettings = {
      id: '1',
      email: 'user@cryonel.com',
      firstName: 'John',
      lastName: 'Doe',
      timezone: 'UTC+1',
      language: 'en',
      theme: 'dark',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        sms: false,
        webhook: true,
        marketing: false
      },
      security: {
        twoFactorEnabled: true,
        sessionTimeout: 30,
        loginNotifications: true,
        suspiciousActivityAlerts: true
      },
      trading: {
        defaultRiskLevel: 'medium',
        autoConfirmTrades: false,
        maxPositionSize: 10000,
        stopLossPercentage: 5
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        nextBilling: '2024-02-15T00:00:00Z',
        amount: 99
      }
    };

    const mockSecurityLogs: SecurityLog[] = [
      {
        id: '1',
        action: 'Login',
        ip: '192.168.1.100',
        location: 'Berlin, Germany',
        device: 'Chrome on Windows',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success'
      },
      {
        id: '2',
        action: 'Password Change',
        ip: '192.168.1.100',
        location: 'Berlin, Germany',
        device: 'Chrome on Windows',
        timestamp: '2024-01-14T15:20:00Z',
        status: 'success'
      },
      {
        id: '3',
        action: 'Login Attempt',
        ip: '203.45.67.89',
        location: 'Unknown',
        device: 'Unknown',
        timestamp: '2024-01-13T08:15:00Z',
        status: 'failed'
      }
    ];

    setSettings(mockSettings);
    setSecurityLogs(mockSecurityLogs);
  }, []);

  const handleSaveSettings = async (section: keyof UserSettings, data: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(prev => prev ? { ...prev, [section]: typeof prev[section] === 'object' ? { ...prev[section], ...data } : data } : null);
      
      // Show success message
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowChangePasswordDialog(false);
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!settings) return;

    if (settings.security.twoFactorEnabled) {
      // Disable 2FA
      await handleSaveSettings('security', { twoFactorEnabled: false });
    } else {
      // Enable 2FA
      setShowTwoFactorDialog(true);
    }
  };

  const handleEnableTwoFactor = async (data: { code: string }) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await handleSaveSettings('security', { twoFactorEnabled: true });
      setShowTwoFactorDialog(false);
      console.log('Two-factor authentication enabled');
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (data: { confirmText: string }) => {
    if (data.confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm account deletion');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logout();
      console.log('Account deleted successfully');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!settings) return;

    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cryonel-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'suspicious': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'pro': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'elite': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-hi">Settings</h1>
          <p className="text-text-low">Manage your account preferences and security settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button disabled={isLoading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-text-low">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => prev ? { ...prev, timezone: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="UTC+1">UTC+1 (Central Europe)</SelectItem>
                      <SelectItem value="UTC+2">UTC+2 (Eastern Europe)</SelectItem>
                      <SelectItem value="UTC-5">UTC-5 (Eastern US)</SelectItem>
                      <SelectItem value="UTC-8">UTC-8 (Pacific US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings(prev => prev ? { ...prev, language: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings(prev => prev ? { ...prev, currency: value } : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setSettings(prev => prev ? { ...prev, theme: 'light' } : null)}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setSettings(prev => prev ? { ...prev, theme: 'dark' } : null)}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={settings.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setSettings(prev => prev ? { ...prev, theme: 'system' } : null)}
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('email', settings)} disabled={isLoading}>
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-text-low">Last changed 14 days ago</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowChangePasswordDialog(true)}>
                    Change Password
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-low">
                      {settings.security.twoFactorEnabled 
                        ? 'Enabled - adds an extra layer of security' 
                        : 'Disabled - recommended for enhanced security'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={handleToggleTwoFactor}
                  />
                </div>
              </div>

              <Separator />

              {/* Session Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Session Timeout</h3>
                    <p className="text-sm text-text-low">Automatically log out after inactivity</p>
                  </div>
                  <Select 
                    value={settings.security.sessionTimeout.toString()} 
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, security: { ...prev.security, sessionTimeout: parseInt(value) } } : null)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Security Notifications */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Login Notifications</h3>
                      <p className="text-sm text-text-low">Get notified of new login attempts</p>
                    </div>
                    <Switch
                      checked={settings.security.loginNotifications}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, security: { ...prev.security, loginNotifications: checked } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Suspicious Activity Alerts</h3>
                      <p className="text-sm text-text-low">Get alerts for unusual account activity</p>
                    </div>
                    <Switch
                      checked={settings.security.suspiciousActivityAlerts}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, security: { ...prev.security, suspiciousActivityAlerts: checked } } : null)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Security Log */}
              <div className="space-y-4">
                <h3 className="font-medium">Recent Security Activity</h3>
                <div className="space-y-2">
                  {securityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-green-500' : 
                          log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          <p className="text-xs text-text-low">{log.device} • {log.ip}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-text-low mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Account Deletion */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-600">This action cannot be undone. All data will be permanently deleted.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteAccountDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('security', settings.security)} disabled={isLoading}>
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trading Notifications */}
              <div className="space-y-4">
                <h3 className="font-medium">Trading Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-text-low" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-text-low">Receive trading alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifications: { ...prev.notifications, email: checked } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-text-low" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-text-low">Receive notifications on your device</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifications: { ...prev.notifications, push: checked } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-text-low" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-text-low">Receive urgent alerts via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifications: { ...prev.notifications, sms: checked } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-text-low" />
                      <div>
                        <p className="font-medium">Webhook Notifications</p>
                        <p className="text-sm text-text-low">Send notifications to external services</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.webhook}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifications: { ...prev.notifications, webhook: checked } } : null)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Marketing Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Communications</h3>
                    <p className="text-sm text-text-low">Receive updates about new features and promotions</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifications: { ...prev.notifications, marketing: checked } } : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notifications', settings.notifications)} disabled={isLoading}>
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-4">
          {/* Trading Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Trading Preferences
              </CardTitle>
              <CardDescription>Configure your default trading behavior and risk management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Management */}
              <div className="space-y-4">
                <h3 className="font-medium">Risk Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Default Risk Level</Label>
                    <Select 
                      value={settings.trading.defaultRiskLevel} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => setSettings(prev => prev ? { ...prev, trading: { ...prev.trading, defaultRiskLevel: value } } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Conservative)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Aggressive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPositionSize">Max Position Size (USD)</Label>
                    <Input
                      id="maxPositionSize"
                      type="number"
                      value={settings.trading.maxPositionSize}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, trading: { ...prev.trading, maxPositionSize: parseInt(e.target.value) } } : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Default Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={settings.trading.stopLossPercentage}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, trading: { ...prev.trading, stopLossPercentage: parseInt(e.target.value) } } : null)}
                  />
                </div>
              </div>

              <Separator />

              {/* Trade Confirmation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Confirm Trades</h3>
                    <p className="text-sm text-text-low">Automatically execute trades without manual confirmation</p>
                  </div>
                  <Switch
                    checked={settings.trading.autoConfirmTrades}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, trading: { ...prev.trading, autoConfirmTrades: checked } } : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('trading', settings.trading)} disabled={isLoading}>
                  Save Trading Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {/* Billing & Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="space-y-4">
                <h3 className="font-medium">Current Plan</h3>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getPlanColor(settings.subscription.plan)}>
                        {settings.subscription.plan.charAt(0).toUpperCase() + settings.subscription.plan.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(settings.subscription.status)}>
                        {settings.subscription.status.charAt(0).toUpperCase() + settings.subscription.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${settings.subscription.amount}/month</p>
                      <p className="text-sm text-text-low">Next billing: {new Date(settings.subscription.nextBilling).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-text-hi">Unlimited</p>
                      <p className="text-sm text-text-low">Trading Pairs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-hi">Priority</p>
                      <p className="text-sm text-text-low">Execution</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-hi">24/7</p>
                      <p className="text-sm text-text-low">Support</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plan Comparison */}
              <div className="space-y-4">
                <h3 className="font-medium">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-center">Basic</CardTitle>
                      <CardDescription className="text-center">$49/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <p className="text-sm">Core arbitrage strategies</p>
                      <p className="text-sm">Limited copy trading slots</p>
                      <p className="text-sm">Basic support</p>
                      <Button variant="outline" className="w-full">Current Plan</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle className="text-center">Pro</CardTitle>
                      <CardDescription className="text-center">$99/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <p className="text-sm">Unlimited copy trading</p>
                      <p className="text-sm">Custom arbitrage pairs</p>
                      <p className="text-sm">Priority support</p>
                      <Button className="w-full">Current Plan</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-center">Elite</CardTitle>
                      <CardDescription className="text-center">$199/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <p className="text-sm">Dedicated strategy slots</p>
                      <p className="text-sm">Private API access</p>
                      <p className="text-sm">Early beta features</p>
                      <Button variant="outline" className="w-full">Upgrade</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Billing Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <Button variant="outline" className="flex-1">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Billing Settings
                </Button>
                <Button variant="destructive" className="flex-1">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <FormDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        title="Change Password"
        description="Enter your current password and choose a new one"
        onSubmit={() => {
          const formData = {} as { currentPassword: string; newPassword: string; confirmPassword: string; };
          handleChangePassword(formData);
        }}
        fields={[
          {
            name: 'currentPassword',
            label: 'Current Password',
            type: 'password',
            placeholder: 'Enter current password',
            required: true
          },
          {
            name: 'newPassword',
            label: 'New Password',
            type: 'password',
            placeholder: 'Enter new password',
            required: true
          },
          {
            name: 'confirmPassword',
            label: 'Confirm New Password',
            type: 'password',
            placeholder: 'Confirm new password',
            required: true
          }
        ]}
      />

      {/* Two-Factor Setup Dialog */}
      <FormDialog
        open={showTwoFactorDialog}
        onOpenChange={setShowTwoFactorDialog}
        title="Enable Two-Factor Authentication"
        description="Scan the QR code with your authenticator app and enter the code"
        onSubmit={() => {
          const formData = {} as { code: string; };
          handleEnableTwoFactor(formData);
        }}
        fields={[
          {
            name: 'code',
            label: 'Verification Code',
            type: 'text',
            placeholder: 'Enter 6-digit code',
            required: true
          }
        ]}
      />

      {/* Delete Account Dialog */}
      <FormDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
        title="Delete Account"
        description="This action cannot be undone. Type DELETE to confirm."
        onSubmit={() => {
          const formData = {} as { confirmText: string; };
          handleDeleteAccount(formData);
        }}
        fields={[
          {
            name: 'confirmText',
            label: 'Type DELETE to confirm',
            type: 'text',
            placeholder: 'DELETE',
            required: true
          }
        ]}
      />
    </div>
  );
}
