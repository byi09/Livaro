import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Switch from './switch';

describe('Switch', () => {
  it('renders with default props', () => {
    render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveClass('relative', 'inline-flex');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles when clicked', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = jest.fn();
    render(<Switch checked={false} onCheckedChange={mockOnCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(mockOnCheckedChange).toHaveBeenCalledWith(true);
  });

  it('handles controlled state', () => {
    const mockOnCheckedChange = jest.fn();
    const { rerender } = render(
      <Switch checked={false} onCheckedChange={mockOnCheckedChange} />
    );
    
    let switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveClass('bg-gray-300');

    rerender(<Switch checked={true} onCheckedChange={mockOnCheckedChange} />);
    switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveClass('bg-blue-600');
  });

  it('applies custom className', () => {
    render(<Switch checked={false} onCheckedChange={jest.fn()} className="custom-switch" />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('custom-switch');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} checked={false} onCheckedChange={jest.fn()} />);
    
    expect(ref.current).toBeTruthy();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('handles disabled state', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = jest.fn();
    render(<Switch checked={false} disabled onCheckedChange={mockOnCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    await user.click(switchElement);
    expect(mockOnCheckedChange).not.toHaveBeenCalled();
  });

  it('shows correct visual state for checked', () => {
    render(<Switch checked={true} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveClass('bg-blue-600');
    
    // Check thumb position
    const thumb = switchElement.querySelector('span');
    expect(thumb).toHaveClass('translate-x-4');
  });

  it('shows correct visual state for unchecked', () => {
    render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveClass('bg-gray-300');
    
    // Check thumb position
    const thumb = switchElement.querySelector('span');
    expect(thumb).toHaveClass('translate-x-1');
  });

  it('renders thumb element correctly', () => {
    render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    const thumb = switchElement.querySelector('span');
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveClass('inline-block', 'h-4', 'w-4', 'rounded-full', 'bg-white');
  });

  it('applies proper button styling', () => {
    render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass(
      'relative',
      'inline-flex',
      'h-5',
      'w-9',
      'items-center',
      'rounded-full',
      'transition-colors',
      'focus:outline-none'
    );
  });

  it('handles focus correctly', async () => {
    const user = userEvent.setup();
    render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    
    const switchElement = screen.getByRole('switch');
    
    await user.tab();
    expect(switchElement).toHaveFocus();
  });

  it('does not call onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = jest.fn();
    render(<Switch checked={false} disabled onCheckedChange={mockOnCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(mockOnCheckedChange).not.toHaveBeenCalled();
  });

  it('toggles from checked to unchecked', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = jest.fn();
    render(<Switch checked={true} onCheckedChange={mockOnCheckedChange} />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(mockOnCheckedChange).toHaveBeenCalledWith(false);
  });
}); 