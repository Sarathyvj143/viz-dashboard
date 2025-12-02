# Chart Builder Prototype Components

This directory contains prototype components for the **Virtual Datasets** feature. These components demonstrate the intended UI/UX but are **not yet functional** because they require backend API support.

## Status: PROTOTYPES (Not Production-Ready)

⚠️ **These components are UI mockups only.** They will show "not implemented" messages when users try to use them.

## Components

### 1. DatasetSelector.tsx
**Purpose**: Allows users to select an existing dataset (physical or virtual) or create a new virtual dataset.

**Status**:
- ✅ UI/UX complete
- ❌ Backend integration pending
- ❌ Cannot actually load dataset previews

**Required Backend**:
- `GET /api/datasets/{id}` - Get dataset with column schema
- `GET /api/datasets/{id}/preview` - Get preview rows

### 2. VirtualDatasetModal.tsx
**Purpose**: Modal for creating virtual datasets using SQL queries.

**Status**:
- ✅ UI/UX complete
- ❌ Backend integration pending
- ❌ Cannot execute or validate SQL queries

**Required Backend**:
- `POST /api/virtual-datasets/execute` - Execute SQL query
- `POST /api/virtual-datasets/validate` - Validate SQL syntax
- `POST /api/virtual-datasets` - Save virtual dataset

**Future Enhancements**:
- Monaco Editor for SQL syntax highlighting
- Autocomplete for table/column names
- Query history

### 3. VirtualTableSchemaEditor.tsx
**Purpose**: Allows editing column names and data types for virtual datasets.

**Status**:
- ✅ UI/UX complete
- ✅ Local editing functional
- ❌ Cannot persist schema changes

**Required Backend**:
- `PUT /api/virtual-datasets/{id}/schema` - Update column schema

## Integration Roadmap

### Phase 1: Backend API Development
1. Create database model for `VirtualDataset`
2. Implement SQL execution service with security checks
3. Create API endpoints (see Required Backend sections above)
4. Add query validation logic

**Estimated Effort**: 16-20 hours backend work

### Phase 2: Frontend Integration
1. Create `frontend/src/api/virtualDatasets.ts` API client
2. Create `frontend/src/store/virtualDatasetStore.ts` Zustand store
3. Replace all "not implemented" messages with real API calls
4. Add comprehensive error handling
5. Write integration tests

**Estimated Effort**: 12-16 hours frontend work

### Phase 3: ChartBuilder Integration
1. Refactor ChartBuilder.tsx into step-based wizard
2. Integrate DatasetSelector as Step 1
3. Extract chart configuration into separate component
4. Reduce ChartBuilder from 788 lines to <300 lines

**Estimated Effort**: 8-10 hours

### Phase 4: Testing & Polish
1. End-to-end tests for virtual dataset workflow
2. Performance optimization
3. Accessibility improvements
4. Documentation updates

**Estimated Effort**: 8-10 hours

**Total Effort**: 44-56 hours

## Why These Are Prototypes

These components were created to:
1. Get stakeholder approval on UI/UX before backend work
2. Demonstrate the "Ultimate Chart Builder" vision
3. Validate user workflows and interactions

The plan was always to complete backend integration in a future sprint. However, priorities changed and the integration work was deferred. Rather than remove these components, we've organized them as prototypes with clear documentation.

## Usage (When Backend Is Ready)

Once backend APIs are implemented, these components can be used like this:

```typescript
import { DatasetSelector } from './components/charts/prototypes/DatasetSelector';
import { VirtualDatasetModal } from './components/charts/prototypes/VirtualDatasetModal';

function ChartBuilderWizard() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [showVirtualModal, setShowVirtualModal] = useState(false);

  return (
    <>
      <DatasetSelector
        onDatasetSelect={(ds) => {
          setDataset(ds);
          // Proceed to next step
        }}
        onCreateVirtual={() => setShowVirtualModal(true)}
      />

      <VirtualDatasetModal
        isOpen={showVirtualModal}
        onClose={() => setShowVirtualModal(false)}
        onSave={(virtualDataset) => {
          // Convert to Dataset and proceed
          setDataset(convertToDataset(virtualDataset));
          setShowVirtualModal(false);
        }}
      />
    </>
  );
}
```

## Contributing

If you're implementing the Virtual Datasets feature:

1. Read the full spec: `specs/fix-chart-builder-prototype-integration.md`
2. Start with backend API implementation
3. Update these components to remove "not implemented" messages
4. Add proper error handling and loading states
5. Write comprehensive tests
6. Update this README to remove "PROTOTYPES" status

## Questions?

Contact the frontend team lead or check the spec document for detailed implementation guidance.
