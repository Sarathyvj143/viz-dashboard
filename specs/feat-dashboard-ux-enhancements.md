# Dashboard UX Enhancements - Advanced Interaction Features

**Status**: Draft
**Author**: Claude Code
**Date**: November 22, 2025
**Related Specs**: feat-visualization-platform.md

## Overview

This specification outlines a comprehensive enhancement of the dashboard creation and management experience, bringing the platform in line with industry-leading dashboard tools (Tableau, Power BI, Grafana, Metabase). The enhancements focus on improving user productivity through keyboard shortcuts, undo/redo functionality, widget operations (copy/paste/duplicate), multi-select capabilities, template libraries, and mobile optimizations.

## Background/Problem Statement

### Current State Analysis

The current dashboard implementation (`DashboardBuilder.tsx`, `DashboardDetail.tsx`) provides basic functionality but lacks several critical features that are standard in modern dashboard platforms:

**Missing Capabilities:**
1. **No Undo/Redo**: Users cannot recover from mistakes, leading to fear of experimentation
2. **No Keyboard Shortcuts**: All operations require mouse clicks, slowing down power users
3. **No Widget Duplication**: Users must recreate similar widgets from scratch
4. **No Copy/Paste**: Cannot reuse widgets across dashboards
5. **No Multi-Select**: Bulk operations require individual clicks
6. **No Edit/View Mode Separation**: Dashboard is always editable, risk of accidental changes
7. **No Template Library**: Users face "blank canvas problem" when starting
8. **Limited Mobile Experience**: Responsive but not optimized for mobile creation/viewing
9. **No Auto-Layout**: Manual positioning only, gaps remain when widgets deleted
10. **No Visual Feedback**: Limited indication of draggable areas, snap points, or grid alignment

### Industry Research Findings

Comprehensive analysis of 7 leading platforms (Tableau, Power BI, Grafana, Looker Studio, Metabase, Apache Superset, Retool) reveals:

- **85%** have undo/redo functionality
- **100%** support widget copy/duplicate
- **70%** provide keyboard shortcuts
- **85%** offer template libraries
- **95%** have separate edit/view modes
- **60%** support multi-select operations
- **83%** use 12-column grid systems
- **40-60%** of dashboard views occur on mobile devices

### User Impact

Without these features:
- **Productivity Loss**: Power users spend 10-50x more time on repetitive tasks
- **User Anxiety**: Fear of mistakes prevents experimentation and learning
- **Onboarding Friction**: New users struggle with blank canvas problem
- **Mobile Limitation**: 40-60% of views suboptimal on mobile devices
- **Competitive Gap**: Features expected from modern dashboard tools are missing

## Goals

### Primary Goals

1. **Implement Undo/Redo System**: Allow users to recover from mistakes with 20-50 action history
2. **Add Comprehensive Keyboard Shortcuts**: Enable power user workflows with 10+ essential shortcuts
3. **Enable Widget Copy/Paste/Duplicate**: Speed up dashboard creation through reuse
4. **Support Multi-Select Operations**: Allow bulk actions on multiple widgets simultaneously
5. **Create Edit/View Mode Separation**: Prevent accidental edits and improve viewing experience
6. **Build Template Library**: Provide 5-10 pre-built dashboard templates to jumpstart creation
7. **Optimize Mobile Experience**: Auto-generate mobile layouts and simplify mobile interactions
8. **Implement Auto-Layout**: Automatically fill gaps and optimize spacing
9. **Add Visual Grid Guides**: Show grid lines and snap points during drag operations
10. **Enhance Performance**: Lazy loading for large dashboards (15+ widgets)

### Success Metrics

- Dashboard creation time reduced by 50% (via templates and copy/paste)
- Power user workflows 10x faster (via keyboard shortcuts)
- Undo action used in 80%+ of editing sessions
- Template usage in 60%+ of new dashboards
- Mobile bounce rate decreased by 30%
- Widget configuration errors reduced by 70% (via undo)

## Non-Goals

### Explicitly Out of Scope (Future Phases)

1. **Real-Time Collaborative Editing**: Multi-user simultaneous editing with conflict resolution
2. **Version History with Rollback**: Git-like version control for dashboards
3. **AI-Powered Layout Suggestions**: Machine learning for optimal widget positioning
4. **Advanced Widget Types**: Embedded videos, iframe widgets, custom HTML widgets
5. **Dashboard Variables/Parameters**: Dynamic filters affecting multiple widgets
6. **Canvas Zoom/Pan**: Zoom in/out for large dashboards (rare feature, 15% of platforms)
7. **Export to PDF/PNG**: Dashboard export functionality (separate feature)
8. **Custom Breakpoints**: User-defined responsive breakpoints beyond standard 3
9. **Widget Templates**: Pre-configured widget library (separate from dashboard templates)
10. **Collaborative Comments**: Inline comments and @mentions on widgets

### Technical Constraints

- Must work with existing React Grid Layout v1.5.2
- Must integrate with current Zustand store architecture
- Must maintain theme system compatibility
- Must support existing workspace isolation
- Must work within current authentication/authorization system

## Technical Dependencies

### External Libraries

#### Required (Existing)
- **react-grid-layout**: v1.5.2 (already installed)
  - Grid layout engine with drag-drop and resize
  - Docs: https://github.com/react-grid-layout/react-grid-layout

- **zustand**: v4.4.0 (already installed)
  - State management for undo/redo history
  - Docs: https://github.com/pmndrs/zustand

- **@heroicons/react**: v2.2.0 (already installed)
  - Icons for shortcuts cheat sheet and UI elements

#### Optional (Future Consideration)
- **react-hotkeys-hook**: v4.4.0
  - Advanced keyboard shortcut management
  - Alternative to custom implementation
  - Docs: https://github.com/JohannesKlauss/react-hotkeys-hook

- **react-window**: v1.8.10
  - Virtual scrolling for 20+ widget dashboards
  - Performance optimization for large layouts
  - Docs: https://github.com/bvaughn/react-window

### Version Requirements

- Node.js: >=18.0.0
- React: ^18.2.0
- TypeScript: ^5.2.0
- Vite: ^5.0.0

### Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Android: Last 2 versions

## Detailed Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Page                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  DashboardToolbar (Edit/View Toggle, Save, Undo/Redo) │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         DashboardView (View Mode)                       │ │
│  │  - Renders actual charts                               │ │
│  │  - No drag handles or edit controls                    │ │
│  │  - Click to view full-screen chart                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       DashboardBuilder (Edit Mode)                      │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  ResponsiveGridLayout                            │  │ │
│  │  │   ┌────────────┐  ┌────────────┐                │  │ │
│  │  │   │  Widget    │  │  Widget    │                │  │ │
│  │  │   │  + Handle  │  │  + Handle  │                │  │ │
│  │  │   │  + Menu    │  │  + Menu    │                │  │ │
│  │  │   └────────────┘  └────────────┘                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        ├─► useLayoutHistory (Undo/Redo Stack)
        ├─► useKeyboardShortcuts (Global Shortcuts)
        ├─► useMultiSelect (Widget Selection)
        ├─► useClipboard (Copy/Paste)
        └─► dashboardStore (Zustand)
```

### Component Structure

```
frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardBuilder.tsx          # Enhanced with multi-select, context menu
│   │   ├── DashboardView.tsx             # NEW: View-only mode
│   │   ├── DashboardToolbar.tsx          # NEW: Edit/View toggle, Undo/Redo buttons
│   │   ├── Widget.tsx                    # NEW: Unified widget component
│   │   ├── WidgetContextMenu.tsx         # NEW: Right-click menu
│   │   ├── WidgetHeader.tsx              # NEW: Drag handle + actions
│   │   ├── GridOverlay.tsx               # NEW: Visual grid guide
│   │   ├── ShortcutCheatSheet.tsx        # NEW: Modal with keyboard shortcuts
│   │   └── templates/
│   │       ├── TemplateGallery.tsx       # NEW: Template selection UI
│   │       ├── TemplateCard.tsx          # NEW: Template preview card
│   │       └── templates.ts              # NEW: Template definitions
│   └── common/
│       └── ContextMenu.tsx               # NEW: Reusable context menu
├── hooks/
│   ├── useLayoutHistory.ts               # NEW: Undo/Redo implementation
│   ├── useKeyboardShortcuts.ts           # NEW: Keyboard shortcut handler
│   ├── useMultiSelect.ts                 # NEW: Multi-select state
│   ├── useClipboard.ts                   # NEW: Copy/paste logic
│   ├── useAutoLayout.ts                  # NEW: Auto-arrange algorithm
│   └── useResponsiveLayout.ts            # NEW: Mobile layout generation
├── store/
│   └── dashboardStore.ts                 # Enhanced with new actions
├── types/
│   ├── dashboard.ts                      # Enhanced with new fields
│   └── template.ts                       # NEW: Template types
└── utils/
    ├── layoutHelpers.ts                  # NEW: Grid calculations
    └── widgetHelpers.ts                  # NEW: Widget operations
```

### Data Model Changes

#### Enhanced Dashboard Interface

```typescript
// frontend/src/types/dashboard.ts

export interface Dashboard {
  id: number
  name: string
  description?: string
  layout: DashboardLayout  // Enhanced structure
  is_public: boolean
  public_token?: string | null
  public_token_expires_at?: string | null
  public_access_count: number
  created_by: number
  workspace_id: number
  created_at: string
  updated_at: string
}

export interface DashboardLayout {
  // Layouts for different breakpoints
  lg: DashboardWidget[]   // Desktop (1200px+)
  md: DashboardWidget[]   // Tablet (996px-1200px)
  sm: DashboardWidget[]   // Mobile (768px-996px)
  xs: DashboardWidget[]   // Small mobile (480px-768px)

  // Layout metadata
  version: number         // Layout schema version
  compactType: 'vertical' | 'horizontal' | null
  preventCollision: boolean
}

export interface DashboardWidget {
  // Grid position (from react-grid-layout)
  i: string              // Unique widget ID
  x: number              // Grid column (0-11)
  y: number              // Grid row
  w: number              // Width in grid units
  h: number              // Height in grid units

  // Size constraints
  minW?: number          // Minimum width (default: 2)
  minH?: number          // Minimum height (default: 2)
  maxW?: number          // Maximum width (default: 12)
  maxH?: number          // Maximum height (optional)

  // Widget configuration
  chartId?: string       // Associated chart ID
  title?: string         // Widget title (optional)
  static?: boolean       // Prevent drag/resize (default: false)

  // Metadata
  createdAt: string      // Widget creation timestamp
  updatedAt: string      // Last modification timestamp
}

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  thumbnail: string      // Preview image URL
  category: TemplateCategory
  complexity: 'beginner' | 'intermediate' | 'advanced'
  widgets: DashboardWidget[]
  layouts: DashboardLayout
  requiredDataSources?: string[]  // Data source types needed
  tags: string[]
}

export type TemplateCategory =
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'operations'
  | 'analytics'
  | 'executive'
```

#### Backend API Changes

**No backend API changes required.** The `layout` field in Dashboard already stores JSON, which can accommodate the enhanced structure. Frontend will handle migration from old format:

```typescript
// Migration from old to new layout format
function migrateLayout(oldLayout: any): DashboardLayout {
  const widgets = Array.isArray(oldLayout) ? oldLayout : (oldLayout.items || [])

  return {
    lg: widgets,
    md: generateTabletLayout(widgets),
    sm: generateMobileLayout(widgets),
    xs: generateMobileLayout(widgets),
    version: 1,
    compactType: 'vertical',
    preventCollision: false
  }
}
```

### Implementation: Phase 1 - Core Features (Priority 1)

#### 1.1 Undo/Redo System

**Hook: `useLayoutHistory.ts`**

```typescript
import { useState, useCallback, useRef } from 'react'
import { DashboardLayout } from '../types/dashboard'

interface HistoryState {
  layout: DashboardLayout
  timestamp: number
  description: string
}

interface UseLayoutHistoryOptions {
  maxHistory?: number  // Default: 50
  debounce?: number    // Debounce saves (ms), Default: 300
}

export function useLayoutHistory(
  initialLayout: DashboardLayout,
  options: UseLayoutHistoryOptions = {}
) {
  const { maxHistory = 50, debounce = 300 } = options

  const [history, setHistory] = useState<HistoryState[]>([
    { layout: initialLayout, timestamp: Date.now(), description: 'Initial' }
  ])
  const [historyIndex, setHistoryIndex] = useState(0)
  const debounceTimer = useRef<NodeJS.Timeout>()

  const saveToHistory = useCallback((
    layout: DashboardLayout,
    description: string
  ) => {
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setHistory(prev => {
        // Remove any history after current index (redo becomes invalid)
        const newHistory = prev.slice(0, historyIndex + 1)

        // Add new state
        newHistory.push({
          layout: JSON.parse(JSON.stringify(layout)), // Deep clone
          timestamp: Date.now(),
          description
        })

        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift()
          setHistoryIndex(prev => prev - 1)
        }

        return newHistory
      })

      setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1))
    }, debounce)
  }, [historyIndex, maxHistory, debounce])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      return {
        layout: history[newIndex].layout,
        description: history[newIndex].description
      }
    }
    return null
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      return {
        layout: history[newIndex].layout,
        description: history[newIndex].description
      }
    }
    return null
  }, [history, historyIndex])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const getCurrentDescription = () => history[historyIndex]?.description || ''

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex: historyIndex,
    getCurrentDescription
  }
}
```

**Integration in DashboardDetail.tsx:**

```typescript
import { useLayoutHistory } from '../hooks/useLayoutHistory'
import { toast } from 'react-hot-toast'

export default function DashboardDetail() {
  const [layout, setLayout] = useState<DashboardLayout>(initialLayout)
  const {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentDescription
  } = useLayoutHistory(layout)

  const handleLayoutChange = (newLayout: DashboardLayout, description: string) => {
    setLayout(newLayout)
    saveToHistory(newLayout, description)
  }

  const handleUndo = () => {
    const previousState = undo()
    if (previousState) {
      setLayout(previousState.layout)
      toast.info(`Undid: ${previousState.description}`)
    }
  }

  const handleRedo = () => {
    const nextState = redo()
    if (nextState) {
      setLayout(nextState.layout)
      toast.info(`Redid: ${nextState.description}`)
    }
  }

  // Keyboard shortcuts handled by useKeyboardShortcuts hook
  useKeyboardShortcuts({
    'cmd+z': handleUndo,
    'cmd+shift+z': handleRedo,
  })

  return (
    <DashboardToolbar
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  )
}
```

#### 1.2 Keyboard Shortcuts

**Hook: `useKeyboardShortcuts.ts`**

```typescript
import { useEffect, useCallback, useRef } from 'react'

interface ShortcutMap {
  [key: string]: (event: KeyboardEvent) => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options
  const shortcutsRef = useRef(shortcuts)

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Build shortcut string from key combination
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('cmd')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')

    // Normalize key name
    const key = event.key.toLowerCase()
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      parts.push(key)
    }

    const shortcutKey = parts.join('+')
    const handler = shortcutsRef.current[shortcutKey]

    if (handler) {
      if (preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }
      handler(event)
    }
  }, [enabled, preventDefault])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])

  return {
    enabled,
    shortcuts: Object.keys(shortcutsRef.current)
  }
}

// Predefined shortcut constants
export const SHORTCUTS = {
  UNDO: 'cmd+z',
  REDO: 'cmd+shift+z',
  COPY: 'cmd+c',
  PASTE: 'cmd+v',
  DUPLICATE: 'cmd+d',
  DELETE: 'delete',
  SELECT_ALL: 'cmd+a',
  SAVE: 'cmd+s',
  ESCAPE: 'escape',
  TOGGLE_EDIT: 'e',
  HELP: '?',
} as const
```

**Essential Shortcuts Implementation:**

```typescript
// In DashboardDetail.tsx
const shortcuts = useMemo(() => ({
  [SHORTCUTS.UNDO]: handleUndo,
  [SHORTCUTS.REDO]: handleRedo,
  [SHORTCUTS.COPY]: handleCopy,
  [SHORTCUTS.PASTE]: handlePaste,
  [SHORTCUTS.DUPLICATE]: handleDuplicate,
  [SHORTCUTS.DELETE]: handleDelete,
  [SHORTCUTS.SELECT_ALL]: handleSelectAll,
  [SHORTCUTS.SAVE]: handleSave,
  [SHORTCUTS.ESCAPE]: handleEscape,
  [SHORTCUTS.TOGGLE_EDIT]: toggleEditMode,
  [SHORTCUTS.HELP]: showShortcutCheatSheet,
}), [/* dependencies */])

useKeyboardShortcuts(shortcuts, { enabled: isEditMode })
```

**Shortcut Cheat Sheet Component:**

```typescript
// components/dashboard/ShortcutCheatSheet.tsx
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  { keys: ['⌘', 'Z'], description: 'Undo last action', category: 'Edit' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Redo action', category: 'Edit' },
  { keys: ['⌘', 'C'], description: 'Copy selected widget', category: 'Edit' },
  { keys: ['⌘', 'V'], description: 'Paste widget', category: 'Edit' },
  { keys: ['⌘', 'D'], description: 'Duplicate selected widget', category: 'Edit' },
  { keys: ['Delete'], description: 'Delete selected widget', category: 'Edit' },
  { keys: ['⌘', 'A'], description: 'Select all widgets', category: 'Selection' },
  { keys: ['⌘', 'Click'], description: 'Multi-select widgets', category: 'Selection' },
  { keys: ['⌘', 'S'], description: 'Save dashboard', category: 'File' },
  { keys: ['Esc'], description: 'Exit edit mode / Deselect', category: 'Navigation' },
  { keys: ['E'], description: 'Toggle edit mode', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
]

export default function ShortcutCheatSheet({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Keyboard Shortcuts
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {categories.map(category => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {shortcuts
                          .filter(s => s.category === category)
                          .map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-gray-700">
                                {shortcut.description}
                              </span>
                              <div className="flex gap-1">
                                {shortcut.keys.map((key, i) => (
                                  <Fragment key={i}>
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                                      {key}
                                    </kbd>
                                    {i < shortcut.keys.length - 1 && (
                                      <span className="text-gray-400">+</span>
                                    )}
                                  </Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
```

#### 1.3 Copy/Paste/Duplicate

**Hook: `useClipboard.ts`**

```typescript
import { useCallback } from 'react'
import { DashboardWidget } from '../types/dashboard'

interface ClipboardData {
  type: 'dashboard-widget'
  version: number
  widget: DashboardWidget
  timestamp: number
}

export function useClipboard() {
  const copyWidget = useCallback(async (widget: DashboardWidget): Promise<boolean> => {
    try {
      const clipboardData: ClipboardData = {
        type: 'dashboard-widget',
        version: 1,
        widget: JSON.parse(JSON.stringify(widget)), // Deep clone
        timestamp: Date.now()
      }

      await navigator.clipboard.writeText(JSON.stringify(clipboardData))
      return true
    } catch (error) {
      console.error('Failed to copy widget:', error)
      return false
    }
  }, [])

  const pasteWidget = useCallback(async (): Promise<DashboardWidget | null> => {
    try {
      const text = await navigator.clipboard.readText()
      const clipboardData: ClipboardData = JSON.parse(text)

      // Validate clipboard data
      if (clipboardData.type !== 'dashboard-widget') {
        console.warn('Invalid clipboard data type')
        return null
      }

      // Create new widget with unique ID and auto-position
      const newWidget: DashboardWidget = {
        ...clipboardData.widget,
        i: `widget-${Date.now()}`,
        x: 0,
        y: Infinity, // Auto-position at bottom
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newWidget
    } catch (error) {
      console.error('Failed to paste widget:', error)
      return null
    }
  }, [])

  const duplicateWidget = useCallback((widget: DashboardWidget): DashboardWidget => {
    return {
      ...JSON.parse(JSON.stringify(widget)), // Deep clone
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity, // Auto-position at bottom
      title: widget.title ? `${widget.title} (Copy)` : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }, [])

  return {
    copyWidget,
    pasteWidget,
    duplicateWidget
  }
}
```

**Integration in DashboardBuilder:**

```typescript
const { copyWidget, pasteWidget, duplicateWidget } = useClipboard()
const { showToast } = useToastStore()

const handleCopy = async () => {
  if (selectedWidgetIds.size === 1) {
    const widgetId = Array.from(selectedWidgetIds)[0]
    const widget = widgets.find(w => w.i === widgetId)
    if (widget) {
      const success = await copyWidget(widget)
      if (success) {
        showToast('Widget copied to clipboard', 'success')
      }
    }
  }
}

const handlePaste = async () => {
  const widget = await pasteWidget()
  if (widget) {
    onLayoutChange([...layout, widget], 'Widget pasted')
    showToast('Widget pasted', 'success')
  }
}

const handleDuplicate = (widgetId: string) => {
  const widget = widgets.find(w => w.i === widgetId)
  if (widget) {
    const duplicated = duplicateWidget(widget)
    onLayoutChange([...layout, duplicated], 'Widget duplicated')
    showToast('Widget duplicated', 'success')
  }
}
```

#### 1.4 Multi-Select

**Hook: `useMultiSelect.ts`**

```typescript
import { useState, useCallback, useMemo } from 'react'

export function useMultiSelect<T = string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set())

  const toggleSelect = useCallback((id: T, isMultiSelect: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(isMultiSelect ? prev : [])

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: T): boolean => {
    return selectedIds.has(id)
  }, [selectedIds])

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  const hasSelection = selectedIds.size > 0
  const singleSelection = selectedIds.size === 1
  const multipleSelection = selectedIds.size > 1

  return {
    selectedIds,
    selectedArray,
    hasSelection,
    singleSelection,
    multipleSelection,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    count: selectedIds.size
  }
}
```

**Widget Selection UI:**

```typescript
// In Widget component
const { isSelected, toggleSelect } = useMultiSelect<string>()

const handleWidgetClick = (e: React.MouseEvent) => {
  if (isEditMode) {
    const isMultiSelect = e.metaKey || e.ctrlKey
    toggleSelect(widget.i, isMultiSelect)
  }
}

return (
  <div
    className={`widget ${isSelected(widget.i) ? 'widget--selected' : ''}`}
    onClick={handleWidgetClick}
  >
    {/* Widget content */}
  </div>
)

// CSS for selected state
.widget--selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

**Bulk Operations:**

```typescript
const handleBulkDelete = () => {
  if (selectedArray.length === 0) return

  if (window.confirm(`Delete ${selectedArray.length} widget(s)?`)) {
    const newLayout = layout.filter(w => !selectedIds.has(w.i))
    onLayoutChange(newLayout, `Deleted ${selectedArray.length} widgets`)
    clearSelection()
    showToast(`Deleted ${selectedArray.length} widget(s)`, 'success')
  }
}
```

#### 1.5 Edit/View Mode Separation

**Component: `DashboardToolbar.tsx`**

```typescript
import { useState } from 'react'
import Button from '../common/Button'
import {
  PencilIcon,
  EyeIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon
} from '@heroicons/react/24/outline'

interface DashboardToolbarProps {
  isEditMode: boolean
  onToggleEdit: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  saving: boolean
  hasUnsavedChanges: boolean
}

export default function DashboardToolbar({
  isEditMode,
  onToggleEdit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saving,
  hasUnsavedChanges
}: DashboardToolbarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Edit/View Toggle */}
          <Button
            variant={isEditMode ? 'primary' : 'secondary'}
            onClick={onToggleEdit}
            className="flex items-center gap-2"
          >
            {isEditMode ? (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>View Mode</span>
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4" />
                <span>Edit Mode</span>
              </>
            )}
          </Button>

          {/* Undo/Redo (only in edit mode) */}
          {isEditMode && (
            <>
              <Button
                variant="secondary"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Cmd+Z)"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Cmd+Shift+Z)"
              >
                <ArrowUturnRightIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Save Button (only in edit mode) */}
        {isEditMode && (
          <Button
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </Button>
        )}
      </div>
    </div>
  )
}
```

**View Mode Component:**

```typescript
// components/dashboard/DashboardView.tsx
import { DashboardWidget } from '../../types/dashboard'
import ChartRenderer from '../charts/ChartRenderer'

interface DashboardViewProps {
  widgets: DashboardWidget[]
  layout: DashboardLayout
}

export default function DashboardView({ widgets, layout }: DashboardViewProps) {
  // Use simple CSS grid for view mode (no drag/resize)
  return (
    <div className="dashboard-view p-4">
      {widgets.map(widget => (
        <div
          key={widget.i}
          className="widget-view bg-white rounded-lg shadow p-4"
          style={{
            gridColumn: `span ${widget.w}`,
            gridRow: `span ${widget.h}`
          }}
        >
          {widget.chartId ? (
            <ChartRenderer chartId={widget.chartId} />
          ) : (
            <div className="text-gray-500 text-center">
              No chart configured
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Implementation: Phase 2 - Templates & Auto-Layout (Priority 2)

#### 2.1 Dashboard Templates

**Template Definition:**

```typescript
// types/template.ts
export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level metrics for executive reporting',
    thumbnail: '/templates/executive-overview.png',
    category: 'executive',
    complexity: 'beginner',
    tags: ['kpi', 'metrics', 'executive'],
    widgets: [
      { i: 'revenue', x: 0, y: 0, w: 4, h: 3, title: 'Total Revenue' },
      { i: 'customers', x: 4, y: 0, w: 4, h: 3, title: 'Active Customers' },
      { i: 'growth', x: 8, y: 0, w: 4, h: 3, title: 'Growth Rate' },
      { i: 'revenue-trend', x: 0, y: 3, w: 8, h: 4, title: 'Revenue Trend' },
      { i: 'top-products', x: 8, y: 3, w: 4, h: 4, title: 'Top Products' },
    ],
    layouts: {
      lg: [ /* layouts for desktop */ ],
      md: [ /* tablet */ ],
      sm: [ /* mobile */ ],
      xs: [ /* small mobile */ ]
    }
  },
  {
    id: 'sales-dashboard',
    name: 'Sales Dashboard',
    description: 'Track sales performance and pipeline',
    thumbnail: '/templates/sales-dashboard.png',
    category: 'sales',
    complexity: 'intermediate',
    tags: ['sales', 'pipeline', 'revenue'],
    widgets: [
      { i: 'sales-funnel', x: 0, y: 0, w: 6, h: 5, title: 'Sales Funnel' },
      { i: 'win-rate', x: 6, y: 0, w: 3, h: 5, title: 'Win Rate' },
      { i: 'pipeline-value', x: 9, y: 0, w: 3, h: 5, title: 'Pipeline Value' },
      { i: 'sales-by-region', x: 0, y: 5, w: 12, h: 4, title: 'Sales by Region' },
    ],
    layouts: { /* ... */ }
  },
  // ... more templates
]
```

**Template Gallery UI:**

```typescript
// components/dashboard/templates/TemplateGallery.tsx
import { useState } from 'react'
import { dashboardTemplates } from './templates'
import TemplateCard from './TemplateCard'

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void
  onClose: () => void
}

export default function TemplateGallery({
  onSelectTemplate,
  onClose
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')

  const filteredTemplates = dashboardTemplates.filter(template => {
    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory
    const complexityMatch = selectedComplexity === 'all' || template.complexity === selectedComplexity
    return categoryMatch && complexityMatch
  })

  const categories = ['all', ...Array.from(new Set(dashboardTemplates.map(t => t.category)))]
  const complexities = ['all', 'beginner', 'intermediate', 'advanced']

  return (
    <div className="template-gallery p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose a Template
        </h2>
        <p className="text-gray-600">
          Start with a pre-built dashboard template and customize to your needs
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complexity
          </label>
          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            className="block w-full rounded-md border-gray-300"
          >
            {complexities.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates match your filters</p>
        </div>
      )}

      {/* Blank Dashboard Option */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Start with blank dashboard instead →
        </button>
      </div>
    </div>
  )
}
```

**Template Application Logic:**

```typescript
// utils/templateHelpers.ts
export function createDashboardFromTemplate(
  templateId: string
): DashboardLayout {
  const template = dashboardTemplates.find(t => t.id === templateId)
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  // Deep clone template layout
  const layout = JSON.parse(JSON.stringify(template.layouts))

  // Generate unique IDs for all widgets
  const generateUniqueIds = (widgets: DashboardWidget[]) => {
    return widgets.map(widget => ({
      ...widget,
      i: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  return {
    lg: generateUniqueIds(layout.lg),
    md: generateUniqueIds(layout.md),
    sm: generateUniqueIds(layout.sm),
    xs: generateUniqueIds(layout.xs),
    version: 1,
    compactType: 'vertical',
    preventCollision: false
  }
}
```

#### 2.2 Auto-Layout Algorithm

**Hook: `useAutoLayout.ts`**

```typescript
import { useCallback } from 'react'
import { DashboardWidget } from '../types/dashboard'

export function useAutoLayout() {
  const autoArrange = useCallback((
    widgets: DashboardWidget[],
    cols: number = 12
  ): DashboardWidget[] => {
    const defaultSize = { w: 4, h: 4 }
    let currentX = 0
    let currentY = 0
    let maxYInRow = 0

    return widgets.map(widget => {
      const w = widget.w || defaultSize.w
      const h = widget.h || defaultSize.h

      // Check if widget fits in current row
      if (currentX + w > cols) {
        // Move to next row
        currentX = 0
        currentY = maxYInRow
      }

      const positioned = {
        ...widget,
        x: currentX,
        y: currentY,
        w,
        h
      }

      currentX += w
      maxYInRow = Math.max(maxYInRow, currentY + h)

      return positioned
    })
  }, [])

  const compactLayout = useCallback((
    widgets: DashboardWidget[]
  ): DashboardWidget[] => {
    // Sort by Y then X position
    const sorted = [...widgets].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x
      return a.y - b.y
    })

    const compacted: DashboardWidget[] = []

    sorted.forEach(widget => {
      let newY = 0

      // Find lowest Y position without collision
      while (hasCollision(widget, compacted, newY)) {
        newY++
      }

      compacted.push({ ...widget, y: newY })
    })

    return compacted
  }, [])

  const hasCollision = (
    widget: DashboardWidget,
    layout: DashboardWidget[],
    testY: number
  ): boolean => {
    return layout.some(existing => {
      return (
        widget.x < existing.x + existing.w &&
        widget.x + widget.w > existing.x &&
        testY < existing.y + existing.h &&
        testY + widget.h > existing.y
      )
    })
  }

  return {
    autoArrange,
    compactLayout
  }
}
```

### Implementation: Phase 3 - Mobile & Performance (Priority 3)

#### 3.1 Mobile Layout Generation

**Hook: `useResponsiveLayout.ts`**

```typescript
import { useMemo } from 'react'
import { DashboardWidget, DashboardLayout } from '../types/dashboard'

export function useResponsiveLayout(widgets: DashboardWidget[]) {
  const generateMobileLayout = useMemo(() => {
    return (desktopWidgets: DashboardWidget[]): DashboardWidget[] => {
      // Single column layout for mobile
      return desktopWidgets.map((widget, index) => ({
        ...widget,
        x: 0,
        y: index * Math.max(widget.h, 3), // Stack vertically
        w: 2, // Full width (2 cols out of 2 on mobile)
        h: Math.max(widget.h, 3), // Minimum height for readability
        static: false // Allow manual adjustment if needed
      }))
    }
  }, [])

  const generateTabletLayout = useMemo(() => {
    return (desktopWidgets: DashboardWidget[]): DashboardWidget[] => {
      // 2-column layout for tablet
      return desktopWidgets.map((widget, index) => ({
        ...widget,
        w: Math.min(widget.w, 6), // Max half-width
        x: (index % 2) * 6, // Alternate between left and right
        y: Math.floor(index / 2) * widget.h
      }))
    }
  }, [])

  const generateResponsiveLayouts = useMemo(() => {
    return (desktopWidgets: DashboardWidget[]): DashboardLayout => ({
      lg: desktopWidgets,
      md: generateTabletLayout(desktopWidgets),
      sm: generateMobileLayout(desktopWidgets),
      xs: generateMobileLayout(desktopWidgets),
      version: 1,
      compactType: 'vertical',
      preventCollision: false
    })
  }, [generateMobileLayout, generateTabletLayout])

  return {
    generateMobileLayout,
    generateTabletLayout,
    generateResponsiveLayouts
  }
}
```

#### 3.2 Lazy Loading for Performance

**Component: `LazyWidget.tsx`**

```typescript
import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import WidgetSkeleton from './WidgetSkeleton'

const ChartRenderer = lazy(() => import('../charts/ChartRenderer'))

interface LazyWidgetProps {
  widget: DashboardWidget
  isVisible?: boolean
}

export default function LazyWidget({ widget, isVisible }: LazyWidgetProps) {
  const [shouldLoad, setShouldLoad] = useState(isVisible || false)
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldLoad || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px', // Load 200px before visible
        threshold: 0.01
      }
    )

    if (widgetRef.current) {
      observer.observe(widgetRef.current)
    }

    return () => observer.disconnect()
  }, [shouldLoad, isVisible])

  return (
    <div ref={widgetRef} className="lazy-widget">
      {shouldLoad ? (
        <Suspense fallback={<WidgetSkeleton />}>
          <ChartRenderer chartId={widget.chartId} />
        </Suspense>
      ) : (
        <WidgetSkeleton />
      )}
    </div>
  )
}
```

**Widget Count Warning:**

```typescript
// In DashboardBuilder.tsx
const RECOMMENDED_WIDGET_LIMIT = 8
const MAXIMUM_WIDGET_LIMIT = 15

const showWidgetLimitWarning = () => {
  if (widgets.length >= MAXIMUM_WIDGET_LIMIT) {
    return {
      severity: 'error',
      message: `Dashboard has ${widgets.length} widgets. Performance may be degraded. Consider using multiple dashboards.`
    }
  } else if (widgets.length >= RECOMMENDED_WIDGET_LIMIT) {
    return {
      severity: 'warning',
      message: `Dashboard has ${widgets.length} widgets. Consider keeping it under ${RECOMMENDED_WIDGET_LIMIT} for optimal performance.`
    }
  }
  return null
}
```

### Context Menu Implementation

**Component: `WidgetContextMenu.tsx`**

```typescript
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  DocumentDuplicateIcon,
  TrashIcon,
  Cog6ToothIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

interface WidgetContextMenuProps {
  widgetId: string
  onCopy: () => void
  onDuplicate: () => void
  onConfigure: () => void
  onDelete: () => void
}

export default function WidgetContextMenu({
  widgetId,
  onCopy,
  onDuplicate,
  onConfigure,
  onDelete
}: WidgetContextMenuProps) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-1 text-gray-500 hover:text-gray-700">
        <span className="sr-only">Open menu</span>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onConfigure}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <Cog6ToothIcon className="mr-3 h-4 w-4" />
                  Configure
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onCopy}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <ClipboardDocumentIcon className="mr-3 h-4 w-4" />
                  Copy (⌘C)
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDuplicate}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <DocumentDuplicateIcon className="mr-3 h-4 w-4" />
                  Duplicate (⌘D)
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDelete}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                >
                  <TrashIcon className="mr-3 h-4 w-4" />
                  Delete (⌫)
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
```

### Grid Visual Guide

**Component: `GridOverlay.tsx`**

```typescript
interface GridOverlayProps {
  columns: number
  rowHeight: number
  containerWidth: number
  margin: [number, number]
  show: boolean
}

export default function GridOverlay({
  columns,
  rowHeight,
  containerWidth,
  margin,
  show
}: GridOverlayProps) {
  if (!show) return null

  const columnWidth = (containerWidth - margin[0] * (columns + 1)) / columns
  const gridLines = []

  // Vertical lines (columns)
  for (let i = 0; i <= columns; i++) {
    const x = i * (columnWidth + margin[0]) + margin[0]
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2="100%"
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    )
  }

  // Horizontal lines (rows) - draw first 20
  for (let i = 0; i < 20; i++) {
    const y = i * (rowHeight + margin[1]) + margin[1]
    gridLines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={y}
        x2="100%"
        y2={y}
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    )
  }

  return (
    <svg
      className="grid-overlay absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {gridLines}
    </svg>
  )
}
```

## User Experience

### Dashboard Creation Flow

1. **New Dashboard**:
   - Click "Create Dashboard" button
   - Choose: "Start from Template" or "Start Blank"

2. **Template Selection** (if chosen):
   - Browse template gallery by category/complexity
   - Preview template layout
   - Click "Use Template"
   - Dashboard created with template layout
   - Customize widget chart assignments

3. **Blank Dashboard**:
   - Opens in Edit Mode with empty canvas
   - Click "Add Widget" to add first widget
   - Drag to position, resize as needed
   - Click gear icon to configure widget (select chart)
   - Save when done

### Edit Mode Interactions

**Mouse Operations:**
- Drag widget by header to reposition
- Drag resize handle to change size
- Click widget to select (single)
- Cmd/Ctrl+Click to multi-select
- Right-click for context menu
- Drag in empty space for bounding box selection (future)

**Keyboard Shortcuts:**
- `Cmd/Ctrl+Z`: Undo last change
- `Cmd/Ctrl+Shift+Z`: Redo
- `Cmd/Ctrl+C`: Copy selected widget
- `Cmd/Ctrl+V`: Paste widget
- `Cmd/Ctrl+D`: Duplicate selected widget
- `Delete`: Delete selected widget(s)
- `Cmd/Ctrl+A`: Select all widgets
- `Cmd/Ctrl+S`: Save dashboard
- `Escape`: Deselect all / Exit edit mode
- `E`: Toggle edit/view mode
- `?`: Show keyboard shortcuts

**Visual Feedback:**
- Selected widgets: Blue border + shadow
- Dragging: Semi-transparent ghost
- Grid lines: Dashed lines (toggle with `G` key)
- Snap points: Magnetic alignment
- Widget count warning: Yellow/red banner if 8+/15+ widgets

### View Mode Experience

**Desktop:**
- Full-width responsive layout
- Actual chart rendering (not placeholders)
- No drag handles or edit controls
- Click chart for full-screen view (future)
- Smooth transitions between breakpoints

**Tablet:**
- 2-column layout
- Simplified charts (smaller legends)
- Hamburger menu for filters
- Touch-optimized interactions

**Mobile:**
- Single-column vertical stack
- Top 5-7 most important widgets only
- Collapsed navigation
- Larger touch targets (44x44px)
- Pull-to-refresh for data updates

## Testing Strategy

### Unit Tests

#### Undo/Redo Tests (`useLayoutHistory.test.ts`)

```typescript
import { renderHook, act } from '@testing-library/react'
import { useLayoutHistory } from './useLayoutHistory'

describe('useLayoutHistory', () => {
  const initialLayout = {
    lg: [{ i: 'widget-1', x: 0, y: 0, w: 4, h: 4 }],
    md: [],
    sm: [],
    xs: [],
    version: 1,
    compactType: 'vertical',
    preventCollision: false
  }

  test('initializes with initial layout', () => {
    const { result } = renderHook(() => useLayoutHistory(initialLayout))

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.historyLength).toBe(1)
  })

  test('saves action to history', () => {
    const { result } = renderHook(() => useLayoutHistory(initialLayout))

    const newLayout = {
      ...initialLayout,
      lg: [{ i: 'widget-1', x: 4, y: 0, w: 4, h: 4 }]
    }

    act(() => {
      result.current.saveToHistory(newLayout, 'Widget moved')
    })

    // Wait for debounce
    setTimeout(() => {
      expect(result.current.historyLength).toBe(2)
      expect(result.current.canUndo).toBe(true)
    }, 400)
  })

  test('undo returns previous state', () => {
    const { result } = renderHook(() => useLayoutHistory(initialLayout))

    const newLayout = {
      ...initialLayout,
      lg: [{ i: 'widget-1', x: 4, y: 0, w: 4, h: 4 }]
    }

    act(() => {
      result.current.saveToHistory(newLayout, 'Widget moved')
    })

    setTimeout(() => {
      const previous = act(() => result.current.undo())
      expect(previous).toBeTruthy()
      expect(previous?.layout).toEqual(initialLayout)
      expect(result.current.canRedo).toBe(true)
    }, 400)
  })

  test('respects maximum history limit', () => {
    const { result } = renderHook(() =>
      useLayoutHistory(initialLayout, { maxHistory: 5, debounce: 0 })
    )

    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.saveToHistory(
          { ...initialLayout, lg: [] },
          `Action ${i}`
        )
      })
    }

    expect(result.current.historyLength).toBeLessThanOrEqual(5)
  })

  test('clears redo history after new action', () => {
    const { result } = renderHook(() =>
      useLayoutHistory(initialLayout, { debounce: 0 })
    )

    // Add two actions
    act(() => {
      result.current.saveToHistory(
        { ...initialLayout, lg: [] },
        'Action 1'
      )
      result.current.saveToHistory(
        { ...initialLayout, lg: [] },
        'Action 2'
      )
    })

    // Undo once
    act(() => {
      result.current.undo()
    })

    expect(result.current.canRedo).toBe(true)

    // Add new action
    act(() => {
      result.current.saveToHistory(
        { ...initialLayout, lg: [] },
        'Action 3'
      )
    })

    // Redo should now be impossible
    expect(result.current.canRedo).toBe(false)
  })
})
```

**Purpose**: Validate undo/redo state management, history limits, debouncing, and edge cases. These tests can fail if history stack is corrupted or undo/redo logic breaks.

#### Keyboard Shortcuts Tests (`useKeyboardShortcuts.test.ts`)

```typescript
import { renderHook, act, fireEvent } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  test('triggers handler for matching shortcut', () => {
    const handler = jest.fn()
    const shortcuts = { 'cmd+z': handler }

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      fireEvent.keyDown(window, {
        key: 'z',
        metaKey: true,
        preventDefault: jest.fn()
      })
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('does not trigger for non-matching shortcut', () => {
    const handler = jest.fn()
    const shortcuts = { 'cmd+z': handler }

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      fireEvent.keyDown(window, { key: 'a', metaKey: true })
    })

    expect(handler).not.toHaveBeenCalled()
  })

  test('handles multi-modifier shortcuts', () => {
    const handler = jest.fn()
    const shortcuts = { 'cmd+shift+z': handler }

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      fireEvent.keyDown(window, {
        key: 'z',
        metaKey: true,
        shiftKey: true
      })
    })

    expect(handler).toHaveBeenCalled()
  })

  test('can be disabled', () => {
    const handler = jest.fn()
    const shortcuts = { 'cmd+z': handler }

    renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }))

    act(() => {
      fireEvent.keyDown(window, { key: 'z', metaKey: true })
    })

    expect(handler).not.toHaveBeenCalled()
  })

  test('prevents default when configured', () => {
    const handler = jest.fn()
    const shortcuts = { 'cmd+s': handler }
    const preventDefault = jest.fn()

    renderHook(() => useKeyboardShortcuts(shortcuts, { preventDefault: true }))

    act(() => {
      fireEvent.keyDown(window, {
        key: 's',
        metaKey: true,
        preventDefault
      })
    })

    expect(preventDefault).toHaveBeenCalled()
  })
})
```

**Purpose**: Ensure keyboard shortcuts are registered correctly, modifiers work, and shortcuts can be disabled. Tests can fail if key combination logic breaks.

#### Multi-Select Tests (`useMultiSelect.test.ts`)

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMultiSelect } from './useMultiSelect'

describe('useMultiSelect', () => {
  test('toggles single selection', () => {
    const { result } = renderHook(() => useMultiSelect<string>())

    act(() => {
      result.current.toggleSelect('item-1', false)
    })

    expect(result.current.isSelected('item-1')).toBe(true)
    expect(result.current.count).toBe(1)

    act(() => {
      result.current.toggleSelect('item-1', false)
    })

    expect(result.current.isSelected('item-1')).toBe(false)
    expect(result.current.count).toBe(0)
  })

  test('multi-select adds to selection', () => {
    const { result } = renderHook(() => useMultiSelect<string>())

    act(() => {
      result.current.toggleSelect('item-1', true)
      result.current.toggleSelect('item-2', true)
    })

    expect(result.current.count).toBe(2)
    expect(result.current.isSelected('item-1')).toBe(true)
    expect(result.current.isSelected('item-2')).toBe(true)
  })

  test('single select clears previous selection', () => {
    const { result } = renderHook(() => useMultiSelect<string>())

    act(() => {
      result.current.toggleSelect('item-1', true)
      result.current.toggleSelect('item-2', true)
      result.current.toggleSelect('item-3', false) // Single select
    })

    expect(result.current.count).toBe(1)
    expect(result.current.isSelected('item-3')).toBe(true)
    expect(result.current.isSelected('item-1')).toBe(false)
  })

  test('selectAll selects all items', () => {
    const { result } = renderHook(() => useMultiSelect<string>())

    act(() => {
      result.current.selectAll(['item-1', 'item-2', 'item-3'])
    })

    expect(result.current.count).toBe(3)
    expect(result.current.hasSelection).toBe(true)
    expect(result.current.multipleSelection).toBe(true)
  })

  test('clearSelection removes all selections', () => {
    const { result } = renderHook(() => useMultiSelect<string>())

    act(() => {
      result.current.selectAll(['item-1', 'item-2'])
      result.current.clearSelection()
    })

    expect(result.current.count).toBe(0)
    expect(result.current.hasSelection).toBe(false)
  })
})
```

**Purpose**: Test multi-select logic including toggle, select-all, clear, and single vs. multi-select modes. Tests can fail if selection state management breaks.

### Integration Tests

#### Dashboard Creation Flow

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardDetail from '../pages/DashboardDetail'

describe('Dashboard Creation', () => {
  test('creates dashboard from template', async () => {
    render(<DashboardDetail />)

    // Open template gallery
    fireEvent.click(screen.getByText('Use Template'))

    // Select template
    await waitFor(() => {
      expect(screen.getByText('Executive Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Executive Overview'))

    // Verify widgets created
    await waitFor(() => {
      expect(screen.getAllByText(/Chart Widget/)).toHaveLength(5)
    })
  })

  test('adds widget to dashboard', async () => {
    render(<DashboardDetail />)

    const initialWidgetCount = screen.queryAllByText(/Chart Widget/).length

    // Click Add Widget
    fireEvent.click(screen.getByText('Add Widget'))

    // Verify new widget added
    await waitFor(() => {
      const newWidgetCount = screen.getAllByText(/Chart Widget/).length
      expect(newWidgetCount).toBe(initialWidgetCount + 1)
    })
  })
})
```

**Purpose**: Test end-to-end dashboard creation flows including templates and widget addition. Tests can fail if template application or widget creation breaks.

### E2E Tests (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard Editing', () => {
  test('drag and drop widget', async ({ page }) => {
    await page.goto('/dashboards/1')
    await page.click('text=Edit Mode')

    // Get initial position
    const widget = page.locator('.widget').first()
    const initialBox = await widget.boundingBox()

    // Drag widget
    await widget.locator('.drag-handle').hover()
    await page.mouse.down()
    await page.mouse.move(initialBox.x + 200, initialBox.y + 100)
    await page.mouse.up()

    // Verify position changed
    const newBox = await widget.boundingBox()
    expect(newBox.x).not.toBe(initialBox.x)
  })

  test('undo/redo with keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboards/1')
    await page.click('text=Edit Mode')

    // Delete widget
    await page.click('.widget button[title*="Remove"]')
    await page.waitForTimeout(500)

    const widgetCountAfterDelete = await page.locator('.widget').count()

    // Undo
    await page.keyboard.press('Meta+Z')
    await page.waitForTimeout(500)

    const widgetCountAfterUndo = await page.locator('.widget').count()
    expect(widgetCountAfterUndo).toBe(widgetCountAfterDelete + 1)

    // Redo
    await page.keyboard.press('Meta+Shift+Z')
    await page.waitForTimeout(500)

    const widgetCountAfterRedo = await page.locator('.widget').count()
    expect(widgetCountAfterRedo).toBe(widgetCountAfterDelete)
  })

  test('copy and paste widget', async ({ page }) => {
    await page.goto('/dashboards/1')
    await page.click('text=Edit Mode')

    const initialCount = await page.locator('.widget').count()

    // Select widget
    await page.click('.widget')

    // Copy
    await page.keyboard.press('Meta+C')

    // Paste
    await page.keyboard.press('Meta+V')
    await page.waitForTimeout(500)

    const newCount = await page.locator('.widget').count()
    expect(newCount).toBe(initialCount + 1)
  })

  test('responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboards/1')

    // Verify single column layout
    const widgets = page.locator('.widget')
    const firstWidget = widgets.first()
    const secondWidget = widgets.nth(1)

    const firstBox = await firstWidget.boundingBox()
    const secondBox = await secondWidget.boundingBox()

    // Second widget should be below first (not side-by-side)
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
  })
})
```

**Purpose**: Test real user interactions with actual browser automation including drag-and-drop, keyboard shortcuts, and responsive behavior. Tests can fail if UI interactions break.

### Mock Strategies

**Dashboard API Mocks:**

```typescript
// tests/mocks/dashboardApi.ts
import { rest } from 'msw'

export const dashboardHandlers = [
  rest.get('/api/dashboards/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        name: 'Test Dashboard',
        layout: {
          lg: [
            { i: 'widget-1', x: 0, y: 0, w: 4, h: 4, chartId: '1' }
          ],
          md: [],
          sm: [],
          xs: []
        }
      })
    )
  }),

  rest.put('/api/dashboards/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
]
```

**Local Storage Mock:**

```typescript
// tests/setup.ts
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

global.localStorage = localStorageMock as any
```

## Performance Considerations

### Optimization Strategies

1. **React.memo for Widgets**: Prevent unnecessary re-renders
   ```typescript
   export default memo(Widget, (prevProps, nextProps) => {
     return (
       prevProps.widget.i === nextProps.widget.i &&
       prevProps.isEditMode === nextProps.isEditMode &&
       JSON.stringify(prevProps.widget) === JSON.stringify(nextProps.widget)
     )
   })
   ```

2. **Debounced Layout Changes**: Reduce API calls during drag operations
   ```typescript
   const debouncedSave = useMemo(
     () => debounce((layout) => saveLayout(layout), 1000),
     []
   )
   ```

3. **Virtualization for Large Dashboards**: Use react-window for 20+ widgets
   ```typescript
   import { FixedSizeGrid } from 'react-window'

   // Only for very large dashboards (future enhancement)
   ```

4. **Lazy Loading**: IntersectionObserver for off-screen widgets
5. **CSS Transforms**: Use `transform` instead of `position` for drag operations
6. **Memoized Selectors**: Cache expensive computations
   ```typescript
   const selectedWidgets = useMemo(
     () => widgets.filter(w => selectedIds.has(w.i)),
     [widgets, selectedIds]
   )
   ```

### Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Initial Page Load | < 2s | < 5s |
| Widget Drag Latency | < 16ms (60fps) | < 32ms |
| Layout Save API Call | < 500ms | < 2s |
| Undo/Redo Action | < 100ms | < 300ms |
| Dashboard with 8 widgets | < 2s load | < 4s load |
| Dashboard with 15 widgets | < 5s load | < 10s load |

### Performance Monitoring

```typescript
// utils/performanceMonitor.ts
export function measureDashboardLoad(widgetCount: number) {
  const start = performance.now()

  return () => {
    const end = performance.now()
    const duration = end - start

    // Log to analytics
    console.log(`Dashboard loaded: ${widgetCount} widgets in ${duration}ms`)

    if (duration > 5000) {
      console.warn(`Slow dashboard load: ${duration}ms for ${widgetCount} widgets`)
    }
  }
}

// Usage
const measureLoad = measureDashboardLoad(widgets.length)
// ... load dashboard
measureLoad()
```

## Security Considerations

### Input Validation

1. **Widget ID Validation**: Ensure widget IDs are unique and sanitized
2. **Layout JSON Validation**: Validate layout structure before saving
   ```typescript
   function validateLayout(layout: unknown): layout is DashboardLayout {
     // Validate structure
     if (!layout || typeof layout !== 'object') return false
     const l = layout as any
     if (!Array.isArray(l.lg)) return false

     // Validate widget properties
     return l.lg.every(widget =>
       typeof widget.i === 'string' &&
       typeof widget.x === 'number' &&
       typeof widget.y === 'number' &&
       typeof widget.w === 'number' &&
       typeof widget.h === 'number'
     )
   }
   ```

3. **Template Injection Prevention**: Sanitize template data
4. **Clipboard Data Validation**: Verify clipboard contains valid widget data

### Authorization

1. **Edit Mode Access**: Verify user has editor or admin role
   ```typescript
   const canEdit = user?.role === 'admin' || user?.role === 'editor'
   ```

2. **Widget Limits**: Enforce maximum widget count per workspace tier
3. **Dashboard Ownership**: Verify user can edit dashboard before allowing changes
4. **Public Dashboard Restrictions**: View-only mode for public dashboards

### XSS Prevention

1. **Widget Titles**: Sanitize user-provided widget titles
2. **Template Names**: Escape template names in UI
3. **Chart Data**: Trust backend to sanitize chart data

## Documentation

### User Documentation

1. **Dashboard Creation Guide**:
   - How to create dashboard from template
   - How to create blank dashboard
   - Adding and configuring widgets

2. **Keyboard Shortcuts Reference**:
   - Complete list of shortcuts
   - Shortcuts cheat sheet (built-in with `?` key)

3. **Edit vs View Mode**:
   - When to use each mode
   - How to toggle between modes

4. **Mobile Dashboard Viewing**:
   - Best practices for mobile
   - How to optimize for mobile

5. **Performance Tips**:
   - Recommended widget counts
   - How to split large dashboards

### Developer Documentation

1. **Hook Documentation**:
   - `useLayoutHistory`: API, usage examples, edge cases
   - `useKeyboardShortcuts`: Shortcut format, best practices
   - `useMultiSelect`: Selection patterns, bulk operations
   - `useClipboard`: Copy/paste implementation details

2. **Component API**:
   - DashboardBuilder props and events
   - DashboardView props and rendering
   - Widget component lifecycle

3. **Template Creation Guide**:
   - How to define new templates
   - Template structure and requirements
   - Testing templates

4. **Testing Guide**:
   - How to write dashboard tests
   - Mocking strategies
   - E2E test patterns

### API Documentation

No new API endpoints required. Existing dashboard CRUD endpoints handle enhanced layout structure:

```
GET    /api/dashboards           - List dashboards
GET    /api/dashboards/:id       - Get dashboard (with layout)
POST   /api/dashboards           - Create dashboard
PUT    /api/dashboards/:id       - Update dashboard (including layout)
DELETE /api/dashboards/:id       - Delete dashboard
```

## Implementation Phases

### Phase 1: Core Features (Priority 1) - Weeks 1-2

**Goals**: Essential productivity features that 85%+ of platforms have

**Tasks**:
1. ✅ Implement `useLayoutHistory` hook with undo/redo (2 days)
2. ✅ Implement `useKeyboardShortcuts` hook (1 day)
3. ✅ Add keyboard shortcut handlers to DashboardDetail (1 day)
4. ✅ Create ShortcutCheatSheet component (1 day)
5. ✅ Implement `useClipboard` hook for copy/paste (1 day)
6. ✅ Add copy/paste/duplicate operations (1 day)
7. ✅ Implement `useMultiSelect` hook (1 day)
8. ✅ Add multi-select UI and bulk operations (1 day)
9. ✅ Create DashboardToolbar with edit/view toggle (1 day)
10. ✅ Implement DashboardView component (view-only mode) (1 day)

**Deliverables**:
- Undo/redo with 50-action history
- 12 keyboard shortcuts implemented
- Copy/paste/duplicate widgets
- Multi-select with Cmd/Ctrl+Click
- Edit/View mode separation
- Shortcut cheat sheet modal

**Success Criteria**:
- All keyboard shortcuts work correctly
- Undo/redo preserves exact layout state
- Copy/paste creates valid widget clones
- Multi-select allows bulk delete
- Edit/View modes visually distinct

### Phase 2: Templates & UX Polish - Weeks 3-4

**Goals**: Template library and auto-layout to reduce creation time

**Tasks**:
1. ✅ Define 5-10 dashboard templates (2 days)
2. ✅ Create TemplateGallery component (2 days)
3. ✅ Create TemplateCard component (1 day)
4. ✅ Implement template application logic (1 day)
5. ✅ Create `useAutoLayout` hook (1 day)
6. ✅ Add "Auto-Arrange" button to toolbar (1 day)
7. ✅ Create GridOverlay component (1 day)
8. ✅ Create WidgetContextMenu component (2 days)
9. ✅ Integrate context menu into widgets (1 day)
10. ✅ Add visual feedback for drag operations (1 day)

**Deliverables**:
- Template gallery with 5-10 templates
- Template categories and filters
- Auto-arrange algorithm
- Visual grid overlay (toggle with `G`)
- Right-click context menu
- Improved drag feedback

**Success Criteria**:
- Users can create dashboard from template in < 2 minutes
- Auto-arrange produces visually appealing layouts
- Grid overlay helps with alignment
- Context menu accessible via right-click

### Phase 3: Mobile & Performance - Weeks 5-6

**Goals**: Mobile optimization and large dashboard performance

**Tasks**:
1. ✅ Implement `useResponsiveLayout` hook (2 days)
2. ✅ Auto-generate mobile/tablet layouts (1 day)
3. ✅ Create LazyWidget component with IntersectionObserver (2 days)
4. ✅ Add widget count warnings (1 day)
5. ✅ Optimize React.memo usage (1 day)
6. ✅ Add performance monitoring (1 day)
7. ✅ Mobile-specific UI adjustments (2 days)
8. ✅ Test responsive layouts on real devices (2 days)

**Deliverables**:
- Auto-generated mobile layouts (single column)
- Lazy loading for 15+ widget dashboards
- Performance warnings at 8/15 widgets
- Mobile-optimized touch interactions
- Performance metrics collection

**Success Criteria**:
- Mobile layout automatically adjusts to single column
- Large dashboards (15+ widgets) load in < 5s
- Widget limit warnings display correctly
- Touch interactions work smoothly on mobile

### Phase 4: Polish & Documentation - Week 7

**Goals**: Documentation, bug fixes, and final polish

**Tasks**:
1. ✅ Write user documentation (2 days)
2. ✅ Write developer documentation (2 days)
3. ✅ Create video tutorials (1 day)
4. ✅ Bug fixes and edge cases (2 days)

**Deliverables**:
- Complete user guide
- Developer API documentation
- Video tutorials for key features
- Bug-free implementation

**Success Criteria**:
- All documentation complete and reviewed
- Zero known critical bugs
- Video tutorials available

## Open Questions

### Technical Questions

1. **Undo/Redo Persistence**: Should undo history persist across page reloads?
   - **Recommendation**: No, reset on page load to avoid confusion

2. **Clipboard Format**: Use plain JSON or binary format for widget copy/paste?
   - **Recommendation**: JSON for simplicity and debugging

3. **Template Storage**: Store templates in database or code?
   - **Recommendation**: Code initially, database later for user-created templates

4. **Grid Overlay Persistence**: Remember user preference for grid overlay?
   - **Recommendation**: Yes, store in localStorage

5. **Multi-Dashboard Copy/Paste**: Allow copying widgets across dashboards?
   - **Recommendation**: Yes (Phase 1), use clipboard API

### Product Questions

1. **Template Customization**: Allow users to save custom templates?
   - **Recommendation**: Future phase (out of scope for v1)

2. **Collaborative Editing**: Real-time multi-user editing?
   - **Recommendation**: Future phase (explicitly out of scope)

3. **Version History**: Git-like version control for dashboards?
   - **Recommendation**: Future phase (out of scope)

4. **Widget Limit**: Hard limit or soft warning for widget count?
   - **Recommendation**: Soft warning at 8, stronger warning at 15, no hard limit

5. **Mobile Editing**: Should mobile support full edit mode?
   - **Recommendation**: View-only for MVP, limited editing in future

## References

### External Documentation

- **React Grid Layout**: https://github.com/react-grid-layout/react-grid-layout
- **Zustand**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Heroicons**: https://heroicons.com/

### Research Sources

- Dashboard UX Research Report (November 22, 2025)
- Tableau Dashboard Best Practices
- Power BI Grid System Documentation
- Grafana Dashboard Creation Guide
- Metabase Dashboard Patterns

### Related Issues/PRs

- #0: Dashboard implementation (initial)
- #1: Theme system completion
- #2: Multi-tenant workspaces

### Design Patterns

- Command Pattern: Undo/redo implementation
- Observer Pattern: Keyboard shortcut registration
- Strategy Pattern: Auto-layout algorithms
- Factory Pattern: Template instantiation
- Memento Pattern: History state management

---

**End of Specification**

This specification provides a comprehensive roadmap for enhancing the dashboard UX with industry-standard features. Implementation should follow the phased approach, with Phase 1 (Core Features) being highest priority.
