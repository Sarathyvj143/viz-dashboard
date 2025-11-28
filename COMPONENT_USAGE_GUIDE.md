# Component Usage Guide - Quick Start

## New Reusable Components Available

This guide provides quick examples for using the new reusable components in your development.

---

## Alert Component

**Import**:
```tsx
import Alert from '../components/common/Alert';
```

**Replace hardcoded alert boxes**:

❌ **Old way** (hardcoded):
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

✅ **New way** (themed):
```tsx
{error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} />}
{success && <Alert type="success" message={success} dismissible onClose={() => setSuccess(null)} />}
```

**All variants**:
```tsx
<Alert type="success" message="Operation successful!" />
<Alert type="error" message="Something went wrong" />
<Alert type="warning" message="Please review before continuing" />
<Alert type="info" message="New features available" />

// With title
<Alert type="warning" title="Warning" message="This action cannot be undone" />

// Dismissible
<Alert type="info" message="Tip of the day" dismissible onClose={handleClose} />
```

---

## StatusBadge Component

**Import**:
```tsx
import StatusBadge from '../components/common/StatusBadge';
```

**Replace hardcoded badges**:

❌ **Old way** (hardcoded):
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
  {status}
</span>

<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Active
</span>
```

✅ **New way** (themed):
```tsx
<StatusBadge label={status} type="info" size="sm" />
<StatusBadge label="Active" type="success" />
```

**All variants**:
```tsx
// Types
<StatusBadge label="Success" type="success" />
<StatusBadge label="Error" type="error" />
<StatusBadge label="Warning" type="warning" />
<StatusBadge label="Info" type="info" />
<StatusBadge label="Neutral" type="neutral" />

// Sizes
<StatusBadge label="Small" size="sm" />
<StatusBadge label="Medium" size="md" />
<StatusBadge label="Large" size="lg" />

// Variants
<StatusBadge label="Solid" variant="solid" type="success" />
<StatusBadge label="Outline" variant="outline" type="info" />
<StatusBadge label="Subtle" variant="subtle" type="warning" />

// With icon
import { CheckCircleIcon } from '@heroicons/react/24/outline';
<StatusBadge label="Verified" type="success" icon={CheckCircleIcon} />

// Interactive
<StatusBadge label="Click me" type="info" onClick={handleClick} />
```

---

## Icon Component

**Import**:
```tsx
import Icon from '../components/common/Icon';
import { ChartBarIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
```

**Replace direct icon usage**:

❌ **Old way** (hardcoded):
```tsx
<ChartBarIcon className="w-5 h-5 text-gray-400" />
<TrashIcon className="w-4 h-4 text-red-600" />
<PencilIcon className="w-6 h-6 text-blue-500" />
```

✅ **New way** (themed):
```tsx
<Icon Icon={ChartBarIcon} variant="secondary" size="md" />
<Icon Icon={TrashIcon} variant="error" size="sm" />
<Icon Icon={PencilIcon} variant="accent" size="lg" />
```

**All variants**:
```tsx
// Color variants (respects theme)
<Icon Icon={UserIcon} variant="primary" />    // textPrimary color
<Icon Icon={UserIcon} variant="secondary" />  // textSecondary color
<Icon Icon={UserIcon} variant="tertiary" />   // textTertiary color
<Icon Icon={UserIcon} variant="accent" />     // accentPrimary color
<Icon Icon={UserIcon} variant="success" />    // success color
<Icon Icon={UserIcon} variant="error" />      // error color
<Icon Icon={UserIcon} variant="warning" />    // warning color
<Icon Icon={UserIcon} variant="info" />       // info color

// Sizes
<Icon Icon={StarIcon} size="xs" />  // 12px
<Icon Icon={StarIcon} size="sm" />  // 16px
<Icon Icon={StarIcon} size="md" />  // 20px
<Icon Icon={StarIcon} size="lg" />  // 24px
<Icon Icon={StarIcon} size="xl" />  // 32px

// Custom color override
<Icon Icon={HeartIcon} color="#FF0000" />
```

---

## EmptyState Component

**Import**:
```tsx
import EmptyState from '../components/common/EmptyState';
import { ChartBarIcon } from '@heroicons/react/24/outline';
```

**Replace hardcoded empty states**:

❌ **Old way** (hardcoded):
```tsx
{data.length === 0 && (
  <div className="text-center py-12">
    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">No charts</h3>
    <p className="mt-1 text-sm text-gray-500">Get started by creating a new chart.</p>
    <div className="mt-6">
      <Button onClick={handleCreate}>Create Chart</Button>
    </div>
  </div>
)}
```

✅ **New way** (themed):
```tsx
{data.length === 0 && (
  <EmptyState
    icon={ChartBarIcon}
    title="No charts"
    description="Get started by creating a new chart."
    action={{ label: 'Create Chart', onClick: handleCreate }}
  />
)}
```

**All variants**:
```tsx
// With action button
<EmptyState
  icon={DatabaseIcon}
  title="No connections"
  description="Add your first database connection to get started"
  action={{ label: 'Add Connection', onClick: handleAdd }}
/>

// Without action button
<EmptyState
  icon={UserIcon}
  title="No users found"
  description="Try adjusting your search filters"
/>

// Without description
<EmptyState
  icon={InboxIcon}
  title="No messages"
/>
```

---

## Table Component

**Import**:
```tsx
import Table, { Column } from '../components/common/Table';
```

**Replace custom table implementations**:

❌ **Old way** (hardcoded):
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

✅ **New way** (themed):
```tsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ]}
  data={users}
  onRowClick={handleRowClick}
/>
```

**Advanced usage**:
```tsx
// Define columns with TypeScript
const columns: Column<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    render: (user) => (
      <StatusBadge
        label={user.active ? 'Active' : 'Inactive'}
        type={user.active ? 'success' : 'neutral'}
      />
    )
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (user) => (
      <Button size="sm" onClick={(e) => {
        e.stopPropagation();
        handleEdit(user.id);
      }}>
        Edit
      </Button>
    )
  }
];

<Table
  columns={columns}
  data={users}
  onRowClick={handleRowClick}
  loading={isLoading}
  defaultSortKey="name"
  defaultSortDirection="asc"
  emptyState={
    <EmptyState
      icon={UserIcon}
      title="No users"
      description="Add your first user"
      action={{ label: 'Add User', onClick: handleAdd }}
    />
  }
/>
```

---

## Tabs Component

**Import**:
```tsx
import Tabs, { Tab } from '../components/common/Tabs';
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
```

**Replace custom tab implementations**:

❌ **Old way** (hardcoded):
```tsx
<div className="border-b border-gray-200">
  <div className="flex gap-4">
    <button
      className={`px-4 py-2 border-b-2 ${
        activeTab === 'users'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500'
      }`}
      onClick={() => setActiveTab('users')}
    >
      Users
    </button>
    <button
      className={`px-4 py-2 border-b-2 ${
        activeTab === 'roles'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500'
      }`}
      onClick={() => setActiveTab('roles')}
    >
      Roles
    </button>
  </div>
</div>
```

✅ **New way** (themed):
```tsx
<Tabs
  tabs={[
    { id: 'users', label: 'Users' },
    { id: 'roles', label: 'Roles' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

**All variants**:
```tsx
// Underline variant (default)
<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="underline"
/>

// Pills variant
<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="pills"
/>

// Enclosed variant (like browser tabs)
<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  variant="enclosed"
/>

// With icons
<Tabs
  tabs={[
    { id: 'users', label: 'Users', icon: UserIcon },
    { id: 'roles', label: 'Roles', icon: ShieldCheckIcon }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>

// With badges (counts)
<Tabs
  tabs={[
    { id: 'users', label: 'Users', badge: 24 },
    { id: 'pending', label: 'Pending', badge: 5 }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>

// With icons and badges
<Tabs
  tabs={[
    { id: 'users', label: 'Users', icon: UserIcon, badge: 24 },
    { id: 'roles', label: 'Roles', icon: ShieldCheckIcon, badge: 3 }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

---

## Typography Scale (useThemedStyles)

**Import**:
```tsx
import { useThemedStyles } from '../hooks/useThemedStyles';
```

**Replace hardcoded text styles**:

❌ **Old way** (hardcoded):
```tsx
<h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-xl font-semibold text-gray-900">Section Title</h2>
<p className="text-base text-gray-900">Body text</p>
<p className="text-sm text-gray-600">Secondary text</p>
<span className="text-xs text-gray-500">Caption</span>
```

✅ **New way** (themed):
```tsx
const styles = useThemedStyles();

<h1 style={styles.typography.h1}>Page Title</h1>
<h2 style={styles.typography.h2}>Section Title</h2>
<p style={styles.typography.body}>Body text</p>
<p style={styles.typography.bodySecondary}>Secondary text</p>
<span style={styles.typography.caption}>Caption</span>
```

**All typography variants**:
```tsx
const styles = useThemedStyles();

// Headings
<h1 style={styles.typography.h1}>Heading 1</h1>  // 2rem, 700 weight
<h2 style={styles.typography.h2}>Heading 2</h2>  // 1.5rem, 600 weight
<h3 style={styles.typography.h3}>Heading 3</h3>  // 1.25rem, 600 weight
<h4 style={styles.typography.h4}>Heading 4</h4>  // 1.125rem, 600 weight

// Body text
<p style={styles.typography.body}>Body text (primary)</p>  // 1rem, textPrimary
<p style={styles.typography.bodySecondary}>Body text (secondary)</p>  // 1rem, textSecondary

// Small text
<span style={styles.typography.small}>Small text (primary)</span>  // 0.875rem, textPrimary
<span style={styles.typography.smallSecondary}>Small text (secondary)</span>  // 0.875rem, textSecondary

// Caption text (helpers, hints)
<span style={styles.typography.caption}>Caption text</span>  // 0.75rem, textSecondary

// Labels (form labels)
<label style={styles.typography.label}>Form Label</label>  // 0.875rem, 500 weight
```

---

## Theme Colors (Direct Usage)

**Import**:
```tsx
import { useTheme } from '../contexts/ThemeContext';
```

**Replace hardcoded colors**:

❌ **Old way** (hardcoded):
```tsx
<div className="bg-white border border-gray-200">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Description</p>
</div>
```

✅ **New way** (themed):
```tsx
const { theme } = useTheme();

<div style={{
  backgroundColor: theme.colors.bgPrimary,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: theme.colors.borderPrimary
}}>
  <h3 style={{ color: theme.colors.textPrimary }}>Title</h3>
  <p style={{ color: theme.colors.textSecondary }}>Description</p>
</div>
```

**Available theme colors**:
```tsx
const { theme } = useTheme();

// Backgrounds (light to dark)
theme.colors.bgPrimary      // Main background
theme.colors.bgSecondary    // Secondary background
theme.colors.bgTertiary     // Tertiary background

// Text colors (dark to light)
theme.colors.textPrimary    // Primary text
theme.colors.textSecondary  // Secondary text
theme.colors.textTertiary   // Tertiary text

// Accent colors
theme.colors.accentPrimary    // Primary brand color
theme.colors.accentSecondary  // Secondary accent

// Borders
theme.colors.borderPrimary    // Primary borders
theme.colors.borderSecondary  // Secondary borders

// Status colors
theme.colors.success  // Green
theme.colors.error    // Red
theme.colors.warning  // Yellow/Orange
theme.colors.info     // Blue
```

---

## Status Styles (useThemedStyles)

**Import**:
```tsx
import { useThemedStyles } from '../hooks/useThemedStyles';
```

**Usage**:
```tsx
const styles = useThemedStyles();

// Success box
<div style={{
  backgroundColor: styles.status.success.background,
  borderColor: styles.status.success.border,
  borderWidth: '1px',
  borderStyle: 'solid'
}}>
  <p style={{ color: styles.status.success.text }}>Success message</p>
</div>

// Error box
<div style={{
  backgroundColor: styles.status.error.background,
  borderColor: styles.status.error.border,
  borderWidth: '1px',
  borderStyle: 'solid'
}}>
  <p style={{ color: styles.status.error.text }}>Error message</p>
</div>

// Warning box
<div style={{
  backgroundColor: styles.status.warning.background,
  borderColor: styles.status.warning.border,
  borderWidth: '1px',
  borderStyle: 'solid'
}}>
  <p style={{ color: styles.status.warning.text }}>Warning message</p>
</div>

// Info box
<div style={{
  backgroundColor: styles.status.info.background,
  borderColor: styles.status.info.border,
  borderWidth: '1px',
  borderStyle: 'solid'
}}>
  <p style={{ color: styles.status.info.text }}>Info message</p>
</div>
```

---

## Migration Checklist

When updating a component to use the new system:

### 1. Replace Hardcoded Alert Boxes
- [ ] Replace `bg-red-50`, `border-red-200`, `text-red-800` → `<Alert type="error" />`
- [ ] Replace `bg-green-50`, `border-green-200`, `text-green-800` → `<Alert type="success" />`
- [ ] Replace `bg-yellow-50`, `border-yellow-200`, `text-yellow-800` → `<Alert type="warning" />`
- [ ] Replace `bg-blue-50`, `border-blue-200`, `text-blue-800` → `<Alert type="info" />`

### 2. Replace Hardcoded Badges
- [ ] Replace `bg-blue-100 text-blue-800` → `<StatusBadge type="info" />`
- [ ] Replace `bg-green-100 text-green-800` → `<StatusBadge type="success" />`
- [ ] Replace `bg-red-100 text-red-800` → `<StatusBadge type="error" />`
- [ ] Replace `bg-yellow-100 text-yellow-800` → `<StatusBadge type="warning" />`

### 3. Replace Direct Icon Usage
- [ ] Replace `<Icon className="text-gray-400" />` → `<Icon Icon={Icon} variant="secondary" />`
- [ ] Replace `<Icon className="text-red-600" />` → `<Icon Icon={Icon} variant="error" />`
- [ ] Replace `<Icon className="text-blue-500" />` → `<Icon Icon={Icon} variant="accent" />`

### 4. Replace Empty States
- [ ] Replace custom empty state JSX → `<EmptyState />`

### 5. Replace Text Colors
- [ ] Replace `text-gray-900` → `theme.colors.textPrimary` or `styles.typography.h*`
- [ ] Replace `text-gray-600` → `theme.colors.textSecondary` or `styles.typography.bodySecondary`
- [ ] Replace `text-gray-500` → `theme.colors.textSecondary`

### 6. Replace Background Colors
- [ ] Replace `bg-white` → `theme.colors.bgPrimary`
- [ ] Replace `bg-gray-50` → `theme.colors.bgSecondary`
- [ ] Replace `bg-gray-100` → `theme.colors.bgTertiary`

### 7. Replace Border Colors
- [ ] Replace `border-gray-200` → `theme.colors.borderPrimary`
- [ ] Replace `border-gray-300` → `theme.colors.borderSecondary`

---

## Testing Your Changes

After migrating to the new components:

1. **Test in Light Theme**:
   - Navigate to your updated page
   - Verify all components display correctly
   - Check contrast is good

2. **Test in Dark Theme**:
   - Switch to dark theme in settings
   - Navigate to your updated page
   - Verify no white backgrounds appear
   - Verify all text is readable

3. **Test in Other Themes**:
   - Try ocean, forest, sunset themes
   - Verify components adapt to theme colors

4. **Test Custom Theme**:
   - Create a custom theme with unusual colors
   - Verify components still look good

---

## Common Mistakes to Avoid

❌ **Don't mix hardcoded and themed styles**:
```tsx
// BAD - mixing hardcoded with theme
<div className="bg-white" style={{ borderColor: theme.colors.borderPrimary }}>
```

✅ **Do use theme for everything**:
```tsx
// GOOD - fully themed
<div style={{
  backgroundColor: theme.colors.bgPrimary,
  borderColor: theme.colors.borderPrimary
}}>
```

---

❌ **Don't use Tailwind color classes**:
```tsx
// BAD
<div className="text-gray-900 bg-white border-gray-200">
```

✅ **Do use theme colors**:
```tsx
// GOOD
<div style={{
  color: theme.colors.textPrimary,
  backgroundColor: theme.colors.bgPrimary,
  borderColor: theme.colors.borderPrimary
}}>
```

---

❌ **Don't hardcode alert boxes**:
```tsx
// BAD
<div className="p-4 bg-red-50 border border-red-200">
  <p className="text-red-800">{error}</p>
</div>
```

✅ **Do use Alert component**:
```tsx
// GOOD
<Alert type="error" message={error} />
```

---

## Need Help?

- **Full Plan**: See `FRONTEND_REUSABILITY_AND_THEME_IMPROVEMENT_PLAN.md`
- **Implementation Summary**: See `PHASE1_REUSABILITY_IMPLEMENTATION_COMPLETE.md`
- **Component Specs**: In the full plan document
- **TypeScript Types**: All components have full TypeScript type definitions

---

**Last Updated**: 2025-11-20
**Version**: 1.0
