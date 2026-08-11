// ══════════════════════════════════════════
// store/useAppStore.js — Global state
// ══════════════════════════════════════════
import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Auth
  user:     null,
  token:    localStorage.getItem('token') || null,
  setUser:  (user)  => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  // Violations
  violations:     [],
  setViolations:  (violations) => set({ violations }),

  // Stats
  stats:     null,
  setStats:  (stats) => set({ stats }),

  // Alerts
  alerts:     [],
  addAlert:   (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 10)
  })),
  clearAlerts: () => set({ alerts: [] })
}))

export default useAppStore