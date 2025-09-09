import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TwoFactorAction from './TwoFactor';
import { useAccountSetting } from '@/src/contexts/AccountSettingContext';
import { enrollTwoFactor, verifyTwoFactor, unenrollTwoFactor } from '@/src/db/actions';
import { createClient } from '@/utils/supabase/client';

// Mock the dependencies
jest.mock('@/src/contexts/AccountSettingContext', () => ({
  useAccountSetting: jest.fn(),
}));

jest.mock('@/src/db/actions', () => ({
  enrollTwoFactor: jest.fn(),
  verifyTwoFactor: jest.fn(),
  unenrollTwoFactor: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} data-testid="next-image" />;
  },
}));

// Mock the Skeleton component
jest.mock('../../ui/LoadingSkeleton', () => ({
  Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="skeleton" {...props} />,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('TwoFactorAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccountSetting as jest.Mock).mockReturnValue({
      mfaEnabled: false,
      setMfaEnabled: jest.fn(),
    });
  });

  it('renders skeleton when mfaEnabled is null', () => {
    (useAccountSetting as jest.Mock).mockReturnValue({
      mfaEnabled: null,
      setMfaEnabled: jest.fn(),
    });

    render(<TwoFactorAction />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders EnableTwoFactorAction when mfaEnabled is false', () => {
    (useAccountSetting as jest.Mock).mockReturnValue({
      mfaEnabled: false,
      setMfaEnabled: jest.fn(),
    });

    render(<TwoFactorAction />);
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('renders DisableTwoFactorAction when mfaEnabled is true', () => {
    (useAccountSetting as jest.Mock).mockReturnValue({
      mfaEnabled: true,
      setMfaEnabled: jest.fn(),
    });

    render(<TwoFactorAction />);
    expect(screen.getByText('Disable')).toBeInTheDocument();
  });

  describe('EnableTwoFactorAction', () => {
    it('opens dialog when Enable button is clicked', async () => {
      const user = userEvent.setup();
      (enrollTwoFactor as jest.Mock).mockResolvedValue({
        success: true,
        totp: {
          qr_code: 'data:image/png;base64,test',
          uri: 'otpauth://test',
        },
      });

      render(<TwoFactorAction />);
      
      const enableButton = screen.getByText('Enable');
      await user.click(enableButton);
      
      expect(await screen.findByText('Enable Two-Factor Authentication')).toBeInTheDocument();
      expect(enrollTwoFactor).toHaveBeenCalled();
    });

    it('shows error message when enrollment fails', async () => {
      const user = userEvent.setup();
      (enrollTwoFactor as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to enroll',
      });

      render(<TwoFactorAction />);
      
      const enableButton = screen.getByText('Enable');
      await user.click(enableButton);
      
      expect(await screen.findByText('Failed to enroll')).toBeInTheDocument();
    });

    it('handles verification success', async () => {
      const user = userEvent.setup();
      const mockSetMfaEnabled = jest.fn();
      (useAccountSetting as jest.Mock).mockReturnValue({
        mfaEnabled: false,
        setMfaEnabled: mockSetMfaEnabled,
      });
      
      (enrollTwoFactor as jest.Mock).mockResolvedValue({
        success: true,
        totp: {
          qr_code: 'data:image/png;base64,test',
          uri: 'otpauth://test',
        },
      });
      
      (verifyTwoFactor as jest.Mock).mockResolvedValue({
        success: true,
      });

      render(<TwoFactorAction />);
      
      const enableButton = screen.getByText('Enable');
      await user.click(enableButton);
      
      // Wait for the QR code to appear
      await waitFor(() => {
        expect(screen.getByTestId('next-image')).toBeInTheDocument();
      });
      
      // Enter code and submit
      const codeInput = screen.getByRole('textbox');
      await user.type(codeInput, '123456');
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(verifyTwoFactor).toHaveBeenCalledWith('123456');
        expect(mockSetMfaEnabled).toHaveBeenCalledWith(true);
      });
    });

    it('shows error message when verification fails', async () => {
      const user = userEvent.setup();
      
      (enrollTwoFactor as jest.Mock).mockResolvedValue({
        success: true,
        totp: {
          qr_code: 'data:image/png;base64,test',
          uri: 'otpauth://test',
        },
      });
      
      (verifyTwoFactor as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid code',
      });

      render(<TwoFactorAction />);
      
      const enableButton = screen.getByText('Enable');
      await user.click(enableButton);
      
      // Wait for the QR code to appear
      await waitFor(() => {
        expect(screen.getByTestId('next-image')).toBeInTheDocument();
      });
      
      // Enter code and submit
      const codeInput = screen.getByRole('textbox');
      await user.type(codeInput, '123456');
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(await screen.findByText('Invalid code')).toBeInTheDocument();
    });
  });

  describe('DisableTwoFactorAction', () => {
    beforeEach(() => {
      (useAccountSetting as jest.Mock).mockReturnValue({
        mfaEnabled: true,
        setMfaEnabled: jest.fn(),
      });
    });

    it('opens dialog when Disable button is clicked', async () => {
      const user = userEvent.setup();

      render(<TwoFactorAction />);
      
      const disableButton = screen.getByText('Disable');
      await user.click(disableButton);
      
      expect(screen.getByText('Disable Two-Factor Authentication')).toBeInTheDocument();
    });

    it('handles unenrollment success and logs out', async () => {
      const user = userEvent.setup();
      const mockSignOut = jest.fn().mockResolvedValue({});
      const mockSupabase = {
        auth: {
          signOut: mockSignOut,
        },
      };
      
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      (unenrollTwoFactor as jest.Mock).mockResolvedValue({
        success: true,
      });
      
      // Mock window.location.href
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: originalHref },
      });

      render(<TwoFactorAction />);
      
      const disableButton = screen.getByText('Disable');
      await user.click(disableButton);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(unenrollTwoFactor).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
        expect(mockSignOut).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
      });
      
      // Restore window.location
      window.location.href = originalHref;
    });

    it('shows error message when unenrollment fails', async () => {
      const user = userEvent.setup();
      
      (unenrollTwoFactor as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to disable',
      });

      render(<TwoFactorAction />);
      
      const disableButton = screen.getByText('Disable');
      await user.click(disableButton);
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(await screen.findByText('Failed to disable')).toBeInTheDocument();
    });
  });
}); 