/**
 * Dashboard Service Layer
 *
 * Handles all Supabase operations for dashboards and widgets
 * with strict farm-based isolation and RLS enforcement
 */

import { createClient } from '@/lib/supabase/client'
import {
  Dashboard,
  DashboardInsert,
  DashboardUpdate,
  DashboardResponse,
  DashboardListResponse,
  WidgetInstance,
  WidgetInsert,
  WidgetUpdate,
  WidgetTemplate,
} from '@/types/dashboard'

// ============================================================================
// DASHBOARD OPERATIONS
// ============================================================================

/**
 * Get all dashboards for the current farm
 * RLS ensures user only sees dashboards from farms they belong to
 */
export async function getDashboards(farmId: string): Promise<Dashboard[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching dashboards:', error)
    throw error
  }

  return data || []
}

/**
 * Get a single dashboard with all its widgets
 * RLS ensures user has access to this farm's dashboard
 */
export async function getDashboard(
  dashboardId: string
): Promise<DashboardResponse | null> {
  const supabase = createClient()

  // Fetch dashboard
  const { data: dashboard, error: dashboardError } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single()

  if (dashboardError) {
    console.error('Error fetching dashboard:', dashboardError)
    return null
  }

  // Fetch widgets for this dashboard
  const { data: widgets, error: widgetsError } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .order('layout_y', { ascending: true })
    .order('layout_x', { ascending: true })

  if (widgetsError) {
    console.error('Error fetching widgets:', widgetsError)
    return null
  }

  // Transform database records to WidgetInstance format
  const transformedWidgets: WidgetInstance[] = (widgets || []).map((w) => ({
    id: w.id,
    dashboard_id: w.dashboard_id,
    widget_type: w.widget_type,
    template_name: w.template_name,
    name: w.template_name,
    title: w.title,
    layout: {
      x: w.layout_x,
      y: w.layout_y,
      w: w.layout_w,
      h: w.layout_h,
      minW: w.layout_min_w,
      minH: w.layout_min_h,
      maxW: w.layout_max_w,
      maxH: w.layout_max_h,
    },
    config: w.config,
    created_at: w.created_at,
    updated_at: w.updated_at,
  }))

  return {
    dashboard,
    widgets: transformedWidgets,
  }
}

/**
 * Get the default dashboard for a farm
 */
export async function getDefaultDashboard(
  farmId: string
): Promise<Dashboard | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('farm_id', farmId)
    .eq('is_default', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No default dashboard found
      return null
    }
    console.error('Error fetching default dashboard:', error)
    return null
  }

  return data
}

/**
 * Check if user can create a dashboard for a given farm
 * Returns current dashboard count and max allowed by plan
 */
export async function canCreateDashboard(farmId: string): Promise<{
  canCreate: boolean
  currentCount: number
  maxAllowed: number
  message: string
}> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('can_user_create_dashboard', {
    p_farm_id: farmId,
  })

  if (error) {
    console.error('Error checking dashboard creation ability:', error)
    return {
      canCreate: false,
      currentCount: 0,
      maxAllowed: 0,
      message: 'Fehler beim Überprüfen der Dashboard-Berechtigung',
    }
  }

  if (data && data.length > 0) {
    return {
      canCreate: data[0].can_create,
      currentCount: data[0].current_count,
      maxAllowed: data[0].max_allowed,
      message: data[0].message,
    }
  }

  return {
    canCreate: false,
    currentCount: 0,
    maxAllowed: 0,
    message: 'Keine Daten gefunden',
  }
}

/**
 * Create a new dashboard
 * farm_id must be provided and user must have editor role
 * Checks dashboard limits before creation
 */
export async function createDashboard(
  dashboardData: DashboardInsert
): Promise<Dashboard | null> {
  const supabase = createClient()

  // Check if user can create dashboard
  const limitCheck = await canCreateDashboard(dashboardData.farm_id)
  if (!limitCheck.canCreate) {
    throw new Error(limitCheck.message)
  }

  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      farm_id: dashboardData.farm_id,
      name: dashboardData.name,
      description: dashboardData.description,
      is_default: dashboardData.is_default ?? false,
      is_template: dashboardData.is_template ?? false,
      grid_cols: dashboardData.grid_cols ?? 12,
      grid_row_height: dashboardData.grid_row_height ?? 80,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating dashboard:', error)
    throw error
  }

  return data
}

/**
 * Update an existing dashboard
 * RLS ensures user can only update dashboards from their farms
 */
export async function updateDashboard(
  dashboardId: string,
  updates: DashboardUpdate
): Promise<Dashboard | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboards')
    .update(updates)
    .eq('id', dashboardId)
    .select()
    .single()

  if (error) {
    console.error('Error updating dashboard:', error)
    throw error
  }

  return data
}

/**
 * Delete a dashboard
 * RLS ensures only owners/admins can delete
 * Widgets are cascade deleted automatically
 */
export async function deleteDashboard(dashboardId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId)

  if (error) {
    console.error('Error deleting dashboard:', error)
    return false
  }

  return true
}

/**
 * Set a dashboard as the default for its farm
 * Automatically unsets other defaults
 */
export async function setDefaultDashboard(
  dashboardId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboards')
    .update({ is_default: true })
    .eq('id', dashboardId)

  if (error) {
    console.error('Error setting default dashboard:', error)
    return false
  }

  return true
}

// ============================================================================
// WIDGET OPERATIONS
// ============================================================================

/**
 * Create a new widget on a dashboard
 * RLS ensures user has access to the dashboard
 */
export async function createWidget(
  widgetData: WidgetInsert
): Promise<WidgetInstance | null> {
  const supabase = createClient()

  const { data, error} = await supabase
    .from('dashboard_widgets')
    .insert({
      dashboard_id: widgetData.dashboard_id,
      widget_type: widgetData.widget_type,
      template_name: widgetData.template_name,
      title: widgetData.title,
      layout_x: widgetData.layout_x,
      layout_y: widgetData.layout_y,
      layout_w: widgetData.layout_w,
      layout_h: widgetData.layout_h,
      layout_min_w: widgetData.layout_min_w ?? 2,
      layout_min_h: widgetData.layout_min_h ?? 2,
      layout_max_w: widgetData.layout_max_w,
      layout_max_h: widgetData.layout_max_h,
      config: widgetData.config,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating widget:', error)
    throw error
  }

  // Transform to WidgetInstance format
  return {
    id: data.id,
    dashboard_id: data.dashboard_id,
    widget_type: data.widget_type,
    template_name: data.template_name,
    name: data.template_name,
    title: data.title,
    layout: {
      x: data.layout_x,
      y: data.layout_y,
      w: data.layout_w,
      h: data.layout_h,
      minW: data.layout_min_w,
      minH: data.layout_min_h,
      maxW: data.layout_max_w,
      maxH: data.layout_max_h,
    },
    config: data.config,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Update a widget
 * RLS ensures user has access to the dashboard
 */
export async function updateWidget(
  widgetId: string,
  updates: WidgetUpdate
): Promise<WidgetInstance | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .update(updates)
    .eq('id', widgetId)
    .select()
    .single()

  if (error) {
    console.error('Error updating widget:', error)
    throw error
  }

  // Transform to WidgetInstance format
  return {
    id: data.id,
    dashboard_id: data.dashboard_id,
    widget_type: data.widget_type,
    template_name: data.template_name,
    name: data.template_name,
    title: data.title,
    layout: {
      x: data.layout_x,
      y: data.layout_y,
      w: data.layout_w,
      h: data.layout_h,
      minW: data.layout_min_w,
      minH: data.layout_min_h,
      maxW: data.layout_max_w,
      maxH: data.layout_max_h,
    },
    config: data.config,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Delete a widget
 * RLS ensures user has access to the dashboard
 */
export async function deleteWidget(widgetId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId)

  if (error) {
    console.error('Error deleting widget:', error)
    return false
  }

  return true
}

/**
 * Bulk update widget layouts
 * Optimized for drag-drop operations
 */
export async function updateWidgetLayouts(
  layouts: Array<{
    id: string
    layout_x: number
    layout_y: number
    layout_w: number
    layout_h: number
    layout_min_w?: number
    layout_min_h?: number
    layout_max_w?: number
    layout_max_h?: number
  }>
): Promise<boolean> {
  const supabase = createClient()

  try {
    // Update each widget layout
    const updates = layouts.map((layout) =>
      supabase
        .from('dashboard_widgets')
        .update({
          layout_x: layout.layout_x,
          layout_y: layout.layout_y,
          layout_w: layout.layout_w,
          layout_h: layout.layout_h,
          layout_min_w: layout.layout_min_w,
          layout_min_h: layout.layout_min_h,
          layout_max_w: layout.layout_max_w,
          layout_max_h: layout.layout_max_h,
        })
        .eq('id', layout.id)
    )

    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Error updating widget layouts:', error)
    return false
  }
}

// ============================================================================
// WIDGET TEMPLATES
// ============================================================================

/**
 * Get all widget templates
 * Available to all authenticated users
 */
export async function getWidgetTemplates(): Promise<WidgetTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('widget_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching widget templates:', error)
    return []
  }

  return data || []
}

/**
 * Get widget templates by category
 */
export async function getWidgetTemplatesByCategory(
  category: string
): Promise<WidgetTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('widget_templates')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching widget templates:', error)
    return []
  }

  return data || []
}

/**
 * Create widget from template
 */
export async function createWidgetFromTemplate(
  dashboardId: string,
  templateId: string,
  position: { x: number; y: number }
): Promise<WidgetInstance | null> {
  const supabase = createClient()

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from('widget_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    console.error('Error fetching template:', templateError)
    return null
  }

  // Create widget from template
  const widgetData: WidgetInsert = {
    dashboard_id: dashboardId,
    widget_type: template.widget_type,
    title: template.display_name,
    layout_x: position.x,
    layout_y: position.y,
    layout_w: template.default_width,
    layout_h: template.default_height,
    config: {
      ...template.default_config,
      description: template.description,
    },
  }

  return createWidget(widgetData)
}

// ============================================================================
// DASHBOARD TEMPLATES
// ============================================================================

/**
 * Clone a dashboard template
 */
export async function cloneDashboard(
  sourceDashboardId: string,
  farmId: string,
  newName: string
): Promise<Dashboard | null> {
  const supabase = createClient()

  try {
    // Get source dashboard and widgets
    const source = await getDashboard(sourceDashboardId)
    if (!source) return null

    // Create new dashboard
    const newDashboard = await createDashboard({
      farm_id: farmId,
      name: newName,
      description: source.dashboard.description,
      grid_cols: source.dashboard.grid_cols,
      grid_row_height: source.dashboard.grid_row_height,
    })

    if (!newDashboard) return null

    // Clone widgets
    const widgetPromises = source.widgets.map((widget) =>
      createWidget({
        dashboard_id: newDashboard.id,
        widget_type: widget.widget_type,
        title: widget.title,
        layout_x: widget.layout.x,
        layout_y: widget.layout.y,
        layout_w: widget.layout.w,
        layout_h: widget.layout.h,
        layout_min_w: widget.layout.minW,
        layout_min_h: widget.layout.minH,
        layout_max_w: widget.layout.maxW,
        layout_max_h: widget.layout.maxH,
        config: widget.config,
      })
    )

    await Promise.all(widgetPromises)

    return newDashboard
  } catch (error) {
    console.error('Error cloning dashboard:', error)
    return null
  }
}
