import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom size', () => {
    render(<Spinner size={24} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ minHeight: '24px' });
  });

  it('renders with primary variant', () => {
    render(<Spinner variant="primary" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('text-blue-600');
  });

  it('renders with secondary variant', () => {
    render(<Spinner variant="secondary" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('text-gray-600');
  });

  it('renders with white variant', () => {
    render(<Spinner variant="white" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('text-white');
  });

  it('renders with current variant', () => {
    render(<Spinner variant="current" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('text-current');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-spinner" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('renders with label', () => {
    render(<Spinner label="Loading data..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading data...');
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders circular type by default', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    const spinnerElement = spinner.firstChild;
    expect(spinnerElement).toHaveClass('animate-spin', 'rounded-full', 'border-2');
  });

  it('renders dots type', () => {
    render(<Spinner type="dots" />);
    
    const spinner = screen.getByRole('status');
    const dotsContainer = spinner.firstChild as Element;
    expect(dotsContainer).toHaveClass('flex', 'space-x-1');
    // Should have 3 dots
    const dots = dotsContainer?.querySelectorAll('div');
    expect(dots).toHaveLength(3);
  });

  it('renders pulse type', () => {
    render(<Spinner type="pulse" />);
    
    const spinner = screen.getByRole('status');
    const pulseElement = spinner.firstChild;
    expect(pulseElement).toHaveClass('rounded-full', 'bg-current', 'animate-pulse');
  });

  it('has proper accessibility attributes with custom label', () => {
    render(<Spinner label="Custom loading" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
  });

  it('maintains size for different types', () => {
    const { rerender } = render(<Spinner size={40} type="circular" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ minHeight: '40px' });

    rerender(<Spinner size={40} type="dots" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ minHeight: '40px' });

    rerender(<Spinner size={40} type="pulse" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ minHeight: '40px' });
  });

  it('applies inline-flex base classes', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('inline-flex', 'items-center', 'gap-2');
  });

  it('renders with all props combined', () => {
    render(
      <Spinner 
        size={30}
        variant="white"
        className="custom-class"
        label="Testing spinner"
        type="pulse"
      />
    );
    
    const spinner = screen.getByRole('status');
    
    expect(spinner).toHaveStyle({ minHeight: '30px' });
    expect(spinner).toHaveClass('custom-class');
    expect(spinner).toHaveAttribute('aria-label', 'Testing spinner');
    expect(screen.getByText('Testing spinner')).toBeInTheDocument();
    expect(spinner.firstChild).toHaveClass('text-white');
  });
}); 