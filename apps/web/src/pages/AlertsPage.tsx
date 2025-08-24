// apps/web/src/pages/AlertsPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Mail,
  Smartphone,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { DataTable } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'price' | 'volume' | 'technical' | 'custom';
  condition: 'above' | 'below' | 'crosses' | 'equals';
  value: number;
  symbol: string;
  isActive: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    webhook: boolean;
  };
  cooldown: number; // minutes
  lastTriggered: string | null;
  triggerCount: number;
  createdAt: string;
}

interface Notification {
  id: string;
  ruleId: string;
  ruleName: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  symbol: string;
  value: number;
  threshold: number;
  channel: 'email' | 'push' | 'sms' | 'webhook';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp: string;
  read: boolean;
}

interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  type: 'price' | 'volume' | 'technical' | 'custom';
  condition: 'above' | 'below' | 'crosses' | 'equals';
  defaultValue: number;
  defaultSymbol: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    webhook: boolean;
  };
  cooldown: number;
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertTemplates, setAlertTemplates] = useState<AlertTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockRules: AlertRule[] = [
      {
        id: '1',
        name: 'BTC Price Drop Alert',
        description: 'Alert when BTC price drops below $40,000',
        type: 'price',
        condition: 'below',
        value: 40000,
        symbol: 'BTC/USDT',
        isActive: true,
        notifications: {
          email: true,
          push: true,
          sms: false,
          webhook: true
        },
        cooldown: 30,
        lastTriggered: '2024-01-15T08:30:00Z',
        triggerCount: 3,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'High Volume Alert',
        description: 'Alert when SOL volume exceeds 1M',
        type: 'volume',
        condition: 'above',
        value: 1000000,
        symbol: 'SOL/USDT',
        isActive: true,
        notifications: {
          email: false,
          push: true,
          sms: false,
          webhook: false
        },
        cooldown: 15,
        lastTriggered: '2024-01-15T10:15:00Z',
        triggerCount: 7,
        createdAt: '2024-01-05T00:00:00Z'
      },
      {
        id: '3',
        name: 'RSI Oversold Alert',
        description: 'Alert when RSI goes below 30',
        type: 'technical',
        condition: 'below',
        value: 30,
        symbol: 'ETH/USDT',
        isActive: false,
        notifications: {
          email: true,
          push: true,
          sms: true,
          webhook: false
        },
        cooldown: 60,
        lastTriggered: null,
        triggerCount: 0,
        createdAt: '2024-01-10T00:00:00Z'
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        ruleId: '1',
        ruleName: 'BTC Price Drop Alert',
        type: 'warning',
        title: 'BTC Price Alert',
        message: 'BTC price has dropped below $40,000',
        symbol: 'BTC/USDT',
        value: 39850,
        threshold: 40000,
        channel: 'push',
        status: 'delivered',
        timestamp: '2024-01-15T08:30:00Z',
        read: false
      },
      {
        id: '2',
        ruleId: '2',
        ruleName: 'High Volume Alert',
        type: 'info',
        title: 'High Volume Detected',
        message: 'SOL volume has exceeded 1M',
        symbol: 'SOL/USDT',
        value: 1250000,
        threshold: 1000000,
        channel: 'email',
        status: 'sent',
        timestamp: '2024-01-15T10:15:00Z',
        read: true
      }
    ];

    const mockTemplates: AlertTemplate[] = [
      {
        id: '1',
        name: 'Price Drop Template',
        description: 'Standard template for price drop alerts',
        type: 'price',
        condition: 'below',
        defaultValue: 0,
        defaultSymbol: 'BTC/USDT',
        notifications: {
          email: true,
          push: true,
          sms: false,
          webhook: false
        },
        cooldown: 30
      },
      {
        id: '2',
        name: 'Volume Spike Template',
        description: 'Template for volume-based alerts',
        type: 'volume',
        condition: 'above',
        defaultValue: 1000000,
        defaultSymbol: 'SOL/USDT',
        notifications: {
          email: false,
          push: true,
          sms: false,
          webhook: true
        },
        cooldown: 15
      }
    ];

    setAlertRules(mockRules);
    setNotifications(mockNotifications);
    setAlertTemplates(mockTemplates);
  }, []);

  const handleCreateRule = (ruleData: Partial<AlertRule>) => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: ruleData.name || '',
      description: ruleData.description || '',
      type: ruleData.type || 'price',
      condition: ruleData.condition || 'above',
      value: ruleData.value || 0,
      symbol: ruleData.symbol || 'BTC/USDT',
      isActive: true,
      notifications: ruleData.notifications || {
        email: true,
        push: true,
        sms: false,
        webhook: false
      },
      cooldown: ruleData.cooldown || 30,
      lastTriggered: null,
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    setAlertRules(prev => [newRule, ...prev]);
    setShowCreateDialog(false);
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setShowCreateDialog(true);
  };

  const handleUpdateRule = (ruleData: Partial<AlertRule>) => {
    if (!editingRule) return;

    setAlertRules(prev => 
      prev.map(rule => 
        rule.id === editingRule.id 
          ? { ...rule, ...ruleData }
          : rule
      )
    );

    setEditingRule(null);
    setShowCreateDialog(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const filteredRules = alertRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || rule.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRules = alertRules.filter(rule => rule.isActive).length;
  const totalNotifications = notifications.length;
  const unreadNotifications = notifications.filter(notification => !notification.read).length;
  const failedNotifications = notifications.filter(notification => notification.status === 'failed').length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'volume': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'technical': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'custom': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'above': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'below': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'crosses': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'equals': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'success': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'delivered': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-hi">Alerts & Notifications</h1>
          <p className="text-text-low">Manage trading alerts and notification preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Alerts"
          value={activeRules.toString()}
          icon={<Bell className="h-5 w-5" />}
          trend={`${alertRules.length} total`}
          trendDirection="up"
        />
        <KPICard
          label="Total Notifications"
          value={totalNotifications.toString()}
          icon={<MessageSquare className="h-5 w-5" />}
          trend="+12 today"
          trendDirection="up"
        />
        <KPICard
          label="Unread"
          value={unreadNotifications.toString()}
          icon={<Eye className="h-5 w-5" />}
          trend={`${((unreadNotifications / totalNotifications) * 100).toFixed(1)}%`}
          trendDirection="up"
        />
        <KPICard
          label="Failed"
          value={failedNotifications.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={failedNotifications > 0 ? "Check logs" : "All good"}
          trendDirection={failedNotifications > 0 ? "down" : "up"}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
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
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alert Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-low">Show Active Only</span>
                  <Switch
                    checked={typeFilter === 'active'}
                    onCheckedChange={(checked) => setTypeFilter(checked ? 'active' : 'all')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Rules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{rule.name}</CardTitle>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                      </div>
                      <CardDescription className="mb-3">{rule.description}</CardDescription>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getTypeColor(rule.type)}>
                          {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
                        </Badge>
                        <Badge className={getConditionColor(rule.condition)}>
                          {rule.condition.charAt(0).toUpperCase() + rule.condition.slice(1)} {rule.value}
                        </Badge>
                        <Badge variant="outline">{rule.symbol}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Notification Channels */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-text-hi">Notification Channels:</span>
                    <div className="flex flex-wrap gap-2">
                      {rule.notifications.email && <Badge variant="secondary" className="flex items-center gap-1"><Mail className="h-3 w-3" />Email</Badge>}
                      {rule.notifications.push && <Badge variant="secondary" className="flex items-center gap-1"><Smartphone className="h-3 w-3" />Push</Badge>}
                      {rule.notifications.sms && <Badge variant="secondary" className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />SMS</Badge>}
                      {rule.notifications.webhook && <Badge variant="secondary" className="flex items-center gap-1"><Zap className="h-3 w-3" />Webhook</Badge>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-text-hi">{rule.triggerCount}</div>
                      <div className="text-xs text-text-low">Triggers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-text-hi">{rule.cooldown}m</div>
                      <div className="text-xs text-text-low">Cooldown</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-text-hi">
                        {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-xs text-text-low">Last Trigger</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditRule(rule)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Notification Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Notification Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-low" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-low">Show Unread Only</span>
                  <Switch
                    checked={statusFilter === 'unread'}
                    onCheckedChange={(checked) => setStatusFilter(checked ? 'unread' : 'all')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>All notifications from your alert rules</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredNotifications}
                columns={[
                  { key: 'type', label: 'Type' },
                  { key: 'title', label: 'Title' },
                  { key: 'symbol', label: 'Symbol' },
                  { key: 'channel', label: 'Channel' },
                  { key: 'status', label: 'Status' },
                  { key: 'timestamp', label: 'Time' },
                  { key: 'read', label: 'Read' },
                  { key: 'actions', label: 'Actions' }
                ]}
                renderCell={(item, column) => {
                  switch (column.key) {
                    case 'type':
                      return (
                        <Badge className={getNotificationTypeColor(item.type)}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                      );
                    case 'channel':
                      const channelIcons = {
                        email: <Mail className="h-4 w-4" />,
                        push: <Smartphone className="h-4 w-4" />,
                        sms: <MessageSquare className="h-4 w-4" />,
                        webhook: <Zap className="h-4 w-4" />
                      };
                      return (
                        <div className="flex items-center gap-2">
                          {channelIcons[item.channel as keyof typeof channelIcons]}
                          <span className="capitalize">{item.channel}</span>
                        </div>
                      );
                    case 'status':
                      return (
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      );
                    case 'timestamp':
                      return (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-text-low" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      );
                    case 'read':
                      return item.read ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Read</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Unread</span>
                        </div>
                      );
                    case 'actions':
                      return (
                        <div className="flex gap-2">
                          {!item.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(item.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteNotification(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    default:
                      return item[column.key as keyof Notification];
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Alert Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Alert Templates
              </CardTitle>
              <CardDescription>Pre-configured templates for common alert types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {alertTemplates.map((template) => (
                  <Card key={template.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-xl">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getTypeColor(template.type)}>
                          {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                        </Badge>
                        <Badge className={getConditionColor(template.condition)}>
                          {template.condition.charAt(0).toUpperCase() + template.condition.slice(1)}
                        </Badge>
                        <Badge variant="outline">{template.defaultSymbol}</Badge>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm font-medium text-text-hi">Notification Channels:</span>
                        <div className="flex flex-wrap gap-2">
                          {template.notifications.email && <Badge variant="secondary" className="flex items-center gap-1"><Mail className="h-3 w-3" />Email</Badge>}
                          {template.notifications.push && <Badge variant="secondary" className="flex items-center gap-1"><Smartphone className="h-3 w-3" />Push</Badge>}
                          {template.notifications.sms && <Badge variant="secondary" className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />SMS</Badge>}
                          {template.notifications.webhook && <Badge variant="secondary" className="flex items-center gap-1"><Zap className="h-3 w-3" />Webhook</Badge>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-low">Cooldown: {template.cooldown} minutes</span>
                        <Button
                          onClick={() => {
                            // Use template to create new rule
                            setShowCreateDialog(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Alert Dialog */}
      <FormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        description={editingRule ? 'Modify your alert rule settings' : 'Set up a new trading alert'}
        onSubmit={() => {
          const formData = {} as Partial<AlertRule>; // This should be extracted from form
          editingRule ? handleUpdateRule(formData) : handleCreateRule(formData);
        }}
        fields={[
          {
            name: 'name',
            label: 'Alert Name',
            type: 'text',
            placeholder: 'Enter alert name',
            required: true,
            defaultValue: editingRule?.name
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe what this alert monitors',
            required: true,
            defaultValue: editingRule?.description
          },
          {
            name: 'type',
            label: 'Alert Type',
            type: 'select',
            options: [
              { value: 'price', label: 'Price' },
              { value: 'volume', label: 'Volume' },
              { value: 'technical', label: 'Technical Indicator' },
              { value: 'custom', label: 'Custom' }
            ],
            required: true,
            defaultValue: editingRule?.type
          },
          {
            name: 'condition',
            label: 'Condition',
            type: 'select',
            options: [
              { value: 'above', label: 'Above' },
              { value: 'below', label: 'Below' },
              { value: 'crosses', label: 'Crosses' },
              { value: 'equals', label: 'Equals' }
            ],
            required: true,
            defaultValue: editingRule?.condition
          },
          {
            name: 'value',
            label: 'Threshold Value',
            type: 'number',
            placeholder: 'Enter threshold value',
            required: true,
            defaultValue: editingRule?.value
          },
          {
            name: 'symbol',
            label: 'Trading Pair',
            type: 'text',
            placeholder: 'e.g., BTC/USDT',
            required: true,
            defaultValue: editingRule?.symbol
          },
          {
            name: 'cooldown',
            label: 'Cooldown (minutes)',
            type: 'number',
            placeholder: '30',
            required: true,
            defaultValue: editingRule?.cooldown
          }
        ]}
      />
    </div>
  );
}
