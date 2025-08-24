import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIState, Notification } from '../types';

interface UIActions {
    setTheme: (theme: 'light' | 'dark') => void;
    toggleTheme: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    addModal: (modalId: string) => void;
    removeModal: (modalId: string) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    // Compat properties
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
    persist(
        (set, get) => ({
            // State
            theme: 'light',
            sidebar_open: false,
            sidebar_collapsed: false,
            active_modals: [],
            notifications: [],
            
            // Compat properties
            sidebarOpen: false,
            sidebarCollapsed: false,

            // Actions
            setTheme: (theme) => set({ theme }),

            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),

            setSidebarOpen: (sidebar_open) => set({ sidebar_open, sidebarOpen: sidebar_open }),

            setSidebarCollapsed: (sidebar_collapsed) => set({ sidebar_collapsed, sidebarCollapsed: sidebar_collapsed }),

            toggleSidebar: () => set((state) => ({
                sidebar_open: !state.sidebar_open,
                sidebarOpen: !state.sidebar_open
            })),

            addModal: (modalId) => set((state) => ({
                active_modals: [...state.active_modals, modalId]
            })),

            removeModal: (modalId) => set((state) => ({
                active_modals: state.active_modals.filter(id => id !== modalId)
            })),

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                };

                set((state) => ({
                    notifications: [...state.notifications, newNotification]
                }));

                // Auto-remove notification after duration or default 5 seconds
                setTimeout(() => {
                    get().removeNotification(newNotification.id);
                }, notification.duration || 5000);
            },

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            clearNotifications: () => set({ notifications: [] }),
        }),
        {
            name: 'cryonel-ui',
            partialize: (state) => ({
                theme: state.theme,
                sidebar_collapsed: state.sidebar_collapsed,
            }),
        }
    )
);
