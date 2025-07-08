import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '../../../components/ui/tabs';

describe('Tabs Components', () => {
  const TestTabs = ({ 
    defaultValue = 'tab1',
    onValueChange = jest.fn()
  }: { 
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" disabled>Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div>Content for Tab 1</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div>Content for Tab 2</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div>Content for Tab 3</div>
      </TabsContent>
    </Tabs>
  );

  describe('Tabs', () => {
    it('renders with default value', () => {
      render(<TestTabs />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
    });

    it('switches tabs when clicked', async () => {
      const user = userEvent.setup();
      const mockOnValueChange = jest.fn();
      render(<TestTabs onValueChange={mockOnValueChange} />);
      
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);
      
      expect(mockOnValueChange).toHaveBeenCalledWith('tab2');
      expect(screen.getByText('Content for Tab 2')).toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);
      
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      
      await act(async () => {
        tab1.focus();
      });
      
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
      
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('respects disabled state', async () => {
      const user = userEvent.setup();
      const mockOnValueChange = jest.fn();
      render(<TestTabs onValueChange={mockOnValueChange} />);
      
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
      await user.click(tab3);
      
      expect(mockOnValueChange).not.toHaveBeenCalledWith('tab3');
      expect(screen.queryByText('Content for Tab 3')).not.toBeInTheDocument();
    });
  });

  describe('TabsList', () => {
    it('renders with correct styles', () => {
      render(<TestTabs />);
      
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('custom-tabs-list');
    });
  });

  describe('TabsTrigger', () => {
    it('renders with correct styles', () => {
      render(<TestTabs />);
      
      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger ref={ref} value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('TabsContent', () => {
    it('renders when tab is active', () => {
      render(<TestTabs />);
      
      const content = screen.getByText('Content for Tab 1');
      expect(content).toBeInTheDocument();
    });

    it('does not render when tab is inactive', () => {
      render(<TestTabs />);
      
      expect(screen.queryByText('Content for Tab 2')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content
          </TabsContent>
        </Tabs>
      );
      
      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent ref={ref} value="tab1">
            Content
          </TabsContent>
        </Tabs>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Controlled Tabs', () => {
    it('works in controlled mode', async () => {
      const user = userEvent.setup();
      const ControlledTabs = () => {
        const [value, setValue] = React.useState('tab1');
        
        return (
          <Tabs value={value} onValueChange={setValue}>
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content 1</TabsContent>
            <TabsContent value="tab2">Content 2</TabsContent>
          </Tabs>
        );
      };
      
      render(<ControlledTabs />);
      
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<TestTabs />);
      
      const tabsList = screen.getByRole('tablist');
      const tabs = screen.getAllByRole('tab');
      const tabpanel = screen.getByRole('tabpanel');
      
      expect(tabsList).toBeInTheDocument();
      expect(tabs).toHaveLength(3);
      expect(tabpanel).toBeInTheDocument();
      
      // Check active tab
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('supports keyboard navigation with Home/End keys', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);
      
      const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
      
      await act(async () => {
        firstTab.focus();
      });
      
      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
      
      await user.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });
  });
}); 