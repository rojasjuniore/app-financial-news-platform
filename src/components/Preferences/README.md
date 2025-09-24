# Preferences Components Directory

## 🔍 Search Tags & Keywords

### Quick Search Terms
- **Components**: `AUTOCOMPLETE`, `PREFERENCES_COMPONENT`, `TICKER_SELECTION`
- **API Integration**: `API_AUTOCOMPLETE`, `MARKET_DATA_SEARCH`, `FINANCIAL_API_INPUT`
- **Features**: `FUZZY_SEARCH`, `MULTI_SELECT`, `DEBOUNCED_SEARCH`

### File Lookup Table

| Component | Search Tags | Description |
|-----------|------------|-------------|
| `AutocompleteInput.tsx` | AUTOCOMPLETE_INPUT, TICKER_SEARCH | Static autocomplete with fuzzy search |
| `AutocompleteInputAPI.tsx` | API_AUTOCOMPLETE, MARKET_DATA_INPUT | API-powered real-time autocomplete |
| `index.tsx` | PREFERENCES_INDEX, COMPONENT_EXPORTS | Central export hub |

### Common Search Patterns

```bash
# Find all autocomplete components
grep -r "AUTOCOMPLETE" .

# Find API-integrated components
grep -r "API_AUTOCOMPLETE" .

# Find ticker selection components
grep -r "TICKER_SELECTION" .

# Find all preference components
grep -r "PREFERENCES_COMPONENT" .
```

## 📦 Component Registry

### AutocompleteInput
- **Tags**: `AUTOCOMPLETE`, `SEARCH_INPUT`, `TICKER_SELECTION`
- **Purpose**: Static autocomplete with local data
- **Features**: Fuzzy search, multi-select, keyboard navigation

### AutocompleteInputAPI
- **Tags**: `API_AUTOCOMPLETE`, `MARKET_DATA_SEARCH`
- **Purpose**: Dynamic autocomplete with backend API
- **Features**: Real-time search, debouncing, loading states

## 🎯 Usage Examples

### Import Components
```tsx
// Import individual components
import { AutocompleteInput, AutocompleteInputAPI } from '@/components/Preferences';

// Or import specific component
import AutocompleteInput from '@/components/Preferences/AutocompleteInput';
```

### Quick Component Lookup
```tsx
// Use the component registry
import { PreferenceComponents } from '@/components/Preferences';
console.log(PreferenceComponents.AutocompleteInput); // "AutocompleteInput"
```

## 🔗 Related Files

- **Backend API**: `/api-financial-news-platform/routes/marketDataRoutes.js`
  - Tags: `MARKET_DATA_API`, `TICKER_ENDPOINT`, `FINANCIAL_ENDPOINTS`

- **Frontend Service**: `/app-financial-news-app/src/services/marketDataService.ts`
  - Tags: `MARKET_DATA_SERVICE`, `API_CLIENT`

- **Main Preferences Page**: `/app-financial-news-app/src/pages/Preferences.tsx`
  - Tags: `PREFERENCES_PAGE`, `USER_SETTINGS`

## 🔍 VS Code Search Tips

1. **Quick Open** (Cmd/Ctrl + P):
   - Type `AutocompleteInput` to find component
   - Type `@tag AUTOCOMPLETE` to find tagged sections

2. **Symbol Search** (Cmd/Ctrl + Shift + O):
   - Search for `@component` to find all components
   - Search for `@tag` to find all tagged sections

3. **Global Search** (Cmd/Ctrl + Shift + F):
   - Use regex: `@(tag|search|keywords).*AUTOCOMPLETE`
   - Search tags: `PREFERENCES_COMPONENT|API_AUTOCOMPLETE`

## 📚 Component Documentation

Each component file contains:
- `@component` - Component name
- `@tags` - Searchable tags
- `@search` - Search keywords
- `@keywords` - Alternative search terms
- `@description` - Component purpose

Use these tags for quick navigation and discovery!