/**
 * Dashboard System TypeScript Types
 *
 * Defines all interfaces and types for the customizable dashboard system
 * with farm-based isolation and RLS support
 */

import { Layout as GridLayout } from 'react-grid-layout'
import { LucideIcon } from 'lucide-react'

// ============================================================================
// CORE DASHBOARD TYPES
// ============================================================================

export interface Dashboard {
  id: string
  farm_id: string
  name: string
  description?: string
  is_default: boolean
  is_template: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  grid_cols: number
  grid_row_height: number
}

export interface DashboardInsert {
  farm_id: string
  name: string
  description?: string
  is_default?: boolean
  is_template?: boolean
  grid_cols?: number
  grid_row_height?: number
}

export interface DashboardUpdate {
  name?: string
  description?: string
  is_default?: boolean
  grid_cols?: number
  grid_row_height?: number
}

// ============================================================================
// WIDGET TYPES
// ============================================================================

export type WidgetType = 'stat' | 'chart' | 'table' | 'pivot' | 'gauge' | 'activity' | 'heatmap' | 'waterfall' | 'scatter'

export interface WidgetInstance {
  id: string
  dashboard_id: string
  widget_type: WidgetType
  template_name?: string
  name?: string
  title: string
  layout: WidgetLayout
  config: WidgetConfig
  created_at: string
  updated_at: string
}

export interface WidgetInsert {
  dashboard_id: string
  widget_type: WidgetType
  template_name?: string
  title: string
  layout_x: number
  layout_y: number
  layout_w: number
  layout_h: number
  layout_min_w?: number
  layout_min_h?: number
  layout_max_w?: number
  layout_max_h?: number
  config: WidgetConfig
}

export interface WidgetUpdate {
  title?: string
  layout_x?: number
  layout_y?: number
  layout_w?: number
  layout_h?: number
  layout_min_w?: number
  layout_min_h?: number
  layout_max_w?: number
  layout_max_h?: number
  config?: WidgetConfig
}

export interface WidgetLayout {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

// ============================================================================
// WIDGET CONFIGURATION TYPES
// ============================================================================

export interface WidgetConfig {
  // Common configuration
  description?: string
  dataSource?: string
  timeRange?: TimeRangeConfig
  filters?: FilterConfig
  refreshInterval?: number

  // Type-specific configuration
  [key: string]: any
}

// Stat Widget Configuration
export interface StatWidgetConfig extends WidgetConfig {
  dataSource:
    // Feed/Cost data sources
    | 'monthly_cost' | 'feed_count' | 'daily_avg' | 'total_quantity' | 'supplier_count' | 'area_count'
    // Single cycle KPI data sources (ignore global date range, use cycle dates)
    | 'current_cycle_profit' | 'current_cycle_fcr' | 'current_cycle_feed_cost'
    | 'current_cycle_duration' | 'current_cycle_animals' | 'current_cycle_margin'
    | 'current_cycle_feed_efficiency' | 'current_cycle_cost_per_animal'
    // Cycle comparison data sources
    | 'best_cycle_profit' | 'worst_cycle_profit' | 'avg_fcr_all_cycles' | 'avg_cycle_profit'
  format: 'currency' | 'number' | 'percentage'
  icon: string
  color?: string
  comparisonPeriod?: 'previous' | 'none'
  cycleSelector?: CycleSelector // Optional cycle selection for cycle-specific metrics
}

// Chart Widget Configuration
export interface ChartWidgetConfig extends WidgetConfig {
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'composed'
    // Cycle-specific chart types (ignore global date range, use cycle dates)
    | 'cycleAreaPerformance' | 'cycleFeedComponents' | 'cycleTrendAnalysis' | 'cycleCostPerAnimal'
  xAxis?: string
  yAxis?: string
  groupBy?: string
  showLegend?: boolean
  showGrid?: boolean
  colors?: string[]
  cycleSelector?: CycleSelector // Optional cycle selection for cycle-specific charts
}

// Table Widget Configuration
export interface TableWidgetConfig extends WidgetConfig {
  dataSource?:
    // Cycle-specific table data sources (ignore global date range, use cycle dates)
    | 'cycleAreas' | 'cycleFeedComponents' | 'cycleComparison'
  columns: TableColumn[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  pageSize?: number
  showExport?: boolean
  cycleSelector?: CycleSelector // Optional cycle selection for cycle-specific tables
}

export interface TableColumn {
  field: string
  label: string
  sortable?: boolean
  format?: 'currency' | 'number' | 'date' | 'text'
  width?: number
}

// Pivot Widget Configuration
export interface PivotWidgetConfig extends WidgetConfig {
  rows: string[]
  columns: string[]
  values: PivotValue[]
  showGrandTotals?: boolean
  showSubtotals?: boolean
}

export interface PivotValue {
  field: string
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  label: string
}

// Gauge Widget Configuration
export interface GaugeWidgetConfig extends WidgetConfig {
  metric: string
    // Cycle-specific gauge metrics (ignore global date range, use cycle dates)
    | 'cycle_profit_margin' | 'cycle_fcr' | 'cycle_feed_efficiency' | 'cycle_mortality_rate'
  target: number
  unit: string
  thresholds?: {
    low: number
    medium: number
    high: number
  }
  cycleSelector?: CycleSelector // Optional cycle selection for cycle-specific gauges
}

// Activity Widget Configuration
export interface ActivityWidgetConfig extends WidgetConfig {
  source: 'uploads' | 'changes' | 'alerts'
  limit: number
}

// Heatmap Widget Configuration
export interface HeatmapWidgetConfig extends WidgetConfig {
  dataSource:
    | 'fcr_by_area_cycle' | 'profit_by_area_cycle' | 'cost_by_supplier_time'
    | 'mortality_by_season' | 'performance_by_time'
  xAxis: 'time' | 'cycle' | 'month' | 'quarter' | 'week'
  yAxis: 'area' | 'supplier' | 'feed_type' | 'area_group'
  metric: 'profit' | 'fcr' | 'cost' | 'feed_efficiency' | 'mortality_rate'
  colorScale?: {
    min: string
    mid: string
    max: string
  }
  aggregation?: 'sum' | 'avg' | 'min' | 'max'
  showLegend?: boolean
  showValues?: boolean
}

// Waterfall Chart Configuration
export interface WaterfallWidgetConfig extends WidgetConfig {
  dataSource:
    | 'cost_structure_breakdown' | 'profit_bridge' | 'fcr_changes'
    | 'weight_gain_progression' | 'cycle_cost_breakdown'
  startValue?: number // Starting value (e.g., revenue)
  steps: WaterfallStep[]
  endValue?: number // Ending value (e.g., profit)
  showConnectors?: boolean
  showTotal?: boolean
  colors?: {
    positive: string
    negative: string
    total: string
  }
  cycleSelector?: CycleSelector
}

export interface WaterfallStep {
  label: string
  field: string
  isSubtotal?: boolean
}

// Scatter Plot Configuration
export interface ScatterWidgetConfig extends WidgetConfig {
  dataSource:
    | 'fcr_vs_profit' | 'duration_vs_profitability' | 'cost_vs_animals'
    | 'mortality_vs_efficiency' | 'weight_gain_vs_consumption'
  xAxis: {
    field: string
    label: string
  }
  yAxis: {
    field: string
    label: string
  }
  pointSize?: {
    field?: string // Optional 3rd dimension
    min: number
    max: number
  }
  showTrendLine?: boolean
  showQuadrants?: boolean
  quadrantThresholds?: {
    x: number
    y: number
  }
  colors?: string[]
  groupBy?: string // Color points by category (e.g., area, season)
}

// ============================================================================
// TIME RANGE & FILTER TYPES
// ============================================================================

export interface TimeRangeConfig {
  type: 'relative' | 'absolute'
  value: string // '7d', '30d', '90d' for relative; ISO dates for absolute
  startDate?: string
  endDate?: string
}

export interface FilterConfig {
  feedTypeIds?: string[]
  areaIds?: string[]
  supplierIds?: string[]
  searchTerm?: string
}

/**
 * Cycle Selector Configuration
 *
 * Used by cycle-specific widgets to determine which cycle to display.
 * These widgets IGNORE global dashboard date range filters and always
 * query based on cycle start/end dates.
 */
export interface CycleSelector {
  mode: 'current' | 'latest' | 'best' | 'worst' | 'specific'
  cycleId?: string // Required when mode is 'specific'
  comparisonMode?: 'none' | 'previous' | 'average' // For trend comparison
}

export type CycleSelectorMode = 'current' | 'latest' | 'best' | 'worst' | 'specific'

// ============================================================================
// WIDGET TEMPLATE TYPES
// ============================================================================

export interface WidgetTemplate {
  id: string
  name: string
  display_name: string
  description?: string
  widget_type: WidgetType
  category: WidgetCategory
  default_config: WidgetConfig
  default_width: number
  default_height: number
  preview_image?: string
  is_premium: boolean
  created_at: string
}

export type WidgetCategory = 'cost' | 'feed' | 'supplier' | 'analysis' | 'general' | 'cycle'

// ============================================================================
// WIDGET DATA TYPES
// ============================================================================

// Generic widget data response
export interface WidgetData<T = any> {
  data: T
  loading: boolean
  error?: string
  lastUpdated: Date
}

// Stat widget data
export interface StatData {
  value: number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}

// Chart widget data
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  color?: string
}

// Table widget data
export interface TableData {
  rows: TableRow[]
  totalCount: number
  pageSize: number
  currentPage: number
}

export interface TableRow {
  [key: string]: any
}

// ============================================================================
// CYCLE-SPECIFIC WIDGET DATA TYPES
// ============================================================================

/**
 * Cycle Metrics Data
 *
 * Data returned from calculateCycleMetrics() for a single cycle.
 * Used by cycle-specific stat widgets.
 */
export interface CycleMetricsData {
  cycleId: string
  cycleName: string
  startDate: string
  endDate: string | null
  totalAnimals: number
  weightGain: number
  totalFeedCost: number
  animalPurchaseCost: number
  additionalCosts: number
  totalCosts: number
  totalRevenue: number
  profitLoss: number
  profitMargin: number
  feedConversionRatio: number
  feedCostPerAnimal: number
  feedCostPerKg: number
  dailyFeedCost: number
  feedEfficiency: number
  duration: number
}

/**
 * Cycle Area Performance Data
 *
 * Data for area breakdown within a cycle.
 * Used by area performance charts and tables.
 */
export interface CycleAreaData {
  areaId: string
  areaName: string
  animalCount: number
  feedCost: number
  feedCostPerAnimal: number
  feedCostPerDay: number
  feedCostPerKg: number
  percentageOfTotal: number
  profitLoss: number
  profitLossFull: number
}

/**
 * Cycle Feed Component Data
 *
 * Data for feed type breakdown within a cycle.
 * Used by feed component charts and tables.
 */
export interface CycleFeedComponentData {
  feedTypeName: string
  totalQuantity: number
  totalCost: number
  weightedAvgPrice: number
  percentageOfTotal: number
  dailyConsumption: number
}

/**
 * Cycle Comparison Data
 *
 * Data for comparing multiple cycles.
 * Used by cycle comparison tables and trend charts.
 */
export interface CycleComparisonData {
  cycleId: string
  cycleName: string
  startDate: string
  duration: number
  profitLoss: number
  fcr: number
  feedCostPerAnimal: number
  profitMargin: number
}

// ============================================================================
// GRID LAYOUT TYPES (react-grid-layout compatible)
// ============================================================================

export interface DashboardLayout {
  i: string // widget id
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

export interface ResponsiveLayouts {
  lg?: DashboardLayout[]
  md?: DashboardLayout[]
  sm?: DashboardLayout[]
}

// ============================================================================
// DASHBOARD STATE TYPES
// ============================================================================

export interface DashboardState {
  // Current state
  currentDashboard: Dashboard | null
  dashboards: Dashboard[]
  widgets: WidgetInstance[]
  isEditMode: boolean
  selectedWidgetId: string | null

  // Loading states
  isLoading: boolean
  isSaving: boolean

  // Actions
  setCurrentDashboard: (dashboard: Dashboard | null) => void
  setDashboards: (dashboards: Dashboard[]) => void
  setWidgets: (widgets: WidgetInstance[]) => void
  setEditMode: (mode: boolean) => void
  setSelectedWidget: (id: string | null) => void

  // Widget operations
  addWidget: (widget: Omit<WidgetInsert, 'dashboard_id'>) => void
  removeWidget: (id: string) => void
  updateWidget: (id: string, updates: Partial<WidgetUpdate>) => void
  updateWidgetLayout: (id: string, layout: WidgetLayout) => void
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void

  // Dashboard operations
  loadDashboard: (id: string) => Promise<void>
  saveDashboard: () => Promise<void>
  createDashboard: (dashboard: DashboardInsert) => Promise<Dashboard | null>
  updateDashboardInfo: (id: string, updates: DashboardUpdate) => Promise<void>
  deleteDashboard: (id: string) => Promise<void>
  setDefaultDashboard: (id: string) => Promise<void>

  // Bulk operations
  updateAllLayouts: (layouts: DashboardLayout[]) => void

  // Reset
  reset: () => void
}

// ============================================================================
// WIDGET COMPONENT PROPS
// ============================================================================

export interface BaseWidgetProps {
  widget: WidgetInstance
  isEditMode: boolean
  onConfigure?: () => void
  onDelete?: () => void
  className?: string
}

export interface WidgetWrapperProps {
  title: string
  description?: string
  isEditMode: boolean
  onConfigure?: () => void
  onDelete?: () => void
  children: React.ReactNode
  isLoading?: boolean
  error?: string
  className?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DataFormat = 'currency' | 'number' | 'percentage' | 'date' | 'text'

export interface FormatOptions {
  format: DataFormat
  decimals?: number
  locale?: string
  currency?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface DashboardResponse {
  dashboard: Dashboard
  widgets: WidgetInstance[]
}

export interface DashboardListResponse {
  dashboards: Dashboard[]
}

export interface WidgetTemplatesResponse {
  templates: WidgetTemplate[]
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DashboardError {
  code: string
  message: string
  details?: any
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface DashboardExport {
  version: string
  dashboard: Omit<Dashboard, 'id' | 'farm_id' | 'created_by' | 'created_at' | 'updated_at'>
  widgets: Array<Omit<WidgetInstance, 'id' | 'dashboard_id' | 'created_at' | 'updated_at'>>
  exportedAt: string
}
