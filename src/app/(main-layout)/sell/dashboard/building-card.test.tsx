import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BuildingCard from './building-card';

// Mock the Spinner component
jest.mock('@/src/components/ui/Spinner', () => {
  return function MockSpinner({ size, colorClass, className }: any) {
    return <div data-testid="spinner" className={className} style={{ width: size, height: size }}>Loading...</div>;
  };
});

describe('BuildingCard', () => {
  const mockBuilding = {
    id: '1',
    building_name: 'Sunset Apartments',
    building_number: '123',
    address_line_1: '456 Main St',
    address_line_2: 'Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    total_units: 24
  };

  const mockFormatAddress = jest.fn((building) => 
    `${building.address_line_1}, ${building.city}, ${building.state}`
  );

  const defaultProps = {
    building: mockBuilding,
    onBuildingClick: jest.fn(),
    onEditClick: jest.fn(),
    onDeleteClick: jest.fn(),
    isLoading: false,
    formatAddress: mockFormatAddress
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders building information correctly', () => {
    render(<BuildingCard {...defaultProps} />);

    expect(screen.getByText('Sunset Apartments #123')).toBeInTheDocument();
    expect(screen.getByText('456 Main St, Los Angeles, CA')).toBeInTheDocument();
    expect(screen.getAllByText('24 Units')).toHaveLength(2);
    expect(screen.getByText('Building')).toBeInTheDocument();
  });

  it('renders building without building number', () => {
    const buildingWithoutNumber = { ...mockBuilding, building_number: undefined };
    render(<BuildingCard {...defaultProps} building={buildingWithoutNumber} />);

    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Apartments #')).not.toBeInTheDocument();
  });

  it('handles singular unit correctly', () => {
    const buildingWithOneUnit = { ...mockBuilding, total_units: 1 };
    render(<BuildingCard {...defaultProps} building={buildingWithOneUnit} />);

    expect(screen.getAllByText('1 Unit')).toHaveLength(2);
  });

  it('calls onBuildingClick when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnBuildingClick = jest.fn();
    
    render(<BuildingCard {...defaultProps} onBuildingClick={mockOnBuildingClick} />);

    // Find the card element using role and accessible name
    const card = screen.getByRole('button', { name: /click to manage building/i });
    
    await user.click(card);
    expect(mockOnBuildingClick).toHaveBeenCalledWith(mockBuilding);
  });

  it('calls onEditClick when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnEditClick = jest.fn();
    
    render(<BuildingCard {...defaultProps} onEditClick={mockOnEditClick} />);

    const editButton = screen.getByTitle('Edit building details');
    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalled();
  });

  it('calls onDeleteClick when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDeleteClick = jest.fn();
    
    render(<BuildingCard {...defaultProps} onDeleteClick={mockOnDeleteClick} />);

    const deleteButton = screen.getByTitle('Delete building');
    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalled();
  });

  it('prevents event bubbling on edit button click', async () => {
    const user = userEvent.setup();
    const mockOnBuildingClick = jest.fn();
    const mockOnEditClick = jest.fn();
    
    render(
      <BuildingCard 
        {...defaultProps} 
        onBuildingClick={mockOnBuildingClick}
        onEditClick={mockOnEditClick}
      />
    );

    const editButton = screen.getByTitle('Edit building details');
    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalled();
    expect(mockOnBuildingClick).not.toHaveBeenCalled();
  });

  it('prevents event bubbling on delete button click', async () => {
    const user = userEvent.setup();
    const mockOnBuildingClick = jest.fn();
    const mockOnDeleteClick = jest.fn();
    
    render(
      <BuildingCard 
        {...defaultProps} 
        onBuildingClick={mockOnBuildingClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    const deleteButton = screen.getByTitle('Delete building');
    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalled();
    expect(mockOnBuildingClick).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<BuildingCard {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-text')).toBeInTheDocument();
    expect(screen.getByTestId('loading-text')).toHaveTextContent('Loading...');
  });

  it('shows regular state when not loading', () => {
    render(<BuildingCard {...defaultProps} isLoading={false} />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('action-text')).toHaveTextContent('Click to manage building');
  });

  it('applies loading ring style when loading', () => {
    const { container } = render(<BuildingCard {...defaultProps} isLoading={true} />);
    
    // Check if the card has the ring classes
    const card = container.querySelector('div[role="button"]');
    expect(card).toHaveClass('ring-2');
    expect(card).toHaveClass('ring-opacity-50');
  });

  it('uses formatAddress function correctly', () => {
    render(<BuildingCard {...defaultProps} />);

    expect(mockFormatAddress).toHaveBeenCalledWith(mockBuilding);
    expect(screen.getByText('456 Main St, Los Angeles, CA')).toBeInTheDocument();
  });

  it('renders building image placeholder with correct unit count', () => {
    render(<BuildingCard {...defaultProps} />);
    
    // Check if the unit count is displayed in the placeholder
    const placeholderSection = screen.getAllByText('24 Units')[0];
    expect(placeholderSection).toBeInTheDocument();
    
    // Check if the Building icon is present in the placeholder
    const placeholderDiv = placeholderSection.closest('div.text-center');
    expect(placeholderDiv).toBeInTheDocument();
  });

  it('renders action buttons with correct styling', () => {
    render(<BuildingCard {...defaultProps} />);
    
    const editButton = screen.getByTitle('Edit building details');
    const deleteButton = screen.getByTitle('Delete building');
    
    // Check if buttons have the correct classes
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Check if edit button has blue styling
    expect(editButton.className).toContain('text-blue-600');
    
    // Check if delete button has red styling
    expect(deleteButton.className).toContain('text-red-600');
  });

  it('renders building details section correctly', () => {
    render(<BuildingCard {...defaultProps} />);
    
    // Check if the building name is rendered correctly
    expect(screen.getByText('Sunset Apartments #123')).toBeInTheDocument();
    
    // Check if the address is rendered correctly
    expect(screen.getByText('456 Main St, Los Angeles, CA')).toBeInTheDocument();
    
    // Check if the unit count is rendered correctly in the details section
    const detailsSection = screen.getAllByText('24 Units')[1];
    expect(detailsSection).toBeInTheDocument();
  });

  it('handles address with address_line_2', () => {
    const buildingWithSecondLine = {
      ...mockBuilding,
      address_line_2: 'Apt 2B'
    };
    
    const customFormatAddress = jest.fn((building) => 
      `${building.address_line_1}, ${building.address_line_2}, ${building.city}, ${building.state}`
    );
    
    render(
      <BuildingCard 
        {...defaultProps} 
        building={buildingWithSecondLine}
        formatAddress={customFormatAddress}
      />
    );

    expect(customFormatAddress).toHaveBeenCalledWith(buildingWithSecondLine);
    expect(screen.getByText('456 Main St, Apt 2B, Los Angeles, CA')).toBeInTheDocument();
  });
}); 