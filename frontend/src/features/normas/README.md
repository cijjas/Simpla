# Normas Feature - Context Architecture

## Overview

The Normas feature now uses a comprehensive React Context system for elegant state management across all components. This architecture provides centralized state management, caching, and consistent data flow.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NormasProvider                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NormasContext                          │   │
│  │  • Search State & Results                          │   │
│  │  • Filter Options & Current Filters                │   │
│  │  • Statistics                                      │   │
│  │  • Norma Cache (Details & Summaries)              │   │
│  │  • UI State (Selected Norma, View Mode)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks                            │
│  • useNormasSearch() - Search & pagination                 │
│  • useNormasFilters() - Filter management                  │
│  • useNormasStats() - Statistics                           │
│  • useNormaDetail() - Individual norma details             │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Components                               │
│  • NormasFilter - Filter UI                                │
│  • NormasList - Results display                            │
│  • NormasStats - Statistics display                        │
│  • NormaDetailPage - Individual norma view                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 🎯 **Centralized State Management**
- All normas-related state in one place
- Consistent data flow across components
- No prop drilling

### 🚀 **Intelligent Caching**
- Automatic caching of norma details and summaries
- Prevents duplicate API calls
- Improved performance and user experience

### 🔄 **Automatic Data Loading**
- Filter options load automatically
- Statistics load on demand
- Search triggers automatically when filters change

### 🎨 **Elegant Component API**
- Components are self-contained
- No complex prop passing
- Clean, readable code

## Usage

### 1. **Setup Provider**

Wrap your normas pages with the `NormasProvider`:

```tsx
import { NormasProvider } from '@/features/normas';

function App() {
  return (
    <NormasProvider>
      <NormasPage />
    </NormasProvider>
  );
}
```

Or use the layout component:

```tsx
import { NormasLayout } from '@/features/normas';

function NormasPage() {
  return (
    <NormasLayout>
      <NormasFilter />
      <NormasList />
      <NormasStats />
    </NormasLayout>
  );
}
```

### 2. **Using Custom Hooks**

#### Search Hook
```tsx
import { useNormasSearch } from '@/features/normas';

function MyComponent() {
  const {
    results,
    loading,
    error,
    hasResults,
    totalCount,
    handlePageChange
  } = useNormasSearch();

  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {hasResults && (
        <div>
          Found {totalCount} normas
          <ResultsList results={results} />
          <Pagination onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
```

#### Filters Hook
```tsx
import { useNormasFilters } from '@/features/normas';

function FilterComponent() {
  const {
    filterOptions,
    currentFilters,
    handleFilterChange,
    clearAllFilters,
    hasActiveFilters
  } = useNormasFilters();

  return (
    <div>
      <Select onValueChange={(value) => handleFilterChange('jurisdiccion', value)}>
        {filterOptions?.jurisdicciones.map(j => (
          <SelectItem key={j} value={j}>{j}</SelectItem>
        ))}
      </Select>
      {hasActiveFilters && (
        <Button onClick={clearAllFilters}>Clear All</Button>
      )}
    </div>
  );
}
```

#### Stats Hook
```tsx
import { useNormasStats } from '@/features/normas';

function StatsComponent() {
  const {
    stats,
    loading,
    totalNormas,
    normasByJurisdiction
  } = useNormasStats();

  return (
    <div>
      {loading ? <Spinner /> : (
        <div>
          <h3>Total Normas: {totalNormas}</h3>
          <JurisdictionChart data={normasByJurisdiction} />
        </div>
      )}
    </div>
  );
}
```

### 3. **Direct Context Access**

For advanced use cases, access the context directly:

```tsx
import { useNormas } from '@/features/normas';

function AdvancedComponent() {
  const {
    state,
    searchNormas,
    getNorma,
    clearCache,
    setSelectedNorma
  } = useNormas();

  const handleCustomAction = async () => {
    // Custom logic using context methods
    const norma = await getNorma(123); // 123 is the infoleg_id
    setSelectedNorma(norma?.infoleg_id || null);
  };

  return (
    <div>
      <p>Cache size: {state.normaCache.size}</p>
      <Button onClick={handleCustomAction}>Custom Action</Button>
    </div>
  );
}
```

## State Structure

### NormasState
```typescript
interface NormasState {
  // Search and listing
  searchResults: NormaSearchResponse | null;
  searchLoading: boolean;
  searchError: string | null;
  filters: NormaFilters;
  
  // Filter options
  filterOptions: NormaFilterOptions | null;
  filterOptionsLoading: boolean;
  filterOptionsError: string | null;
  
  // Statistics
  stats: NormaStats | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Cache for individual normas
  normaCache: Map<number, NormaDetail>;
  normaSummaryCache: Map<number, NormaSummary>;
  
  // UI state
  selectedNormaId: number | null;
  viewMode: 'grid' | 'list';
}
```

## Benefits

### ✅ **Performance**
- Intelligent caching reduces API calls
- Automatic loading states
- Optimized re-renders

### ✅ **Developer Experience**
- Clean, self-contained components
- No complex prop management
- Type-safe with full TypeScript support

### ✅ **User Experience**
- Consistent loading states
- Automatic data synchronization
- Smooth navigation between views

### ✅ **Maintainability**
- Centralized state logic
- Easy to add new features
- Clear separation of concerns

## Migration Guide

### Before (Props-based)
```tsx
// Old way - lots of props
<NormasFilter
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onSearch={handleSearch}
  loading={loading}
/>

<NormasList
  data={searchResults}
  loading={loading}
  onPageChange={handlePageChange}
/>
```

### After (Context-based)
```tsx
// New way - clean and simple
<NormasFilter />
<NormasList />
```

## Best Practices

1. **Always wrap with Provider**: Use `NormasProvider` or `NormasLayout`
2. **Use custom hooks**: Prefer `useNormasSearch()`, `useNormasFilters()`, etc.
3. **Leverage caching**: The context automatically caches data
4. **Handle loading states**: All hooks provide loading states
5. **Error handling**: All hooks provide error states

## File Structure

```
frontend/src/features/normas/
├── contexts/
│   └── normas-context.tsx          # Main context and provider
├── hooks/
│   ├── index.ts                    # Hook exports
│   ├── use-norma-detail.ts         # Individual norma details
│   ├── use-normas-filters.ts       # Filter management
│   ├── use-normas-search.ts        # Search and pagination
│   └── use-normas-stats.ts         # Statistics
├── components/
│   ├── normas-filter.tsx           # Filter UI
│   ├── normas-list.tsx             # Results list
│   ├── normas-stats.tsx            # Statistics display
│   └── normas-layout.tsx           # Layout wrapper
├── pages/
│   ├── normas-page.tsx             # Main search page
│   └── norma-detail-page.tsx       # Individual norma page
├── api/
│   └── normas-api.ts               # API service
└── index.ts                        # Main exports
```

This architecture provides a solid foundation for the normas feature with excellent performance, maintainability, and developer experience.
