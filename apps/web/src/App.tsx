import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useThemeStore } from './stores/themeStore';
import { useConnectionStore } from './stores/connectionStore';
import { useI18n } from './hooks/useI18n';
import { websocketSimulator } from './mocks/websocketSimulator';
import PerformanceMonitor from './components/common/PerformanceMonitor';
import { SplashScreen } from './components/common/SplashScreen';

// Layout Components
import AppShell from './components/layout/AppShell';

// Critical pages (loaded immediately)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

// Legal pages (loaded immediately)
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import DocsPage from './pages/DocsPage';
import AboutPage from './pages/AboutPage';

// Lazy-loaded pages (code split)
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StrategiesPage = lazy(() => import('./pages/StrategiesPage'));
const CopyTradingPage = lazy(() => import('./pages/CopyTradingPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ComponentsDemoPage = lazy(() => import('./pages/ComponentsDemoPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-foreground-muted">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const { setWebSocketStatus, setHealthData } = useConnectionStore();
  const { initializeLanguage } = useI18n();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language
        initializeLanguage();
        
        // Simulate app initialization with proper loading time
        // This ensures splash screen shows for appropriate duration
        const startTime = Date.now();
        
        // Initialize essential services
        await Promise.all([
          // Simulate font loading
          new Promise(resolve => setTimeout(resolve, 800)),
          // Simulate theme initialization
          new Promise(resolve => setTimeout(resolve, 600)),
          // Simulate store hydration
          new Promise(resolve => setTimeout(resolve, 500))
        ]);
        
        // Ensure minimum loading time for splash screen visibility
        const elapsed = Date.now() - startTime;
        const minDuration = 2000; // Minimum 2 seconds for splash screen
        if (elapsed < minDuration) {
          await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
        }
        
        setIsAppReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still show app after minimum duration even if initialization fails
        setTimeout(() => setIsAppReady(true), 2000);
      }
    };

    initializeApp();
  }, [initializeLanguage]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Start WebSocket simulator in development and connect to connection store
  useEffect(() => {
    if (import.meta.env.DEV && isAuthenticated) {
      // Listen to health updates from simulator
      const handleHealthUpdate = (health: any) => {
        setWebSocketStatus(health.websocket_status);
        setHealthData({
          latency: health.cex_latency || 50,
          uptime: 99.5,
          errorRate: 0.1,
          status: health.websocket_status || 'connected',
          cex_latency: health.cex_latency,
          rpc_latency: health.rpc_latency,
          throttled: health.throttled,
          limits: health.limits,
          last_check: health.last_check
        });
      };

      const handleConnect = () => {
        setWebSocketStatus('connected');
      };

      const handleDisconnect = () => {
        setWebSocketStatus('disconnected');
      };

      // Add event listeners
      websocketSimulator.on('health_update', handleHealthUpdate);
      websocketSimulator.on('connect', handleConnect);
      websocketSimulator.on('disconnect', handleDisconnect);
      
      // Connect simulator
      websocketSimulator.connect();

      return () => {
        websocketSimulator.off('health_update', handleHealthUpdate);
        websocketSimulator.off('connect', handleConnect);
        websocketSimulator.off('disconnect', handleDisconnect);
        websocketSimulator.disconnect();
      };
    }
  }, [isAuthenticated, setWebSocketStatus, setHealthData]);

  // Show splash screen until app is ready and splash animation completes
  if (showSplash || !isAppReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground">
          <SplashScreen onComplete={handleSplashComplete} duration={2200} />
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
          <PerformanceMonitor />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            
            {/* Legal Pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Protected Routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <OnboardingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <DashboardPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/strategies"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <StrategiesPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/copy-trading"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <CopyTradingPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/simulator"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <SimulatorPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <AlertsPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <SettingsPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/demo"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Suspense fallback={<PageLoader />}>
                      <ComponentsDemoPage />
                    </Suspense>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Redirect authenticated users to dashboard */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
