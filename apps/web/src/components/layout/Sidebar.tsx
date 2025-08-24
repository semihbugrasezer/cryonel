import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import {
    LayoutDashboard,
    TrendingUp,
    Copy,
    Play,
    AlertTriangle,
    Settings,
    BarChart3,
    Wallet,
    Key,
    ChevronLeft,
    ChevronRight,
    Palette
} from 'lucide-react';

const navigationItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Overview and analytics'
    },
    {
        href: '/strategies',
        label: 'Strategies',
        icon: TrendingUp,
        description: 'Trading strategies marketplace'
    },
    {
        href: '/copy-trading',
        label: 'Copy Trading',
        icon: Copy,
        description: 'Follow master traders'
    },
    {
        href: '/simulator',
        label: 'Simulator',
        icon: Play,
        description: 'Backtest and paper trading'
    },
    {
        href: '/alerts',
        label: 'Alerts',
        icon: AlertTriangle,
        description: 'Price and PnL notifications'
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        description: 'Account and preferences'
    },
];

const quickActions = [
    {
        href: '/settings/api-keys',
        label: 'API Keys',
        icon: Key,
        description: 'Manage exchange connections'
    },
    {
        href: '/settings/wallets',
        label: 'Wallets',
        icon: Wallet,
        description: 'Web3 wallet management'
    },
    {
        href: '/dashboard/performance',
        label: 'Performance',
        icon: BarChart3,
        description: 'Detailed trading metrics'
    }
];

export default function Sidebar() {
    const { sidebar_open, setSidebarOpen, sidebar_collapsed, setSidebarCollapsed } = useUIStore();
    const location = useLocation();

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(href);
    };

    const renderNavItem = (item: typeof navigationItems[0], isQuickAction = false) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
            <Link
                key={item.href}
                to={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-md transition-colors ${active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                    } ${isQuickAction ? 'text-sm' : ''}`}
                title={sidebar_collapsed ? item.description : undefined}
            >
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {!sidebar_collapsed && (
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm sm:text-base">{item.label}</div>
                        {!isQuickAction && (
                            <div className="text-xs text-muted-foreground truncate hidden sm:block">{item.description}</div>
                        )}
                    </div>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-background border-r border-border transform transition-transform duration-300 lg:hidden ${sidebar_open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Sidebar Header */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center shadow-md">
                                <img src="/cryonel_logo_cube.svg" alt="CRYONEL 3D Logo" className="w-6 h-6" />
                            </div>
                            <div className="font-bold text-lg bg-gradient-to-r from-orange-500 to-slate-600 bg-clip-text text-transparent">CRYONEL</div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-md hover:bg-accent transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mobile Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                        <nav className="space-y-1 sm:space-y-2">
                            {navigationItems.map(item => renderNavItem(item))}
                        </nav>

                        <div className="pt-3 sm:pt-4 border-t border-border">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Quick Actions
                            </h3>
                            <nav className="space-y-1">
                                {quickActions.map(item => renderNavItem(item, true))}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:block bg-background border-r border-border transition-all duration-300 ${sidebar_collapsed ? 'w-16' : 'w-60'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Desktop Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                                <img src="/cryonel_logo_cube.svg" alt="CRYONEL 3D Logo" className="w-6 h-6" />
                            </div>
                            {!sidebar_collapsed && (
                                <div className="font-bold text-lg bg-gradient-to-r from-orange-500 to-slate-600 bg-clip-text text-transparent">CRYONEL</div>
                            )}
                        </Link>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebar_collapsed)}
                            className="p-2 rounded-md hover:bg-accent transition-colors"
                            title={sidebar_collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {sidebar_collapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Desktop Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <nav className="space-y-2">
                            {navigationItems.map(item => renderNavItem(item))}
                        </nav>

                        <div className="pt-4 border-t border-border">
                            {!sidebar_collapsed && (
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Quick Actions
                                </h3>
                            )}
                            <nav className="space-y-1">
                                {quickActions.map(item => renderNavItem(item, true))}
                            </nav>
                        </div>
                    </div>

                    {/* Desktop Sidebar Footer */}
                    {!sidebar_collapsed && (
                        <div className="p-4 border-t border-border">
                            <div className="text-xs text-muted-foreground text-center">
                                <div className="font-medium">CRYONEL</div>
                                <div>v1.0.0</div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
