/**
 * Dashboard Grid Layout Component
 *
 * Handles drag-and-drop, resize, and positioning of widgets
 * using react-grid-layout
 */

'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { WidgetInstance, DashboardLayout } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface DashboardGridLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardGridLayout({
  children,
  className,
}: DashboardGridLayoutProps) {
  const { currentDashboard, widgets, isEditMode, updateAllLayouts } =
    useDashboardStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Measure container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Convert widgets to react-grid-layout format
  const layouts = useMemo((): Layout[] => {
    return widgets.map((widget) => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: widget.layout.w,
      h: widget.layout.h,
      minW: widget.layout.minW ?? 1,
      minH: widget.layout.minH ?? 1,
      maxW: widget.layout.maxW ?? 12,
      maxH: widget.layout.maxH ?? 100,
      static: !isEditMode,
      isDraggable: isEditMode,
      isResizable: isEditMode,
    }))
  }, [widgets, isEditMode])

  // Handle layout change (drag/resize)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!isEditMode) return
      // Don't update during intermediate changes, only on stop events
    },
    [isEditMode]
  )

  // Handle drag stop
  const handleDragStop = useCallback(
    (newLayout: Layout[]) => {
      if (!isEditMode) return

      const dashboardLayouts: DashboardLayout[] = newLayout.map((layout) => ({
        i: layout.i,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        minW: layout.minW,
        minH: layout.minH,
        maxW: layout.maxW,
        maxH: layout.maxH,
      }))

      updateAllLayouts(dashboardLayouts)
    },
    [isEditMode, updateAllLayouts]
  )

  // Handle resize stop to ensure state updates
  const handleResizeStop = useCallback(
    (newLayout: Layout[], oldItem: Layout, newItem: Layout) => {
      if (!isEditMode) return

      const dashboardLayouts: DashboardLayout[] = newLayout.map((layout) => ({
        i: layout.i,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        minW: layout.minW,
        minH: layout.minH,
        maxW: layout.maxW,
        maxH: layout.maxH,
      }))

      updateAllLayouts(dashboardLayouts)
    },
    [isEditMode, updateAllLayouts]
  )

  const gridCols = currentDashboard?.grid_cols ?? 12
  const gridRowHeight = currentDashboard?.grid_row_height ?? 60

  return (
    <div ref={containerRef} className={cn('dashboard-grid-layout', className)}>
      <GridLayout
        className="layout"
        layout={layouts}
        cols={gridCols}
        rowHeight={gridRowHeight}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType={isEditMode ? null : "vertical"}
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        draggableHandle=".cursor-move"
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        autoSize={true}
        verticalCompact={false}
      >
        {children}
      </GridLayout>

      <style jsx global>{`
        .dashboard-grid-layout {
          width: 100%;
          min-height: 600px;
        }

        .react-grid-layout {
          position: relative;
          transition: height 200ms ease;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
          overflow: visible;
          display: flex !important;
          flex-direction: column;
        }

        .react-grid-item > div:first-child {
          width: 100% !important;
          height: 100% !important;
          box-sizing: border-box;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .react-grid-item img {
          pointer-events: none;
          user-select: none;
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          background-color: transparent;
        }

        /* Corner handles */
        .react-grid-item > .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          cursor: se-resize !important;
        }

        .react-grid-item > .react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          width: 20px;
          height: 20px;
          cursor: sw-resize !important;
        }

        .react-grid-item > .react-resizable-handle-ne {
          top: 0;
          right: 0;
          width: 20px;
          height: 20px;
          cursor: ne-resize !important;
        }

        .react-grid-item > .react-resizable-handle-nw {
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          cursor: nw-resize !important;
        }

        /* Edge handles - larger hit area for easier resizing */
        .react-grid-item > .react-resizable-handle-s {
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          cursor: s-resize !important;
          z-index: 10;
        }

        .react-grid-item > .react-resizable-handle-n {
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          cursor: n-resize !important;
          z-index: 10;
        }

        .react-grid-item > .react-resizable-handle-e {
          right: 0;
          top: 0;
          bottom: 0;
          width: 20px;
          cursor: e-resize !important;
          z-index: 10;
        }

        .react-grid-item > .react-resizable-handle-w {
          left: 0;
          top: 0;
          bottom: 0;
          width: 20px;
          cursor: w-resize !important;
          z-index: 10;
        }

        /* Visual indicator for corner handle */
        .react-grid-item > .react-resizable-handle-se::after {
          content: '';
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid hsl(var(--muted-foreground));
          border-bottom: 2px solid hsl(var(--muted-foreground));
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .react-grid-item:hover > .react-resizable-handle-se::after {
          opacity: 1;
        }

        /* Visual indicators for edge handles on hover - more prominent */
        .react-grid-item:hover > .react-resizable-handle-s {
          background: linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%);
        }

        .react-grid-item:hover > .react-resizable-handle-n {
          background: linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%);
        }

        .react-grid-item:hover > .react-resizable-handle-e {
          background: linear-gradient(to right, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%);
        }

        .react-grid-item:hover > .react-resizable-handle-w {
          background: linear-gradient(to right, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%);
        }

        /* Make corner handles more visible on hover */
        .react-grid-item:hover > .react-resizable-handle-se,
        .react-grid-item:hover > .react-resizable-handle-sw,
        .react-grid-item:hover > .react-resizable-handle-ne,
        .react-grid-item:hover > .react-resizable-handle-nw {
          background: radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%);
        }

        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100;
          opacity: 0.9;
        }

        .react-grid-item.react-resizing {
          transition: none;
          z-index: 100;
        }

        .react-grid-item.react-resizing > div {
          pointer-events: none;
        }

        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.2);
          opacity: 0.4;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 8px;
          border: 2px dashed hsl(var(--primary));
        }

        /* Hide resize handle when not in edit mode */
        .react-grid-item.static > .react-resizable-handle {
          display: none;
        }
      `}</style>
    </div>
  )
}
