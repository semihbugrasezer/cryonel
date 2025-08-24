import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { useUIStore } from '../../stores/uiStore';

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const { sidebar_open, setSidebarOpen, sidebar_collapsed, setSidebarCollapsed } = useUIStore();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setSidebarOpen(false);
                setSidebarCollapsed(false);
            } else {
                setSidebarCollapsed(window.innerWidth < 1024);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, [setSidebarOpen, setSidebarCollapsed]);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile, setSidebarOpen]);

    // Handle escape key to close sidebar on mobile
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && sidebar_open && isMobile) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [sidebar_open, isMobile, setSidebarOpen]);

    return (
        <div className="min-h-screen bg-background">
            {/* Topbar */}
            <Topbar />

            <div className="flex h-[calc(100vh-3.5rem)]">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main
                    className={`flex-1 overflow-auto transition-all duration-300 ${sidebar_open && isMobile
                            ? 'ml-0'
                            : sidebar_collapsed && !isMobile
                                ? 'ml-16'
                                : !isMobile ? 'ml-60' : 'ml-0'
                        }`}
                >
                    <div className="h-full p-4 sm:p-6 md:p-8 lg:p-10">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebar_open && isMobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
