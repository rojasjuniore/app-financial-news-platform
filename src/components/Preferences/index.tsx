/**
 * @index Preferences Components
 * @tags PREFERENCES_INDEX, COMPONENT_EXPORTS, AUTOCOMPLETE_COMPONENTS, MARKET_EXPLORER
 * @search PREFERENCES_COMPONENTS, AUTOCOMPLETE_EXPORTS, COMPONENT_INDEX, DATA_EXPLORER
 * @keywords preferences-index, autocomplete-exports, component-library, market-data
 * @description Central export hub for all Preference-related components
 */

export { default as AutocompleteInput } from './AutocompleteInput';
export { default as AutocompleteInputAPI } from './AutocompleteInputAPI';
export { default as MarketDataExplorer } from './MarketDataExplorer';

// @tag COMPONENT_REGISTRY
// @search PREFERENCE_COMPONENTS, AUTOCOMPLETE_REGISTRY, MARKET_COMPONENTS
export const PreferenceComponents = {
  AutocompleteInput: 'AutocompleteInput',
  AutocompleteInputAPI: 'AutocompleteInputAPI',
  MarketDataExplorer: 'MarketDataExplorer'
};

// @tag COMPONENT_DESCRIPTIONS
// @search COMPONENT_INFO, PREFERENCE_METADATA
export const ComponentDescriptions = {
  AutocompleteInput: 'Static autocomplete with fuzzy search and multi-select',
  AutocompleteInputAPI: 'API-powered autocomplete with real-time market data',
  MarketDataExplorer: 'Advanced market data explorer with 5000+ instruments'
};