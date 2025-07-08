import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from './Toast';

// Mock createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Test component that uses the toast context
const TestComponent = () => {
  const { success, error, warning, info, addToast } = useToast();

  return (
    <div>
      <button onClick={() => success('Success!', 'Operation completed')}>
        Success Toast
      </button>
      <button onClick={() => error('Error!', 'Something went wrong')}>
        Error Toast
      </button>
      <button onClick={() => warning('Warning!', 'Please be careful')}>
        Warning Toast
      </button>
      <button onClick={() => info('Info!', 'Here is some information')}>
        Info Toast
      </button>
      <button 
        onClick={() => addToast({
          type: 'success',
          title: 'Custom Toast',
          description: 'With action',
          action: { label: 'Undo', onClick: () => console.log('Undo clicked') }
        })}
      >
        Custom Toast
      </button>
    </div>
  );
};

describe('Toast System', () => {
  beforeEach(() => {
    // Clear any existing toasts
    document.body.innerHTML = '';
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleError.mockRestore();
  });

  it('renders success toast correctly', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Success Toast');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });
  });

  it('renders error toast correctly', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const errorButton = screen.getByText('Error Toast');
    fireEvent.click(errorButton);

    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders warning toast correctly', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const warningButton = screen.getByText('Warning Toast');
    fireEvent.click(warningButton);

    await waitFor(() => {
      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByText('Please be careful')).toBeInTheDocument();
    });
  });

  it('renders info toast correctly', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const infoButton = screen.getByText('Info Toast');
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(screen.getByText('Info!')).toBeInTheDocument();
      expect(screen.getByText('Here is some information')).toBeInTheDocument();
    });
  });

  it('renders custom toast with action', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const customButton = screen.getByText('Custom Toast');
    fireEvent.click(customButton);

    await waitFor(() => {
      // Check that we have both the button and the toast content
      const customToastElements = screen.getAllByText('Custom Toast');
      expect(customToastElements).toHaveLength(2); // Button + Toast content
      expect(screen.getByText('With action')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });
  });

  it('allows closing toast with X button', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Success Toast');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  it('supports multiple toasts simultaneously', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Success Toast');
    const errorButton = screen.getByText('Error Toast');
    
    fireEvent.click(successButton);
    fireEvent.click(errorButton);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after duration', async () => {
    // Mock setTimeout for this test
    jest.useFakeTimers();
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Success Toast');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds (default duration)
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });
}); 