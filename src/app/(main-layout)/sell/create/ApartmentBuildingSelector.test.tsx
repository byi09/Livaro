import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ApartmentBuildingSelector from './ApartmentBuildingSelector';

// Mock the Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          then: jest.fn()
        }))
      }))
    }))
  }))
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn()
});

describe('ApartmentBuildingSelector', () => {
  const mockBuildings = [
    {
      id: '1',
      building_name: 'Sunset Apartments',
      address_line_1: '123 Main St',
      city: 'Los Angeles',
      state: 'CA'
    },
    {
      id: '2',
      building_name: 'Ocean View Complex',
      address_line_1: '456 Beach Ave',
      city: 'Santa Monica',
      state: 'CA'
    }
  ];

  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    disabled: false,
    landlordId: 'landlord-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ApartmentBuildingSelector {...defaultProps} />);
    
    expect(screen.getByText('Loading buildings...')).toBeInTheDocument();
  });

  it('renders empty state when no landlordId provided', async () => {
    render(<ApartmentBuildingSelector {...defaultProps} landlordId={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading buildings...')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays buildings', async () => {
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('No building (standalone unit)')).toBeInTheDocument();
    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.getByText('Ocean View Complex')).toBeInTheDocument();
  });

  it('selects a building', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    const buildingOption = screen.getByText('Sunset Apartments');
    await user.click(buildingOption);

    expect(mockOnChange).toHaveBeenCalledWith('1');
  });

  it('selects "no building" option', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    const noBuildingOption = screen.getByText('No building (standalone unit)');
    await user.click(noBuildingOption);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('displays selected building', async () => {
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} value="1" />);

    await waitFor(() => {
      expect(screen.getByText('Sunset Apartments - 123 Main St, Los Angeles, CA')).toBeInTheDocument();
    });
  });

  it('handles disabled state', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.queryByText('No building (standalone unit)')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('No building (standalone unit)')).toBeInTheDocument();

    // Click on the overlay to close dropdown
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    await user.click(overlay as Element);

    await waitFor(() => {
      expect(screen.queryByText('No building (standalone unit)')).not.toBeInTheDocument();
    });
  });

  it('opens create building page when no buildings exist', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: [], error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No apartment buildings found')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    const createButton = screen.getByText('Create Building');
    await user.click(createButton);

    expect(window.open).toHaveBeenCalledWith('/sell/create/apartment-building', '_blank');
  });

  it('opens create building page from dropdown', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    const createButton = screen.getByText('Create New Building');
    await user.click(createButton);

    expect(window.open).toHaveBeenCalledWith('/sell/create/apartment-building', '_blank');
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockResponse = { data: null, error: new Error('API Error') };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No apartment buildings found')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching apartment buildings:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('rotates chevron icon when dropdown is open', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: mockBuildings, error: null };
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue(mockResponse)
        })
      })
    });

    render(<ApartmentBuildingSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Select an apartment building (optional)')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    // Get the chevron icon specifically (it should be the second svg element)
    const svgElements = button.querySelectorAll('svg');
    const chevron = svgElements[1]; // ChevronDown is the second svg
    
    expect(chevron).not.toHaveClass('rotate-180');

    await user.click(button);

    expect(chevron).toHaveClass('rotate-180');
  });
}); 