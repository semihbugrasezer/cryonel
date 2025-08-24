import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';
type ActualTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  actualTheme: ActualTheme;
  autoTimeBasedSwitching: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAutoTimeBasedSwitching: (enabled: boolean) => void;
}

const getTimeBasedTheme = (): ActualTheme => {
  const hour = new Date().getHours();
  // Dark mode from 18:00 to 06:00 (6 PM to 6 AM)
  return (hour >= 18 || hour < 6) ? 'dark' : 'light';
};

const getSystemTheme = (): ActualTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveActualTheme = (mode: ThemeMode, autoTimeBasedSwitching: boolean): ActualTheme => {
  if (mode === 'auto') {
    return autoTimeBasedSwitching ? getTimeBasedTheme() : getSystemTheme();
  }
  return mode;
};

const applyTheme = (theme: ActualTheme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Also set data attribute for more specific CSS targeting
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }
};

let timeInterval: NodeJS.Timeout | null = null;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      actualTheme: 'light',
      autoTimeBasedSwitching: false,
      
      setMode: (mode) => {
        const state = get();
        const newActualTheme = resolveActualTheme(mode, state.autoTimeBasedSwitching);
        
        set({ mode, actualTheme: newActualTheme });
        applyTheme(newActualTheme);
        
        // Setup or clear time-based checking
        if (mode === 'auto' && state.autoTimeBasedSwitching) {
          // Check every minute for time-based changes
          if (timeInterval) clearInterval(timeInterval);
          timeInterval = setInterval(() => {
            const currentState = get();
            if (currentState.mode === 'auto' && currentState.autoTimeBasedSwitching) {
              const newTheme = getTimeBasedTheme();
              if (newTheme !== currentState.actualTheme) {
                set({ actualTheme: newTheme });
                applyTheme(newTheme);
              }
            }
          }, 60000); // Check every minute
        } else {
          if (timeInterval) {
            clearInterval(timeInterval);
            timeInterval = null;
          }
        }
      },
      
      toggleMode: () => {
        const currentMode = get().mode;
        const nextMode: ThemeMode = 
          currentMode === 'light' ? 'dark' : 
          currentMode === 'dark' ? 'auto' : 'light';
        get().setMode(nextMode);
      },
      
      setAutoTimeBasedSwitching: (enabled) => {
        const state = get();
        set({ autoTimeBasedSwitching: enabled });
        
        if (state.mode === 'auto') {
          const newActualTheme = resolveActualTheme('auto', enabled);
          set({ actualTheme: newActualTheme });
          applyTheme(newActualTheme);
          
          // Setup or clear time interval
          if (enabled) {
            if (timeInterval) clearInterval(timeInterval);
            timeInterval = setInterval(() => {
              const currentState = get();
              if (currentState.mode === 'auto' && currentState.autoTimeBasedSwitching) {
                const newTheme = getTimeBasedTheme();
                if (newTheme !== currentState.actualTheme) {
                  set({ actualTheme: newTheme });
                  applyTheme(newTheme);
                }
              }
            }, 60000);
          } else {
            if (timeInterval) {
              clearInterval(timeInterval);
              timeInterval = null;
            }
          }
        }
      },
    }),
    {
      name: 'cryonel-theme-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Resolve actual theme based on current settings
          const actualTheme = resolveActualTheme(state.mode, state.autoTimeBasedSwitching);
          state.actualTheme = actualTheme;
          applyTheme(actualTheme);
          
          // Setup time-based switching if enabled
          if (state.mode === 'auto' && state.autoTimeBasedSwitching) {
            if (timeInterval) clearInterval(timeInterval);
            timeInterval = setInterval(() => {
              const currentState = useThemeStore.getState();
              if (currentState.mode === 'auto' && currentState.autoTimeBasedSwitching) {
                const newTheme = getTimeBasedTheme();
                if (newTheme !== currentState.actualTheme) {
                  useThemeStore.setState({ actualTheme: newTheme });
                  applyTheme(newTheme);
                }
              }
            }, 60000);
          }
        } else {
          // Initialize with auto mode and system theme
          const systemTheme = getSystemTheme();
          applyTheme(systemTheme);
        }
      },
    }
  )
);

// Initialize theme immediately when module loads
if (typeof window !== 'undefined') {
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    const state = useThemeStore.getState();
    if (state.mode === 'auto' && !state.autoTimeBasedSwitching) {
      const newTheme = getSystemTheme();
      if (newTheme !== state.actualTheme) {
        useThemeStore.setState({ actualTheme: newTheme });
        applyTheme(newTheme);
      }
    }
  };
  
  mediaQuery.addEventListener('change', handleSystemThemeChange);
  
  // Initial theme application
  const storedSettings = localStorage.getItem('cryonel-theme-settings');
  if (storedSettings) {
    try {
      const parsed = JSON.parse(storedSettings);
      const actualTheme = resolveActualTheme(
        parsed.state?.mode || 'auto', 
        parsed.state?.autoTimeBasedSwitching || false
      );
      applyTheme(actualTheme);
    } catch {
      applyTheme(getSystemTheme());
    }
  } else {
    applyTheme(getSystemTheme());
  }
}