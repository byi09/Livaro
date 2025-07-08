import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction, 
  AlertDialogCancel 
} from '../../../components/ui/alert-dialog';

// Mock createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('AlertDialog Components', () => {
  const TestAlertDialog = ({ 
    onAction = jest.fn(), 
    onCancel = jest.fn() 
  }: { 
    onAction?: () => void;
    onCancel?: () => void;
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button>Open Dialog</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Delete Account</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  it('renders trigger button', () => {
    render(<TestAlertDialog />);
    
    expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestAlertDialog />);
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('renders dialog content when opened', async () => {
    const user = userEvent.setup();
    render(<TestAlertDialog />);
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone. This will permanently delete your account and remove your data from our servers.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
    });
  });

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockAction = jest.fn();
    render(<TestAlertDialog onAction={mockAction} />);
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    
    const actionButton = screen.getByRole('button', { name: 'Delete Account' });
    await user.click(actionButton);
    
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockCancel = jest.fn();
    render(<TestAlertDialog onCancel={mockCancel} />);
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('closes dialog when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<TestAlertDialog />);
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Individual Components', () => {
    it('AlertDialogTitle applies correct styles', async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const title = screen.getByText('Are you sure?');
        expect(title).toHaveClass('text-lg', 'font-semibold');
      });
    });

    it('AlertDialogDescription applies correct styles', async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const description = screen.getByText(/This action cannot be undone/);
        expect(description).toHaveClass('text-sm', 'text-muted-foreground');
      });
    });

    it('AlertDialogAction applies button styles', async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const actionButton = screen.getByRole('button', { name: 'Delete Account' });
        expect(actionButton).toHaveClass('inline-flex', 'items-center', 'justify-center');
      });
    });

    it('AlertDialogCancel applies outline button styles', async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        expect(cancelButton).toHaveClass('border', 'border-input');
      });
    });
  });

  describe('Custom styling', () => {
    it('applies custom className to AlertDialogContent', async () => {
      const user = userEvent.setup();
      const CustomDialog = () => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button>Open Custom Dialog</button>
          </AlertDialogTrigger>
          <AlertDialogContent className="custom-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Custom Dialog</AlertDialogTitle>
              <AlertDialogDescription>
                This is a custom dialog for testing.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      render(<CustomDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Custom Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toHaveClass('custom-dialog');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);
      
      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
        
        // Check if title and description are properly linked
        const title = screen.getByText('Are you sure?');
        const description = screen.getByText(/This action cannot be undone/);
        
        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
      });
    });
  });
}); 