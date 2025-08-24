import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/themeStore';
import { useConnectionStore } from '../../stores/connectionStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
    Menu,
    Search,
    Bell,
    Settings,
    LogOut,
    User,
    Sun,
    Moon,
    Wifi,
    WifiOff,
    AlertTriangle
} from 'lucide-react';

export default function Topbar() {
    const { user, logout } = useAuthStore();
    const {
        sidebar_open,
        setSidebarOpen,
        notifications
    } = useUIStore();
    const { theme, setTheme } = useThemeStore();
    const { websocket_status, cex_latency, rpc_latency, throttled } = useConnectionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getConnectionStatus = () => {
        if (websocket_status === 'connected') {
            return { icon: Wifi, color: 'text-green-500', status: 'Connected' };
        } else if (websocket_status === 'connecting') {
            return { icon: AlertTriangle, color: 'text-yellow-500', status: 'Connecting' };
        } else {
            return { icon: WifiOff, color: 'text-red-500', status: 'Disconnected' };
        }
    };

    const connectionStatus = getConnectionStatus();
    const StatusIcon = connectionStatus.icon;

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
            <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-2 sm:gap-3 px-3 sm:px-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebar_open)}
                    className="lg:hidden p-1.5 sm:p-2 rounded-md hover:bg-accent transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center shadow-md sm:hidden">
                        <img src="/cryonel_logo_cube.svg" alt="CRYONEL 3D Logo" className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-lg sm:text-xl tracking-wide bg-gradient-to-r from-orange-500 to-slate-600 bg-clip-text text-transparent">
                        CRYONEL
                    </div>
                </Link>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-md mx-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search strategies, markets, or users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-muted rounded-md pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right Side Items */}
                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    {/* Connection Status */}
                    <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 rounded-md bg-muted">
                        <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${connectionStatus.color}`} />
                        <span className="text-xs text-muted-foreground">
                            {connectionStatus.status}
                        </span>
                        {throttled && (
                            <span className="text-xs text-warning font-medium">
                                Throttled
                            </span>
                        )}
                    </div>

                    {/* Latency Indicators */}
                    <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
                        <span>CEX: {cex_latency}ms</span>
                        <span>RPC: {rpc_latency}ms</span>
                    </div>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 sm:p-2 rounded-md hover:bg-accent transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                            <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                    </button>

                    {/* Notifications */}
                    <button
                        className="p-1.5 sm:p-2 rounded-md hover:bg-accent transition-colors relative"
                        aria-label="Notifications"
                    >
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                {notifications.length > 9 ? '9+' : notifications.length}
                            </span>
                        )}
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-md hover:bg-accent transition-colors"
                            aria-label="User menu"
                        >
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                            </div>
                            <span className="hidden sm:block text-sm font-medium">
                                {user?.username || user?.email?.split('@')[0] || 'User'}
                            </span>
                        </button>

                        {/* User Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
                                <Link
                                    to="/settings"
                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Search (when not on dashboard) */}
            {location.pathname !== '/dashboard' && (
                <div className="md:hidden px-3 sm:px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-muted rounded-md pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
