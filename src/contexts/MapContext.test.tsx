import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MapContextProvider, useMapContext } from './MapContext';
import type { FilterOptions, SortOption } from '@/lib/types';

// Mock the searchPropertiesWithFilter function
jest.mock('@/src/db/queries', () => ({
  searchPropertiesWithFilter: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    entries: () => []
  })
}));

// Mock the config
jest.mock('@/lib/config', () => ({
  ENABLE_MAP: true
}));

// Test component to access context
function TestComponent() {
  const {
    filterOptions,
    setFilterOptions,
    sortOption,
    setSortOption,
    catalog,
    fetchingListings,
    setReady,
    selectedProperty,
    setSelectedProperty
  } = useMapContext();

  return (
    <div>
      <div data-testid="map-state">
        <span data-testid="selected-property">{selectedProperty?.properties?.id || 'none'}</span>
        <span data-testid="fetching-listings">{fetchingListings.toString()}</span>
        <span data-testid="catalog-count">{catalog.length}</span>
        <span data-testid="sort-option">{sortOption}</span>
        <span data-testid="filter-options">{JSON.stringify(filterOptions)}</span>
      </div>
      <button onClick={() => setSelectedProperty({ properties: { id: 'prop1' } } as any)}>Set Selected</button>
      <button onClick={() => setReady(true)}>Set Ready</button>
      <button onClick={() => setSortOption('priceDesc' as SortOption)}>Set Sort Desc</button>
      <button onClick={() => setFilterOptions({
        ...filterOptions,
        priceRange: { min: 1000, max: 2000 }
      })}>Set Price Filter</button>
      <button onClick={() => setFilterOptions({
        ...filterOptions,
        bedrooms: 2,
        bathrooms: 1
      })}>Set Bedrooms and Bathrooms</button>
      <button onClick={() => setFilterOptions({
        ...filterOptions,
        propertyTypes: { apartment: true, house: false, condo: false, townhouse: false }
      })}>Set Property Types</button>
    </div>
  );
}

describe('MapContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default values', () => {
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    expect(screen.getByTestId('selected-property')).toHaveTextContent('none');
    expect(screen.getByTestId('fetching-listings')).toHaveTextContent('false');
    expect(screen.getByTestId('catalog-count')).toHaveTextContent('0');
    expect(screen.getByTestId('sort-option')).toHaveTextContent('priceAsc');
    expect(screen.getByTestId('filter-options').textContent).toContain('propertyTypes');
  });

  it('should update selected property state', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Selected'));
    
    expect(screen.getByTestId('selected-property')).toHaveTextContent('prop1');
  });

  it('should update sort option state', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Sort Desc'));
    
    expect(screen.getByTestId('sort-option')).toHaveTextContent('priceDesc');
  });

  it('should update price filter state', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Price Filter'));
    
    const filterOptions = screen.getByTestId('filter-options').textContent;
    expect(filterOptions).toContain('"min":1000');
    expect(filterOptions).toContain('"max":2000');
  });

  it('should update bedrooms and bathrooms filter', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Bedrooms and Bathrooms'));
    
    const filterOptions = screen.getByTestId('filter-options').textContent;
    expect(filterOptions).toContain('"bedrooms":2');
    expect(filterOptions).toContain('"bathrooms":1');
  });

  it('should update property types filter', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Property Types'));
    
    const filterOptions = screen.getByTestId('filter-options').textContent;
    expect(filterOptions).toContain('"apartment":true');
    expect(filterOptions).toContain('"house":false');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useMapContext must be used within a MapContextProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide context to nested components', () => {
    function NestedComponent() {
      const { sortOption, fetchingListings } = useMapContext();
      return (
        <div>
          <span data-testid="nested-sort">{sortOption}</span>
          <span data-testid="nested-fetching">{fetchingListings.toString()}</span>
        </div>
      );
    }

    render(
      <MapContextProvider>
        <div>
          <NestedComponent />
        </div>
      </MapContextProvider>
    );

    expect(screen.getByTestId('nested-sort')).toHaveTextContent('priceAsc');
    expect(screen.getByTestId('nested-fetching')).toHaveTextContent('false');
  });

  it('should handle multiple state updates', async () => {
    const user = userEvent.setup();
    
    render(
      <MapContextProvider>
        <TestComponent />
      </MapContextProvider>
    );

    await user.click(screen.getByText('Set Sort Desc'));
    await user.click(screen.getByText('Set Price Filter'));
    await user.click(screen.getByText('Set Selected'));

    expect(screen.getByTestId('sort-option')).toHaveTextContent('priceDesc');
    expect(screen.getByTestId('selected-property')).toHaveTextContent('prop1');
    
    const filterOptions = screen.getByTestId('filter-options').textContent;
    expect(filterOptions).toContain('"min":1000');
  });

  it('should handle clearing selected property', async () => {
    const user = userEvent.setup();
    
    function ClearTestComponent() {
      const { selectedProperty, setSelectedProperty } = useMapContext();
      
      return (
        <div>
          <span data-testid="selected-status">{selectedProperty ? 'selected' : 'none'}</span>
          <button onClick={() => setSelectedProperty({ properties: { id: 'prop1' } } as any)}>
            Set Property
          </button>
          <button onClick={() => setSelectedProperty(null)}>
            Clear Property
          </button>
        </div>
      );
    }

    render(
      <MapContextProvider>
        <ClearTestComponent />
      </MapContextProvider>
    );

    // Set property
    await user.click(screen.getByText('Set Property'));
    expect(screen.getByTestId('selected-status')).toHaveTextContent('selected');

    // Clear property
    await user.click(screen.getByText('Clear Property'));
    expect(screen.getByTestId('selected-status')).toHaveTextContent('none');
  });
}); 