import { create } from "zustand";
import { persist } from "zustand/middleware";
export type NotificationType = "success" | "error" | "info" | "warning";
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: number;
}
interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
}
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              read: false,
              createdAt: Date.now(),
            },
            ...state.notifications,
          ].slice(0, 50), 
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearAll: () => set({ notifications: [] }),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "healthai-notifications", 
    }
  )
);
