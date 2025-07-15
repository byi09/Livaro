import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn(() => Promise.resolve({ data: null }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    })),
    insert: jest.fn(() => Promise.resolve({ error: null }))
  }))
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

describe('useAutoSave', () => {
  const mockOnSaveSuccess = jest.fn();
  const mockOnSaveError = jest.fn();
  const mockFormData = { 
    property_name: 'Test Property', 
    monthly_rent: 1000,
    description: 'Test description'
  };

  const defaultOptions = {
    propertyId: 'test-property-id',
    formData: mockFormData,
    tableName: 'properties' as const,
    debounceMs: 100,
    onSaveSuccess: mockOnSaveSuccess,
    onSaveError: mockOnSaveError
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return saveImmediately function', () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));
    
    expect(result.current.saveImmediately).toBeDefined();
    expect(typeof result.current.saveImmediately).toBe('function');
  });

  it('should trigger auto-save when form data changes', async () => {
    const { rerender } = renderHook(
      ({ formData }) => useAutoSave({ ...defaultOptions, formData }),
      { initialProps: { formData: mockFormData } }
    );

    // Change form data
    const newFormData = { ...mockFormData, property_name: 'Updated Property' };
    rerender({ formData: newFormData });

    // Fast-forward time to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('properties');
  });

  it('should debounce multiple rapid form data changes', async () => {
    const { rerender } = renderHook(
      ({ formData }) => useAutoSave({ ...defaultOptions, formData }),
      { initialProps: { formData: mockFormData } }
    );

    // Make rapid changes
    rerender({ formData: { ...mockFormData, property_name: 'Update 1' } });
    rerender({ formData: { ...mockFormData, property_name: 'Update 2' } });
    rerender({ formData: { ...mockFormData, property_name: 'Update 3' } });

    // Fast-forward time to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Should only call save once despite multiple changes
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
  });

  it('should call saveImmediately when manually triggered', async () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));

    await act(async () => {
      await result.current.saveImmediately();
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('properties');
  });

  it('should handle save success', async () => {
    const { rerender } = renderHook(
      ({ formData }) => useAutoSave({ ...defaultOptions, formData }),
      { initialProps: { formData: mockFormData } }
    );

    // Change form data
    const newFormData = { ...mockFormData, property_name: 'Updated Property' };
    rerender({ formData: newFormData });

    // Fast-forward time to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockOnSaveSuccess).toHaveBeenCalled();
  });

  it('should handle save error', async () => {
    const saveError = new Error('Save failed');
    mockSupabaseClient.from.mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: saveError }))
      }))
    });

    const { rerender } = renderHook(
      ({ formData }) => useAutoSave({ ...defaultOptions, formData }),
      { initialProps: { formData: mockFormData } }
    );

    // Change form data
    const newFormData = { ...mockFormData, property_name: 'Updated Property' };
    rerender({ formData: newFormData });

    // Fast-forward time to trigger debounced save
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockOnSaveError).toHaveBeenCalledWith(saveError);
  });

  it('should not save when propertyId is null', async () => {
    const { result } = renderHook(() => 
      useAutoSave({ ...defaultOptions, propertyId: null })
    );

    await act(async () => {
      await result.current.saveImmediately();
    });

    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should handle property_listings table', async () => {
    const { result } = renderHook(() => 
      useAutoSave({ ...defaultOptions, tableName: 'property_listings' })
    );

    await act(async () => {
      await result.current.saveImmediately();
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('property_listings');
  });

  it('should clean numeric data correctly', async () => {
    const formDataWithNumbers = {
      monthly_rent: '1500',
      bedrooms: '2',
      bathrooms: '1',
      description: 'Test property'
    };

    const { result } = renderHook(() => 
      useAutoSave({ ...defaultOptions, formData: formDataWithNumbers })
    );

    await act(async () => {
      await result.current.saveImmediately();
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('properties');
  });

  it('should handle empty string cleanup for numeric fields', async () => {
    const formDataWithEmptyStrings = {
      monthly_rent: '',
      bedrooms: '',
      description: 'Test property'
    };

    const { result } = renderHook(() => 
      useAutoSave({ ...defaultOptions, formData: formDataWithEmptyStrings })
    );

    await act(async () => {
      await result.current.saveImmediately();
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('properties');
  });
}); 