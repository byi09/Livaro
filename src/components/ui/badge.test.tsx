import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../../../components/ui/badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('passes through other HTML attributes', () => {
    render(<Badge data-testid="test-badge" aria-label="Test Badge">Badge</Badge>);
    
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('aria-label', 'Test Badge');
  });

  it('has correct base styles', () => {
    render(<Badge>Base Badge</Badge>);
    
    const badge = screen.getByText('Base Badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-md',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold'
    );
  });

  it('renders different content types', () => {
    const { rerender } = render(<Badge>Text Badge</Badge>);
    expect(screen.getByText('Text Badge')).toBeInTheDocument();

    rerender(<Badge>123</Badge>);
    expect(screen.getByText('123')).toBeInTheDocument();

    rerender(<Badge><span>Nested Content</span></Badge>);
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
}); 