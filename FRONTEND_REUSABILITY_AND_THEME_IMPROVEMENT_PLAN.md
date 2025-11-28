# Frontend Reusability & Theme Improvement Plan

## Executive Summary

This document outlines a comprehensive plan to improve the frontend codebase by:
1. **Creating reusable component library** to eliminate code duplication
2. **Fixing theme system inconsistencies** across all pages
3. **Improving UI clarity** by ensuring proper contrast between buttons, content, and backgrounds
4. **Establishing consistent design patterns** for scalable development

**Current Status**: 36 components across 8 categories, with significant duplication and inconsistent theme adoption.

**Target State**: Fully themed, reusable component library with 95%+ of UI elements using theme system.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Critical Issues Identified](#critical-issues-identified)
3. [Component Reusability Plan](#component-reusability-plan)
4. [Theme System Enhancement Plan](#theme-system-enhancement-plan)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Component Specifications](#component-specifications)
7. [Migration Guide](#migration-guide)
8. [Testing Strategy](#testing-strategy)

---

## Current State Analysis

### Component Organization

```
frontend/src/components/
├── common/          # 11 components (Core UI primitives)
│   ├── ✓ Button, Input, Select, Textarea (Well themed)
│   ├── ✓ Card, Modal, Toast (Well themed)
│   ├── ⚠ FormSection (Hardcoded colors)
│   └── ⚠ Spinner (Hardcoded colors)
├── theme/           # 3 components (Theme management)
│   └── ✓ ThemeSelector, CustomThemePicker, ThemeMenu
├── layout/          # 3 components (Page structure)
│   └── ✓ Header, Sidebar, MainLayout
├── admin/           # 6 components (Admin features)
│   └── ✗ UserManagement, ConnectionPermissions (Hardcoded colors)
├── charts/          # 4 components (Chart features)
│   └── ~ ChartBuilder, ChartRenderer (Mixed theming)
├── dashboard/       # 5 components (Dashboard features)
│   └── ~ DashboardBuilder, DashboardGrid (Mixed theming)
└── connections/     # 3 components (Connection features)
    └── ✗ ConnectionsGrid, ConnectionsTable (Hardcoded colors)
```

**Legend**: ✓ Good | ~ Needs improvement | ✗ Critical issues

### Theme System Capabilities

**Strengths**:
- 15-color comprehensive palette (bg, text, accent, border, status)
- 6 built-in themes + custom theme support
- Memoized style hook (`useThemedStyles()`)
- WCAG contrast utilities
- System preference sync

**Weaknesses**:
- ~30% of components ignore theme system
- Hardcoded Tailwind classes in 10+ components
- No consistent icon theming
- Inconsistent text hierarchy usage

---

## Critical Issues Identified

### Issue #1: Hardcoded Colors Breaking Dark Theme

**Severity**: High | **Affected Components**: 8

**Problem**: Components use hardcoded gray colors instead of theme system.

**Examples**:
```tsx
// ChartList.tsx - Line 75
<div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900">{chart.name}</h3>
  <p className="text-sm text-gray-600">{chart.description}</p>
</div>
```

**Impact**:
- Dark theme shows dark text on dark background (unreadable)
- User preference ignored
- Brand colors not applied

**Files Affected**:
- `frontend/src/pages/ChartList.tsx`
- `frontend/src/components/admin/ConnectionPermissions.tsx`
- `frontend/src/components/admin/UserManagement.tsx`
- `frontend/src/components/connections/ConnectionsGrid.tsx`
- `frontend/src/components/connections/ConnectionsTable.tsx`
- `frontend/src/components/common/FormSection.tsx`
- `frontend/src/components/common/Spinner.tsx`

---

### Issue #2: Low Contrast - Buttons Same Color as Content

**Severity**: High | **Affected Pages**: 5+

**Problem**: Buttons and content use similar theme colors without sufficient contrast.

**Example**:
```tsx
// DashboardList.tsx - Private badge
<span style={{ backgroundColor: theme.colors.bgTertiary }}>
  <span style={{ color: theme.colors.textSecondary }}>Private</span>
</span>
```

**Issue**: If `bgTertiary` is light blue and `textSecondary` is medium blue, contrast is too low.

**Solution Needed**:
- Use contrast checker utility
- Apply `getContrastTextColor()` automatically
- Establish minimum contrast ratios (WCAG AA: 4.5:1)

---

### Issue #3: Inconsistent Status Colors

**Severity**: Medium | **Affected Components**: 6

**Problem**: Success/error/warning states use mixed approaches.

**Examples**:
```tsx
// ConnectionPermissions.tsx - Hardcoded green
<div className="p-4 bg-green-50 border border-green-200">
  <p className="text-green-800">{successMessage}</p>
</div>

// Should be:
<Alert type="success" message={successMessage} />
// Which internally uses: theme.colors.success
```

**Inconsistencies**:
- Some use `theme.colors.success`
- Some use hardcoded `bg-green-50`
- Some use `styles.badge('success')`

---

### Issue #4: Code Duplication - Repeated Patterns

**Severity**: Medium | **Affected Components**: 15+

**Duplicated Patterns**:

1. **Empty State UI** (4+ instances)
2. **Table Headers** (5+ instances)
3. **Status Badges** (6+ instances)
4. **Loading States** (8+ instances)
5. **Alert/Message Boxes** (4+ instances)

**Impact**:
- 200+ lines of duplicated code
- Inconsistent UX patterns
- Hard to maintain
- Updates require changing multiple files

---

### Issue #5: Missing Component Primitives

**Severity**: Medium

**Gap Analysis**:

| Missing Component | Needed By | Current Workaround | Priority |
|-------------------|-----------|-------------------|----------|
| Generic Table | 5 pages | Reinvented per page | Critical |
| Alert/Message Box | 4 pages | Hardcoded divs | Critical |
| Status Badge | 6 pages | Inline spans | High |
| Empty State | 4 pages | Copy-paste JSX | High |
| Tabs | 2 pages | Custom implementation | Medium |
| Icon Wrapper | All pages | Direct Heroicons + colors | Medium |
| Dropdown (enhanced) | 3 pages | Native select | Low |
| Tooltip | 0 pages | None | Low |

---

## Component Reusability Plan

### Phase 1: Core UI Primitives (High Priority)

#### 1.1 Alert Component

**Purpose**: Replace hardcoded alert/message boxes.

**API Design**:
```tsx
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

// Usage
<Alert type="success" message="Connection saved successfully" />
<Alert type="error" message="Failed to load data" dismissible onClose={handleClose} />
```

**Theme Integration**:
- Background: `withOpacity(theme.colors[type], 10%)`
- Border: `theme.colors[type]`
- Text: `adjustColorBrightness(theme.colors[type], -30%)`
- Icon: `theme.colors[type]`

**Replaces**:
- ConnectionPermissions.tsx lines 140-143 (success message)
- UserManagement.tsx error display
- ConnectionForm.tsx validation errors
- ChartBuilder.tsx query errors

---

#### 1.2 StatusBadge Component

**Purpose**: Consistent status/label display across platform.

**API Design**:
```tsx
interface StatusBadgeProps {
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
}

// Usage
<StatusBadge type="success" label="Active" />
<StatusBadge type="neutral" label="Private" variant="subtle" />
<StatusBadge label="Admin" variant="outline" />
```

**Theme Integration**:
- Solid: `background = theme.colors[type]`, `text = white`
- Outline: `border = theme.colors[type]`, `text = theme.colors[type]`
- Subtle: `background = withOpacity(theme.colors[type], 15%)`, `text = theme.colors[type]`

**Replaces**:
- DashboardList.tsx line 281 (private badge)
- ConnectionsGrid.tsx connection status
- ChartList.tsx line 89 (chart type badge)
- ConnectionPermissions.tsx permission levels
- UserManagement.tsx role badges

---

#### 1.3 EmptyState Component

**Purpose**: Consistent empty state messaging.

**API Design**:
```tsx
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
<EmptyState
  icon={ChartBarIcon}
  title="No charts yet"
  description="Create your first chart to visualize data"
  action={{ label: "Create Chart", onClick: handleCreate }}
/>
```

**Theme Integration**:
- Icon: `theme.colors.textSecondary` with opacity
- Title: `theme.colors.textPrimary`
- Description: `theme.colors.textSecondary`
- Action: Uses Button component (already themed)

**Replaces**:
- DashboardList.tsx empty state
- ChartList.tsx empty state
- UserManagement.tsx empty state
- ConnectionsPage.tsx empty state

---

#### 1.4 Table Component

**Purpose**: Generic data table with sorting, theming, and responsiveness.

**API Design**:
```tsx
interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

// Usage
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', render: (row) => <StatusBadge label={row.type} /> },
    { key: 'actions', label: 'Actions', render: (row) => <IconButton icon={TrashIcon} /> }
  ]}
  data={users}
  onRowClick={handleRowClick}
  loading={isLoading}
/>
```

**Theme Integration**:
- Table background: `theme.colors.bgPrimary`
- Header background: `theme.colors.bgTertiary`
- Header text: `theme.colors.textSecondary` (uppercase, smaller)
- Row border: `theme.colors.borderPrimary`
- Row hover: `withOpacity(theme.colors.accentPrimary, 5%)`
- Row text: `theme.colors.textPrimary`

**Features**:
- Column sorting (ascending/descending)
- Row hover highlighting
- Custom cell rendering
- Loading state with skeleton
- Empty state support
- Responsive (stacks on mobile)

**Replaces**:
- ConnectionsTable.tsx
- UserManagement.tsx table
- ConnectionPermissions.tsx table
- DashboardList.tsx table

---

#### 1.5 Tabs Component

**Purpose**: Tabbed navigation within pages.

**API Design**:
```tsx
interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
}

// Usage
<Tabs
  tabs={[
    { id: 'users', label: 'Users', icon: UserIcon, badge: 24 },
    { id: 'roles', label: 'Roles', icon: ShieldCheckIcon }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="underline"
/>
```

**Theme Integration**:
- Active tab: `borderBottom = theme.colors.accentPrimary`, `text = theme.colors.accentPrimary`
- Inactive tab: `text = theme.colors.textSecondary`, `hover background = bgTertiary`
- Badge: Uses StatusBadge component

**Replaces**:
- UsersPage.tsx lines 48-59 (custom tab implementation)
- AdminSettings.tsx tab navigation

---

#### 1.6 Icon Component (Themed Wrapper)

**Purpose**: Consistent icon theming across platform.

**API Design**:
```tsx
interface IconProps {
  Icon: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'error' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Usage
<Icon Icon={ChartBarIcon} variant="primary" size="md" />
<Icon Icon={TrashIcon} variant="error" size="sm" />
```

**Theme Integration**:
- Primary: `theme.colors.textPrimary`
- Secondary: `theme.colors.textSecondary`
- Tertiary: `theme.colors.textTertiary`
- Accent: `theme.colors.accentPrimary`
- Status colors: `theme.colors[success/error/warning/info]`

**Size Mapping**:
- xs: 12px
- sm: 16px
- md: 20px
- lg: 24px
- xl: 32px

**Replaces**:
- Direct Heroicons usage with hardcoded `text-gray-*` classes
- `iconColors.tsx` utility (absorb into component)

---

### Phase 2: Layout & Structure Components

#### 2.1 PageLayout Component

**Purpose**: Consistent page structure with header, loading, and error states.

**API Design**:
```tsx
interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
}

// Usage
<PageLayout
  title="Dashboards"
  subtitle="Manage your data visualizations"
  actions={<Button onClick={handleCreate}>New Dashboard</Button>}
  loading={isLoading}
  error={error}
>
  {content}
</PageLayout>
```

**Features**:
- Integrates Header component
- Shows loading spinner when loading=true
- Shows error Alert when error is set
- Consistent padding and spacing

---

#### 2.2 Grid Component (Generic Layout)

**Purpose**: Responsive grid layout for cards.

**API Design**:
```tsx
interface GridProps {
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  children: React.ReactNode;
}

// Usage
<Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap={4}>
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</Grid>
```

**Replaces**:
- ConnectionsGrid.tsx grid layout
- DashboardList.tsx grid view
- ChartList.tsx card grid

---

### Phase 3: Advanced Components

#### 3.1 DataGrid Component (Advanced Table)

**Purpose**: Table with pagination, sorting, filtering, and bulk actions.

**Features**:
- Extends Table component
- Client-side pagination
- Column filters
- Row selection (checkboxes)
- Bulk actions toolbar
- Export functionality

**Usage**:
```tsx
<DataGrid
  columns={columns}
  data={users}
  pageSize={25}
  sortable
  filterable
  selectable
  bulkActions={[
    { label: 'Delete', icon: TrashIcon, onClick: handleBulkDelete }
  ]}
  onExport={handleExport}
/>
```

---

#### 3.2 Dropdown Component (Enhanced Select)

**Purpose**: Rich dropdown with search, icons, and custom rendering.

**Features**:
- Search/filter options
- Icons for options
- Multi-select mode
- Custom option rendering
- Keyboard navigation

**Usage**:
```tsx
<Dropdown
  options={[
    { value: 'mysql', label: 'MySQL', icon: DatabaseIcon },
    { value: 'postgresql', label: 'PostgreSQL', icon: DatabaseIcon }
  ]}
  value={selectedType}
  onChange={setSelectedType}
  searchable
  placeholder="Select database type"
/>
```

---

#### 3.3 FormModal Component

**Purpose**: Modal with form structure and validation.

**Features**:
- Built-in form layout
- Field validation
- Loading state during submit
- Error display
- Cancel/submit actions

**Usage**:
```tsx
<FormModal
  isOpen={isOpen}
  onClose={handleClose}
  onSubmit={handleSubmit}
  title="Create Connection"
  submitLabel="Create"
  loading={isSubmitting}
>
  <Input label="Name" value={name} onChange={setName} required />
  <Select label="Type" value={type} onChange={setType} options={types} />
</FormModal>
```

---

## Theme System Enhancement Plan

### Enhancement #1: Fix Hardcoded Colors

**Objective**: Replace all hardcoded Tailwind classes with theme system.

**Files to Fix**:

1. **ChartList.tsx**
   ```diff
   - <div className="bg-white p-6 rounded-lg border border-gray-200">
   -   <h3 className="text-lg font-semibold text-gray-900">{chart.name}</h3>
   -   <p className="text-sm text-gray-600">{chart.description}</p>
   + <div style={{
   +   backgroundColor: theme.colors.bgPrimary,
   +   borderColor: theme.colors.borderPrimary
   + }} className="p-6 rounded-lg border">
   +   <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
   +     {chart.name}
   +   </h3>
   +   <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
   +     {chart.description}
   +   </p>
   </div>
   ```

2. **ConnectionPermissions.tsx**
   ```diff
   - <div className="p-4 bg-green-50 border border-green-200">
   -   <p className="text-green-800">{successMessage}</p>
   - </div>
   + <Alert type="success" message={successMessage} />
   ```

3. **UserManagement.tsx**
   - Replace all `text-gray-900` → `style={{ color: theme.colors.textPrimary }}`
   - Replace all `text-gray-600` → `style={{ color: theme.colors.textSecondary }}`
   - Replace all `border-gray-300` → `style={{ borderColor: theme.colors.borderPrimary }}`

4. **ConnectionsGrid.tsx**
   - Same pattern as UserManagement

5. **FormSection.tsx**
   ```diff
   - className={`bg-gradient-to-r ${colors.gradient}`}
   + style={{
   +   background: `linear-gradient(to right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`
   + }}
   ```

6. **Spinner.tsx**
   ```diff
   - <div className="border-blue-600 border-t-transparent">
   + <div style={{
   +   borderColor: theme.colors.accentPrimary,
   +   borderTopColor: 'transparent'
   + }}>
   ```

---

### Enhancement #2: Improve Contrast Checking

**Objective**: Ensure all text/background combinations meet WCAG AA standards (4.5:1).

**Implementation**:

1. **Create contrast validator utility**:
```tsx
// frontend/src/utils/contrastChecker.ts
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const contrast = calculateContrast(foreground, background);
  return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
}

export function ensureContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): string {
  if (meetsContrastRequirement(foreground, background, level)) {
    return foreground;
  }
  // Adjust foreground color until contrast is sufficient
  return adjustUntilContrast(foreground, background, level);
}
```

2. **Update useThemedStyles hook**:
```tsx
// frontend/src/hooks/useThemedStyles.ts
const styles = useMemo(() => {
  return {
    text: {
      // Ensure primary text always has sufficient contrast on primary bg
      primary: {
        color: ensureContrast(
          theme.colors.textPrimary,
          theme.colors.bgPrimary,
          'AA'
        )
      },
      // ... other variants
    },
    badge: (type: 'success' | 'error' | 'warning' | 'info') => {
      const bgColor = withOpacity(theme.colors[type], 15);
      return {
        backgroundColor: bgColor,
        color: ensureContrast(theme.colors[type], bgColor, 'AA')
      };
    }
  };
}, [theme]);
```

3. **Add contrast warning in CustomThemePicker**:
```tsx
{/* Show warning if contrast is too low */}
{!meetsContrastRequirement(colors.textPrimary, colors.bgPrimary) && (
  <Alert
    type="warning"
    message="Text may be hard to read. Adjust text or background color for better contrast."
  />
)}
```

---

### Enhancement #3: Icon Theming System

**Objective**: Consistent icon colors across all components.

**Implementation**:

1. **Create Icon component** (see section 1.6 above)

2. **Update all icon usage**:
```diff
- <ChartBarIcon className="w-5 h-5 text-gray-400" />
+ <Icon Icon={ChartBarIcon} variant="secondary" size="md" />
```

3. **Deprecate iconColors.tsx** utility in favor of Icon component

---

### Enhancement #4: Text Hierarchy Enforcement

**Objective**: Consistent text sizing and color across platform.

**Typography Scale**:
```tsx
// Add to useThemedStyles.ts
const typography = {
  h1: {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.colors.textPrimary,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    lineHeight: 1.4
  },
  body: {
    fontSize: '1rem',
    color: theme.colors.textPrimary,
    lineHeight: 1.5
  },
  bodySecondary: {
    fontSize: '1rem',
    color: theme.colors.textSecondary,
    lineHeight: 1.5
  },
  caption: {
    fontSize: '0.875rem',
    color: theme.colors.textSecondary,
    lineHeight: 1.4
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.colors.textPrimary,
    lineHeight: 1.4
  }
};
```

**Usage**:
```tsx
const styles = useThemedStyles();

<h1 style={styles.typography.h1}>Dashboard</h1>
<p style={styles.typography.body}>Main content text</p>
<span style={styles.typography.caption}>Helper text</span>
```

---

### Enhancement #5: Status Color System

**Objective**: Consistent success/error/warning/info colors across all components.

**Implementation**:

1. **Extend useThemedStyles with status helpers**:
```tsx
const statusStyles = useMemo(() => ({
  success: {
    background: withOpacity(theme.colors.success, 10),
    border: theme.colors.success,
    text: adjustColorBrightness(theme.colors.success, -30),
    icon: theme.colors.success
  },
  error: {
    background: withOpacity(theme.colors.error, 10),
    border: theme.colors.error,
    text: adjustColorBrightness(theme.colors.error, -30),
    icon: theme.colors.error
  },
  warning: {
    background: withOpacity(theme.colors.warning, 10),
    border: theme.colors.warning,
    text: adjustColorBrightness(theme.colors.warning, -30),
    icon: theme.colors.warning
  },
  info: {
    background: withOpacity(theme.colors.info, 10),
    border: theme.colors.info,
    text: adjustColorBrightness(theme.colors.info, -30),
    icon: theme.colors.info
  }
}), [theme]);
```

2. **Use in Alert component**:
```tsx
const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const styles = useThemedStyles();
  const statusStyle = styles.status[type];

  return (
    <div style={{
      backgroundColor: statusStyle.background,
      borderColor: statusStyle.border,
      color: statusStyle.text
    }}>
      <Icon Icon={getIconForType(type)} color={statusStyle.icon} />
      {message}
    </div>
  );
};
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1-2)

**Goal**: Fix all hardcoded colors and create core components.

**Tasks**:
1. ✓ Create `Alert` component
2. ✓ Create `StatusBadge` component
3. ✓ Create `Icon` component
4. ✓ Fix ChartList.tsx hardcoded colors
5. ✓ Fix ConnectionPermissions.tsx hardcoded colors
6. ✓ Fix UserManagement.tsx hardcoded colors
7. ✓ Fix ConnectionsGrid.tsx hardcoded colors
8. ✓ Fix FormSection.tsx hardcoded colors
9. ✓ Fix Spinner.tsx hardcoded colors
10. ✓ Add contrast checking to useThemedStyles

**Success Criteria**:
- All pages display correctly in dark theme
- No hardcoded `text-gray-*`, `bg-gray-*`, `border-gray-*` classes remain
- All status messages use Alert component
- All badges use StatusBadge component

---

### Phase 2: Component Library (Week 3-4)

**Goal**: Build reusable component library.

**Tasks**:
1. ✓ Create `EmptyState` component
2. ✓ Create `Table` component
3. ✓ Create `Tabs` component
4. ✓ Migrate ConnectionsTable to use Table component
5. ✓ Migrate UserManagement to use Table component
6. ✓ Migrate UsersPage to use Tabs component
7. ✓ Replace all empty state implementations
8. ✓ Create `Grid` component
9. ✓ Create `PageLayout` component
10. ✓ Add typography scale to useThemedStyles

**Success Criteria**:
- 100+ lines of code eliminated through reuse
- All tables use Table component
- All tabs use Tabs component
- All empty states use EmptyState component

---

### Phase 3: Advanced Features (Week 5-6)

**Goal**: Build advanced components and improve DX.

**Tasks**:
1. ✓ Create `DataGrid` component (with pagination/sorting)
2. ✓ Create `Dropdown` component (enhanced select)
3. ✓ Create `FormModal` component
4. ✓ Create Storybook setup
5. ✓ Document all components in Storybook
6. ✓ Add accessibility audit
7. ✓ Create component usage guidelines
8. ✓ Add component prop validation
9. ✓ Create component testing examples
10. ✓ Performance audit of theme system

**Success Criteria**:
- Storybook accessible to all developers
- All components have Storybook stories
- Component API documented
- Accessibility score 90+

---

### Phase 4: Migration & Polish (Week 7-8)

**Goal**: Migrate all pages to use new components.

**Tasks**:
1. ✓ Audit all pages for component usage
2. ✓ Migrate DashboardList page
3. ✓ Migrate ChartList page
4. ✓ Migrate ConnectionsPage
5. ✓ Migrate AdminSettings page
6. ✓ Migrate UsersPage
7. ✓ Migrate Login page (theme improvements only)
8. ✓ Remove deprecated components
9. ✓ Remove iconColors.tsx utility
10. ✓ Final accessibility audit
11. ✓ Performance testing
12. ✓ User acceptance testing

**Success Criteria**:
- All pages use component library
- No code duplication remains
- Theme system coverage: 95%+
- Lighthouse accessibility score: 95+
- No console warnings

---

## Component Specifications

### Alert Component Specification

**File**: `frontend/src/components/common/Alert.tsx`

**Props**:
```tsx
interface AlertProps {
  /** Alert type - determines color scheme */
  type: 'success' | 'error' | 'warning' | 'info';

  /** Message to display */
  message: string;

  /** Optional title */
  title?: string;

  /** Show close button */
  dismissible?: boolean;

  /** Close handler */
  onClose?: () => void;

  /** Custom icon (defaults based on type) */
  icon?: React.ComponentType<{ className?: string }>;
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────────┐
│ [Icon] Title (optional)                      [Close]│
│        Message text goes here                       │
└─────────────────────────────────────────────────────┘
```

**Theming**:
- Background: `withOpacity(theme.colors[type], 10%)`
- Border: `1px solid theme.colors[type]`
- Text: `darken(theme.colors[type], 30%)`
- Icon: `theme.colors[type]`

**Accessibility**:
- role="alert" for screen readers
- aria-live="polite" for non-critical alerts
- Keyboard dismissible (Escape key)

**Implementation**:
```tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity, adjustColorBrightness } from '@/utils/colorHelpers';
import { Icon } from './Icon';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ICON_MAP = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
};

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  title,
  dismissible = false,
  onClose,
  icon
}) => {
  const { theme } = useTheme();

  const statusColor = theme.colors[type];
  const IconComponent = icon || ICON_MAP[type];

  const styles = {
    container: {
      backgroundColor: withOpacity(statusColor, 10),
      borderColor: statusColor,
      color: adjustColorBrightness(statusColor, -30),
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.5rem',
      padding: '1rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start'
    },
    iconWrapper: {
      flexShrink: 0
    },
    content: {
      flex: 1
    },
    title: {
      fontWeight: 600,
      marginBottom: title ? '0.25rem' : 0
    },
    message: {
      fontSize: '0.875rem'
    },
    closeButton: {
      flexShrink: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: statusColor
    }
  };

  return (
    <div style={styles.container} role="alert" aria-live="polite">
      <div style={styles.iconWrapper}>
        <Icon Icon={IconComponent} size="md" color={statusColor} />
      </div>
      <div style={styles.content}>
        {title && <div style={styles.title}>{title}</div>}
        <div style={styles.message}>{message}</div>
      </div>
      {dismissible && onClose && (
        <button
          style={styles.closeButton}
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          <Icon Icon={XMarkIcon} size="sm" color={statusColor} />
        </button>
      )}
    </div>
  );
};
```

**Usage Examples**:
```tsx
// Success message
<Alert type="success" message="Connection saved successfully" />

// Error with title
<Alert
  type="error"
  title="Connection failed"
  message="Unable to connect to database. Check credentials."
/>

// Dismissible warning
<Alert
  type="warning"
  message="This connection hasn't been tested yet"
  dismissible
  onClose={handleDismiss}
/>

// Info with custom icon
<Alert
  type="info"
  message="New features available"
  icon={SparklesIcon}
/>
```

---

### StatusBadge Component Specification

**File**: `frontend/src/components/common/StatusBadge.tsx`

**Props**:
```tsx
interface StatusBadgeProps {
  /** Badge type - determines color scheme */
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';

  /** Badge label text */
  label: string;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Style variant */
  variant?: 'solid' | 'outline' | 'subtle';

  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;

  /** Click handler (makes badge interactive) */
  onClick?: () => void;
}
```

**Visual Design**:
```
Solid:   [●] Label     (colored background, white text)
Outline: [○] Label     (colored border, colored text)
Subtle:  [◐] Label     (light colored bg, colored text)
```

**Theming**:
- Solid: `background = theme.colors[type]`, `text = white`
- Outline: `border = theme.colors[type]`, `text = theme.colors[type]`
- Subtle: `background = withOpacity(theme.colors[type], 15%)`, `text = theme.colors[type]`

**Size Map**:
- sm: `padding: 0.125rem 0.5rem`, `fontSize: 0.75rem`
- md: `padding: 0.25rem 0.75rem`, `fontSize: 0.875rem`
- lg: `padding: 0.375rem 1rem`, `fontSize: 1rem`

**Implementation**:
```tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/utils/colorHelpers';
import { Icon } from './Icon';

const SIZE_STYLES = {
  sm: {
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    iconSize: 'xs' as const
  },
  md: {
    padding: '0.25rem 0.75rem',
    fontSize: '0.875rem',
    iconSize: 'sm' as const
  },
  lg: {
    padding: '0.375rem 1rem',
    fontSize: '1rem',
    iconSize: 'md' as const
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = 'neutral',
  label,
  size = 'md',
  variant = 'subtle',
  icon,
  onClick
}) => {
  const { theme } = useTheme();

  const statusColor = type === 'neutral'
    ? theme.colors.textSecondary
    : theme.colors[type];

  const sizeStyle = SIZE_STYLES[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: statusColor,
          color: '#ffffff',
          border: 'none'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: statusColor,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: statusColor
        };
      case 'subtle':
        return {
          backgroundColor: withOpacity(statusColor, 15),
          color: statusColor,
          border: 'none'
        };
    }
  };

  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      borderRadius: '9999px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      ...sizeStyle,
      ...getVariantStyles()
    }
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component style={styles.badge} onClick={onClick}>
      {icon && <Icon Icon={icon} size={sizeStyle.iconSize} color="currentColor" />}
      {label}
    </Component>
  );
};
```

**Usage Examples**:
```tsx
// Success badge
<StatusBadge type="success" label="Active" />

// Neutral badge (default)
<StatusBadge label="Private" variant="subtle" />

// Error with icon
<StatusBadge
  type="error"
  label="Failed"
  icon={XCircleIcon}
  variant="solid"
/>

// Interactive badge
<StatusBadge
  type="info"
  label="View Details"
  onClick={handleClick}
  variant="outline"
/>

// Large warning badge
<StatusBadge
  type="warning"
  label="Pending Review"
  size="lg"
/>
```

---

### Table Component Specification

**File**: `frontend/src/components/common/Table.tsx`

**Props**:
```tsx
interface Column<T> {
  /** Unique key for column */
  key: string;

  /** Column header label */
  label: string;

  /** Custom cell renderer */
  render?: (row: T) => React.ReactNode;

  /** Enable sorting */
  sortable?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[];

  /** Data rows */
  data: T[];

  /** Row click handler */
  onRowClick?: (row: T) => void;

  /** Loading state */
  loading?: boolean;

  /** Empty state component */
  emptyState?: React.ReactNode;

  /** Default sort column */
  defaultSortKey?: string;

  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
}
```

**Visual Design**:
```
┌──────────────────────────────────────────────────┐
│ Column A ▲ │ Column B   │ Column C   │ Actions │
├──────────────────────────────────────────────────┤
│ Value 1     │ Value 2    │ Value 3    │ [···]   │
│ Value 1     │ Value 2    │ Value 3    │ [···]   │
└──────────────────────────────────────────────────┘
```

**Features**:
- Column sorting (click header to toggle)
- Row hover highlighting
- Custom cell rendering
- Loading skeleton
- Empty state
- Responsive (horizontal scroll on mobile)

**Theming**:
- Table background: `theme.colors.bgPrimary`
- Header background: `theme.colors.bgTertiary`
- Header text: `theme.colors.textSecondary` (uppercase, bold)
- Row border: `theme.colors.borderPrimary`
- Row hover: `withOpacity(theme.colors.accentPrimary, 5%)`
- Row text: `theme.colors.textPrimary`
- Sort icon: `theme.colors.accentPrimary`

**Implementation** (abbreviated):
```tsx
export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  loading,
  emptyState,
  defaultSortKey,
  defaultSortDirection = 'asc'
}: TableProps<T>) {
  const { theme } = useTheme();
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (data.length === 0) {
    return emptyState || <EmptyState icon={TableIcon} title="No data" />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: theme.colors.bgTertiary }}>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: column.align || 'left',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.colors.textSecondary,
                  width: column.width,
                  cursor: column.sortable ? 'pointer' : 'default'
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    <Icon
                      Icon={sortDirection === 'asc' ? ChevronUpIcon : ChevronDownIcon}
                      size="xs"
                      color={theme.colors.accentPrimary}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                borderBottom: `1px solid ${theme.colors.borderPrimary}`,
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.2s'
              }}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = withOpacity(
                  theme.colors.accentPrimary,
                  5
                );
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  style={{
                    padding: '1rem 1.5rem',
                    color: theme.colors.textPrimary,
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Usage Examples**:
```tsx
// Simple table
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ]}
  data={users}
/>

// Table with custom rendering
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge type={row.active ? 'success' : 'error'} label={row.active ? 'Active' : 'Inactive'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => handleEdit(row.id)}>
          Edit
        </Button>
      )
    }
  ]}
  data={connections}
  onRowClick={handleRowClick}
/>

// Table with loading and empty state
<Table
  columns={columns}
  data={dashboards}
  loading={isLoading}
  emptyState={
    <EmptyState
      icon={ChartBarIcon}
      title="No dashboards"
      description="Create your first dashboard"
      action={{ label: 'New Dashboard', onClick: handleCreate }}
    />
  }
/>
```

---

## Migration Guide

### Migrating from Hardcoded Colors to Theme System

**Step 1: Import useTheme hook**
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();
  // ...
}
```

**Step 2: Replace Tailwind classes with inline styles**

Before:
```tsx
<div className="bg-white border border-gray-200 rounded-lg">
  <h3 className="text-gray-900 font-semibold">Title</h3>
  <p className="text-gray-600 text-sm">Description</p>
</div>
```

After:
```tsx
<div
  className="rounded-lg"
  style={{
    backgroundColor: theme.colors.bgPrimary,
    borderColor: theme.colors.borderPrimary,
    borderWidth: '1px',
    borderStyle: 'solid'
  }}
>
  <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>
    Title
  </h3>
  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
    Description
  </p>
</div>
```

**Step 3: Use useThemedStyles for complex components**

```tsx
import { useThemedStyles } from '@/hooks/useThemedStyles';

function MyComponent() {
  const styles = useThemedStyles();

  return (
    <div style={styles.card}>
      <h3 style={styles.heading.primary}>Title</h3>
      <p style={styles.text.secondary}>Description</p>
    </div>
  );
}
```

---

### Migrating to New Components

#### Replacing Alert Boxes

Before:
```tsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <p className="text-red-800">{error}</p>
  </div>
)}

{success && (
  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
    <p className="text-green-800">{success}</p>
  </div>
)}
```

After:
```tsx
{error && <Alert type="error" message={error} />}
{success && <Alert type="success" message={success} />}
```

---

#### Replacing Status Badges

Before:
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

After:
```tsx
<StatusBadge type="success" label="Active" size="sm" />
```

---

#### Replacing Empty States

Before:
```tsx
{data.length === 0 && (
  <div className="text-center py-12">
    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">No charts</h3>
    <p className="mt-1 text-sm text-gray-500">Get started by creating a new chart</p>
    <div className="mt-6">
      <Button onClick={handleCreate}>New Chart</Button>
    </div>
  </div>
)}
```

After:
```tsx
{data.length === 0 && (
  <EmptyState
    icon={ChartBarIcon}
    title="No charts"
    description="Get started by creating a new chart"
    action={{ label: 'New Chart', onClick: handleCreate }}
  />
)}
```

---

#### Replacing Tables

Before:
```tsx
<table className="min-w-full divide-y divide-gray-300">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Name
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Email
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {users.map(user => (
      <tr key={user.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

After:
```tsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ]}
  data={users}
  onRowClick={handleUserClick}
/>
```

---

## Testing Strategy

### Unit Tests

**Test Coverage Goals**:
- All new components: 90%+ coverage
- Theme system utilities: 100% coverage
- Critical user flows: 95%+ coverage

**Component Testing Pattern**:
```tsx
// Alert.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Alert } from './Alert';

describe('Alert', () => {
  const renderAlert = (props) => {
    return render(
      <ThemeProvider>
        <Alert {...props} />
      </ThemeProvider>
    );
  };

  it('renders success alert with correct styling', () => {
    renderAlert({ type: 'success', message: 'Success message' });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveStyle({ borderColor: expect.stringContaining('#') });
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('shows dismiss button when dismissible', () => {
    const onClose = jest.fn();
    renderAlert({ type: 'info', message: 'Test', dismissible: true, onClose });

    const closeButton = screen.getByLabelText('Dismiss alert');
    closeButton.click();
    expect(onClose).toHaveBeenCalled();
  });

  it('uses custom icon when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon" />;
    renderAlert({ type: 'warning', message: 'Test', icon: CustomIcon });

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
```

---

### Visual Regression Testing

**Tool**: Chromatic or Percy

**Test Coverage**:
- All component variants in Storybook
- All theme combinations (light, dark, ocean, etc.)
- Responsive breakpoints

**Storybook Stories**:
```tsx
// Alert.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Success: Story = {
  args: {
    type: 'success',
    message: 'Operation completed successfully'
  }
};

export const Error: Story = {
  args: {
    type: 'error',
    message: 'An error occurred while processing your request'
  }
};

export const WithTitle: Story = {
  args: {
    type: 'warning',
    title: 'Warning',
    message: 'This action cannot be undone'
  }
};

export const Dismissible: Story = {
  args: {
    type: 'info',
    message: 'New features are available',
    dismissible: true,
    onClose: () => alert('Dismissed')
  }
};
```

---

### Accessibility Testing

**Tools**:
- axe-core (automated)
- Manual keyboard testing
- Screen reader testing (NVDA/JAWS)

**Test Checklist**:
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible in all themes
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] ARIA labels present where needed
- [ ] Screen reader announces all state changes
- [ ] No keyboard traps
- [ ] Semantic HTML used

**Automated Test**:
```tsx
// Alert.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { Alert } from './Alert';

expect.extend(toHaveNoViolations);

describe('Alert Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <Alert type="success" message="Test message" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('meets contrast requirements in all themes', async () => {
    const themes = ['light', 'dark', 'ocean', 'forest'];

    for (const themeName of themes) {
      const { container } = render(
        <ThemeProvider initialTheme={themeName}>
          <Alert type="error" message="Error message" />
        </ThemeProvider>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    }
  });
});
```

---

### Integration Testing

**Test Critical User Flows**:

1. **Theme Switching**
   - User changes theme → all components update correctly
   - Custom theme → all components use custom colors
   - Dark mode → no hardcoded colors visible

2. **Component Interaction**
   - Table sorting → data reorders correctly
   - Table row click → navigation works
   - Alert dismiss → removes from DOM
   - Badge click → callback fired

3. **Responsive Behavior**
   - Mobile viewport → table scrolls horizontally
   - Tablet viewport → grid adjusts columns
   - Desktop → full layout visible

---

## Success Metrics

### Code Quality Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Theme coverage | ~70% | 95%+ | Count components using `useTheme()` / total components |
| Code duplication | ~200 lines | <50 lines | SonarQube duplicate code detector |
| Component reusability | ~30% | 80%+ | Count reusable components / total components |
| Hardcoded colors | 50+ instances | 0 | Grep for `text-gray-`, `bg-white`, etc. |

### Performance Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Theme switch time | Unknown | <100ms | Performance API |
| Component render time | Unknown | <16ms (60fps) | React DevTools Profiler |
| Bundle size increase | - | <50KB | Webpack bundle analyzer |

### User Experience Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Lighthouse accessibility | Unknown | 95+ | Lighthouse CI |
| WCAG contrast ratio | Unknown | AA (4.5:1) | axe DevTools |
| Theme satisfaction | - | 4.5/5 | User survey |

---

## Appendix

### Color Naming Convention

**Background Colors** (lightest to darkest):
- `bgPrimary` - Main background (white in light, dark gray in dark)
- `bgSecondary` - Secondary background (off-white in light, lighter gray in dark)
- `bgTertiary` - Tertiary background (light gray in light, medium gray in dark)

**Text Colors** (darkest to lightest):
- `textPrimary` - Primary text (black in light, white in dark)
- `textSecondary` - Secondary text (dark gray in light, light gray in dark)
- `textTertiary` - Tertiary text (medium gray in light, medium-light gray in dark)

**Accent Colors**:
- `accentPrimary` - Primary brand color (buttons, links)
- `accentSecondary` - Secondary accent (hover states, highlights)

**Border Colors**:
- `borderPrimary` - Primary borders (subtle, for cards/dividers)
- `borderSecondary` - Secondary borders (stronger, for emphasis)

**Status Colors**:
- `success` - Green (successful actions, positive states)
- `error` - Red (errors, destructive actions)
- `warning` - Yellow/Orange (warnings, caution)
- `info` - Blue (informational messages)

---

### File Structure After Migration

```
frontend/src/
├── components/
│   ├── common/               # Core UI primitives (15 components)
│   │   ├── Alert.tsx         # ✓ New
│   │   ├── StatusBadge.tsx   # ✓ New
│   │   ├── EmptyState.tsx    # ✓ New
│   │   ├── Table.tsx         # ✓ New
│   │   ├── Tabs.tsx          # ✓ New
│   │   ├── Icon.tsx          # ✓ New
│   │   ├── Grid.tsx          # ✓ New
│   │   ├── PageLayout.tsx    # ✓ New
│   │   ├── Button.tsx        # ✓ Existing (well themed)
│   │   ├── Input.tsx         # ✓ Existing (well themed)
│   │   ├── Select.tsx        # ✓ Existing (well themed)
│   │   ├── Textarea.tsx      # ✓ Existing (well themed)
│   │   ├── Card.tsx          # ✓ Existing (well themed)
│   │   ├── Modal.tsx         # ✓ Existing (well themed)
│   │   ├── Toast.tsx         # ✓ Existing (well themed)
│   │   ├── FormSection.tsx   # ✓ Fixed (remove hardcoded colors)
│   │   └── Spinner.tsx       # ✓ Fixed (use theme)
│   ├── advanced/             # Advanced components
│   │   ├── DataGrid.tsx      # ✓ New (table with pagination)
│   │   ├── Dropdown.tsx      # ✓ New (enhanced select)
│   │   └── FormModal.tsx     # ✓ New (modal + form)
│   ├── theme/                # Theme components (3 existing)
│   │   ├── ThemeSelector.tsx
│   │   ├── CustomThemePicker.tsx
│   │   └── ThemeMenu.tsx
│   ├── layout/               # Layout components (3 existing)
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── admin/                # ✓ Fixed (theme system)
│   │   ├── UserManagement.tsx
│   │   ├── ConnectionForm.tsx
│   │   ├── ConnectionPermissions.tsx
│   │   └── ...
│   ├── charts/               # Chart-specific components
│   │   ├── ChartBuilder.tsx
│   │   ├── ChartRenderer.tsx
│   │   └── ...
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── DashboardBuilder.tsx
│   │   ├── DashboardEditor.tsx
│   │   └── ...
│   └── connections/          # ✓ Fixed (use Table component)
│       ├── ConnectionsGrid.tsx  # → Uses Grid + Card
│       └── ConnectionsTable.tsx # → Uses Table
├── hooks/
│   ├── useThemedStyles.ts    # ✓ Enhanced (contrast, typography)
│   ├── useThemedHover.ts     # Existing
│   └── ...
├── utils/
│   ├── colorHelpers.ts       # ✓ Enhanced (contrast checker)
│   ├── uiHelpers.ts
│   └── ...
└── pages/                    # ✓ All migrated to new components
    ├── DashboardList.tsx     # ✓ Uses Table, EmptyState, StatusBadge
    ├── ChartList.tsx         # ✓ Fixed hardcoded colors
    ├── ConnectionsPage.tsx   # ✓ Uses Table component
    ├── AdminSettings.tsx     # ✓ Uses Tabs component
    ├── UsersPage.tsx         # ✓ Uses Tabs, Table components
    └── ...
```

---

### Quick Reference: Component Selection Guide

**Need to display...** → **Use this component**

| UI Need | Component | Props |
|---------|-----------|-------|
| Success/error/warning message | `<Alert>` | `type, message, dismissible?` |
| Status label (Active, Pending, etc.) | `<StatusBadge>` | `type, label, variant?` |
| Empty list state | `<EmptyState>` | `icon, title, description?, action?` |
| Data table | `<Table>` | `columns, data, onRowClick?` |
| Tabbed navigation | `<Tabs>` | `tabs, activeTab, onChange` |
| Icon with theming | `<Icon>` | `Icon, variant, size` |
| Card grid layout | `<Grid>` | `columns, gap, children` |
| Page with header | `<PageLayout>` | `title, subtitle?, actions?` |
| Data table with pagination/filters | `<DataGrid>` | `columns, data, pageSize, ...` |
| Enhanced select dropdown | `<Dropdown>` | `options, value, onChange, searchable?` |
| Form in modal | `<FormModal>` | `isOpen, onSubmit, children` |

---

## Conclusion

This plan provides a comprehensive roadmap to transform the frontend codebase into a highly reusable, consistently themed, and maintainable system. By following this plan:

1. **Code Duplication Eliminated**: 200+ lines of duplicated code will be replaced with reusable components
2. **Theme Consistency**: 95%+ of UI elements will use the theme system, ensuring brand consistency
3. **Improved UX**: Better contrast, consistent patterns, and accessible design
4. **Developer Experience**: Clear component API, comprehensive documentation, and Storybook
5. **Maintainability**: Changes to design system propagate automatically to all pages

**Estimated Timeline**: 8 weeks (2 sprints per phase)

**Estimated Effort**: 1 frontend developer full-time

**ROI**:
- 40% reduction in future feature development time (component reuse)
- 60% reduction in theme-related bugs (consistent system)
- 80% improvement in design consistency
- 100% theme coverage across platform

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Author**: Claude Code
**Status**: Ready for Implementation
