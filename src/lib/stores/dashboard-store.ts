/**
 * Dashboard Store - Zustand State Management
 *
 * Manages dashboard state including current dashboard, widgets, edit mode,
 * and provides actions for CRUD operations with farm-based isolation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Dashboard,
  DashboardInsert,
  DashboardUpdate,
  WidgetInstance,
  WidgetInsert,
  WidgetUpdate,
  WidgetLayout,
  WidgetConfig,
  DashboardLayout,
  DashboardState,
} from '@/types/dashboard'
import {
  getDashboard,
  getDashboards,
  createDashboard as createDashboardApi,
  updateDashboard as updateDashboardApi,
  deleteDashboard as deleteDashboardApi,
  setDefaultDashboard as setDefaultDashboardApi,
  createWidget,
  updateWidget as updateWidgetApi,
  deleteWidget,
  updateWidgetLayouts,
} from '@/lib/services/dashboard-service'

interface DashboardStoreState extends DashboardState {
  // Additional internal state not in DashboardState interface
  error: string | null
  setError: (error: string | null) => void

  // Global date range for dashboard
  globalDateRange: { startDate: string; endDate: string } | null
  setGlobalDateRange: (range: { startDate: string; endDate: string } | null) => void

  // Original widgets state for cancel functionality
  originalWidgets: WidgetInstance[] | null
  cancelEdit: () => void
}

export const useDashboardStore = create<DashboardStoreState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // STATE
      // ========================================================================
      currentDashboard: null,
      dashboards: [],
      widgets: [],
      isEditMode: false,
      selectedWidgetId: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // Global date range - defaults to last 30 days
      globalDateRange: null,

      // Original widgets state for cancel
      originalWidgets: null,

      // ========================================================================
      // SETTERS
      // ========================================================================
      setCurrentDashboard: (dashboard) => {
        set({ currentDashboard: dashboard })
      },

      setDashboards: (dashboards) => {
        set({ dashboards })
      },

      setWidgets: (widgets) => {
        set({ widgets })
      },

      setEditMode: (mode) => {
        const { widgets } = get()
        // Save original state when entering edit mode
        if (mode && !get().originalWidgets) {
          set({ isEditMode: mode, selectedWidgetId: null, originalWidgets: JSON.parse(JSON.stringify(widgets)) })
        } else if (!mode) {
          // Clear original state when exiting edit mode
          set({ isEditMode: mode, selectedWidgetId: null, originalWidgets: null })
        } else {
          set({ isEditMode: mode, selectedWidgetId: null })
        }
      },

      cancelEdit: () => {
        const { originalWidgets } = get()
        if (originalWidgets) {
          set({
            widgets: originalWidgets,
            isEditMode: false,
            originalWidgets: null,
            selectedWidgetId: null
          })
        }
      },

      setSelectedWidget: (id) => {
        set({ selectedWidgetId: id })
      },

      setError: (error) => {
        set({ error })
      },

      setGlobalDateRange: (range) => {
        set({ globalDateRange: range })
      },

      // ========================================================================
      // WIDGET OPERATIONS
      // ========================================================================
      addWidget: async (widgetData) => {
        const { currentDashboard, widgets } = get()
        if (!currentDashboard) {
          console.error('No dashboard selected')
          return
        }

        console.log('addWidget called with:', widgetData)

        try {
          // Create widget insert data
          const insertData: WidgetInsert = {
            dashboard_id: currentDashboard.id,
            widget_type: widgetData.widget_type,
            template_name: widgetData.template_name,
            title: widgetData.title,
            layout_x: widgetData.layout_x,
            layout_y: widgetData.layout_y,
            layout_w: widgetData.layout_w,
            layout_h: widgetData.layout_h,
            layout_min_w: widgetData.layout_min_w,
            layout_min_h: widgetData.layout_min_h,
            layout_max_w: widgetData.layout_max_w,
            layout_max_h: widgetData.layout_max_h,
            config: widgetData.config,
          }

          console.log('Inserting widget with data:', insertData)

          const newWidget = await createWidget(insertData)
          console.log('Created widget:', newWidget)
          if (newWidget) {
            set({ widgets: [...widgets, newWidget] })
          }
        } catch (error) {
          console.error('Error adding widget:', error)
          set({ error: 'Failed to add widget' })
        }
      },

      removeWidget: async (id) => {
        const { widgets } = get()

        try {
          const success = await deleteWidget(id)
          if (success) {
            set({ widgets: widgets.filter((w) => w.id !== id) })
          }
        } catch (error) {
          console.error('Error removing widget:', error)
          set({ error: 'Failed to remove widget' })
        }
      },

      updateWidget: async (id, updates) => {
        const { widgets } = get()

        try {
          const updated = await updateWidgetApi(id, updates)
          if (updated) {
            set({
              widgets: widgets.map((w) => (w.id === id ? updated : w)),
            })
          }
        } catch (error) {
          console.error('Error updating widget:', error)
          set({ error: 'Failed to update widget' })
        }
      },

      updateWidgetLayout: async (id, layout) => {
        const { widgets } = get()

        try {
          const updates: WidgetUpdate = {
            layout_x: layout.x,
            layout_y: layout.y,
            layout_w: layout.w,
            layout_h: layout.h,
            layout_min_w: layout.minW,
            layout_min_h: layout.minH,
            layout_max_w: layout.maxW,
            layout_max_h: layout.maxH,
          }

          const updated = await updateWidgetApi(id, updates)
          if (updated) {
            set({
              widgets: widgets.map((w) => (w.id === id ? updated : w)),
            })
          }
        } catch (error) {
          console.error('Error updating widget layout:', error)
          set({ error: 'Failed to update widget layout' })
        }
      },

      updateWidgetConfig: async (id, config) => {
        const { widgets } = get()
        const widget = widgets.find((w) => w.id === id)
        if (!widget) return

        try {
          const updates: WidgetUpdate = {
            config: { ...widget.config, ...config },
          }

          const updated = await updateWidgetApi(id, updates)
          if (updated) {
            set({
              widgets: widgets.map((w) => (w.id === id ? updated : w)),
            })
          }
        } catch (error) {
          console.error('Error updating widget config:', error)
          set({ error: 'Failed to update widget configuration' })
        }
      },

      // ========================================================================
      // DASHBOARD OPERATIONS
      // ========================================================================
      loadDashboard: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const response = await getDashboard(id)
          if (response) {
            set({
              currentDashboard: response.dashboard,
              widgets: response.widgets,
              isLoading: false,
            })
          } else {
            set({ error: 'Dashboard not found', isLoading: false })
          }
        } catch (error) {
          console.error('Error loading dashboard:', error)
          set({ error: 'Failed to load dashboard', isLoading: false })
        }
      },

      saveDashboard: async () => {
        const { currentDashboard, widgets } = get()
        if (!currentDashboard) return

        set({ isSaving: true, error: null })

        try {
          // Update widget layouts in bulk
          const layouts = widgets.map((widget) => ({
            id: widget.id,
            layout_x: widget.layout.x,
            layout_y: widget.layout.y,
            layout_w: widget.layout.w,
            layout_h: widget.layout.h,
            layout_min_w: widget.layout.minW,
            layout_min_h: widget.layout.minH,
            layout_max_w: widget.layout.maxW,
            layout_max_h: widget.layout.maxH,
          }))

          await updateWidgetLayouts(layouts)
          set({ isSaving: false })
        } catch (error) {
          console.error('Error saving dashboard:', error)
          set({ error: 'Failed to save dashboard', isSaving: false })
        }
      },

      createDashboard: async (dashboardData) => {
        set({ isLoading: true, error: null })

        try {
          const newDashboard = await createDashboardApi(dashboardData)
          if (newDashboard) {
            const { dashboards } = get()
            set({
              dashboards: [...dashboards, newDashboard],
              currentDashboard: newDashboard,
              widgets: [],
              isLoading: false,
            })
            return newDashboard
          }
          set({ error: 'Failed to create dashboard', isLoading: false })
          return null
        } catch (error) {
          console.error('Error creating dashboard:', error)
          set({ error: 'Failed to create dashboard', isLoading: false })
          return null
        }
      },

      updateDashboardInfo: async (id, updates) => {
        set({ isSaving: true, error: null })

        try {
          const updated = await updateDashboardApi(id, updates)
          if (updated) {
            const { dashboards, currentDashboard } = get()
            set({
              dashboards: dashboards.map((d) => (d.id === id ? updated : d)),
              currentDashboard:
                currentDashboard?.id === id ? updated : currentDashboard,
              isSaving: false,
            })
          } else {
            set({ error: 'Failed to update dashboard', isSaving: false })
          }
        } catch (error) {
          console.error('Error updating dashboard:', error)
          set({ error: 'Failed to update dashboard', isSaving: false })
        }
      },

      deleteDashboard: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const success = await deleteDashboardApi(id)
          if (success) {
            const { dashboards, currentDashboard } = get()
            set({
              dashboards: dashboards.filter((d) => d.id !== id),
              currentDashboard:
                currentDashboard?.id === id ? null : currentDashboard,
              widgets: currentDashboard?.id === id ? [] : get().widgets,
              isLoading: false,
            })
          } else {
            set({ error: 'Failed to delete dashboard', isLoading: false })
          }
        } catch (error) {
          console.error('Error deleting dashboard:', error)
          set({ error: 'Failed to delete dashboard', isLoading: false })
        }
      },

      setDefaultDashboard: async (id) => {
        try {
          const success = await setDefaultDashboardApi(id)
          if (success) {
            const { dashboards } = get()
            // Update is_default flag for all dashboards
            const updated = dashboards.map((d) => ({
              ...d,
              is_default: d.id === id,
            }))
            set({ dashboards: updated })
          }
        } catch (error) {
          console.error('Error setting default dashboard:', error)
          set({ error: 'Failed to set default dashboard' })
        }
      },

      // ========================================================================
      // BULK OPERATIONS
      // ========================================================================
      updateAllLayouts: (layouts) => {
        const { widgets } = get()

        // Update local state immediately for responsive UI
        const updatedWidgets = widgets.map((widget) => {
          const layout = layouts.find((l) => l.i === widget.id)
          if (layout) {
            return {
              ...widget,
              layout: {
                x: layout.x,
                y: layout.y,
                w: layout.w,
                h: layout.h,
                minW: layout.minW,
                minH: layout.minH,
                maxW: layout.maxW,
                maxH: layout.maxH,
              },
            }
          }
          return widget
        })

        set({ widgets: updatedWidgets })
      },

      // ========================================================================
      // RESET
      // ========================================================================
      reset: () => {
        set({
          currentDashboard: null,
          dashboards: [],
          widgets: [],
          isEditMode: false,
          selectedWidgetId: null,
          isLoading: false,
          isSaving: false,
          error: null,
        })
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        // Only persist selected fields
        isEditMode: state.isEditMode,
        // Don't persist dashboard data - always fetch fresh with RLS
      }),
    }
  )
)

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get current dashboard ID
 */
export const useCurrentDashboardId = () => {
  return useDashboardStore((state) => state.currentDashboard?.id)
}

/**
 * Hook to check if in edit mode
 */
export const useIsEditMode = () => {
  return useDashboardStore((state) => state.isEditMode)
}

/**
 * Hook to get current widgets
 */
export const useCurrentWidgets = () => {
  return useDashboardStore((state) => state.widgets)
}

/**
 * Hook to get loading states
 */
export const useDashboardLoading = () => {
  return useDashboardStore((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
  }))
}

/**
 * Hook to get error state
 */
export const useDashboardError = () => {
  return useDashboardStore((state) => state.error)
}
