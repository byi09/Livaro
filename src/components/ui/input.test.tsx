import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from './input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
  });

  it('accepts and displays value', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');
    
    expect(input).toHaveValue('test value');
  });

  it('handles controlled input', () => {
    const mockOnChange = jest.fn();
    render(<Input value="controlled" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('controlled');
  });

  it('calls onChange when typed in', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<Input onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'a');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders with different input types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders with label', () => {
    render(<Input label="Test Label" />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Input error="Test error" />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('renders with success state', () => {
    render(<Input success="Test success" />);
    
    expect(screen.getByText('Test success')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-green-500');
  });

  it('renders with helper text', () => {
    render(<Input helperText="Helper text" />);
    
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">📧</span>;
    render(<Input leftIcon={leftIcon} />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">🔍</span>;
    render(<Input rightIcon={rightIcon} />);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pr-10');
  });

  it('applies placeholder when provided', () => {
    render(<Input placeholder="Enter text..." />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text...');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('supports HTML input attributes', () => {
    render(
      <Input 
        autoComplete="email"
        autoFocus
        maxLength={10}
        minLength={3}
        pattern="[a-z]+"
        data-testid="test-input"
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('maxlength', '10');
    expect(input).toHaveAttribute('minlength', '3');
    expect(input).toHaveAttribute('pattern', '[a-z]+');
    expect(input).toHaveFocus();
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn((e) => e.preventDefault());
    
    render(
      <form onSubmit={mockOnSubmit}>
        <Input name="testInput" />
        <button type="submit">Submit</button>
      </form>
    );
    
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');
    
    await user.type(input, 'test');
    await user.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('applies proper styling for different states', () => {
    const { rerender } = render(<Input />);
    let input = screen.getByRole('textbox');
    
    expect(input).toHaveClass(
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-sm'
    );

    rerender(<Input className="border-red-500" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('handles file input type', () => {
    render(<Input type="file" />);
    
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  it('handles password visibility toggle', async () => {
    const user = userEvent.setup();
    render(<Input type="password" value="secret" readOnly />);
    
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);
    
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders floating variant', () => {
    render(<Input variant="floating" label="Floating Label" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('peer', 'placeholder-transparent');
    expect(screen.getByText('Floating Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
}); 