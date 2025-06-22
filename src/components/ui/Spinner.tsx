import React from 'react';
import { cn } from '@/utils/styles';

interface SpinnerProps {
  /** Diameter in pixels */
  size?: number;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'white' | 'current';
  /** Optional text shown next to the spinner */
  label?: string;
  /** Extra classes */
  className?: string;
  /** Spinner style variant */
  type?: 'circular' | 'dots' | 'pulse';
}

/**
 * Enhanced, consistent spinner component with multiple variants
 */
export default function Spinner({
  size = 32,
  variant = 'primary',
  label,
  className = '',
  type = 'circular',
}: SpinnerProps) {
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    current: 'text-current',
  };

  const renderCircularSpinner = () => (
    <span
      className={cn(
        'animate-spin rounded-full border-2 border-solid border-transparent border-t-current',
        colorClasses[variant]
      )}
      style={{ width: size, height: size }}
    />
  );

  const renderDotsSpinner = () => (
    <div className={cn('flex space-x-1', colorClasses[variant])}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-full bg-current animate-pulse"
          style={{ 
            width: size / 4, 
            height: size / 4,
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );

  const renderPulseSpinner = () => (
    <div
      className={cn(
        'rounded-full bg-current animate-pulse opacity-60',
        colorClasses[variant]
      )}
      style={{ width: size, height: size }}
    />
  );

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return renderDotsSpinner();
      case 'pulse':
        return renderPulseSpinner();
      default:
        return renderCircularSpinner();
    }
  };

  return (
    <span 
      className={cn('inline-flex items-center gap-2', className)} 
      role="status"
      aria-label={label || 'Loading'}
    >
      {renderSpinner()}
      {label && (
        <span className="text-sm text-gray-600 animate-pulse">
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * Loading overlay component for full-screen or container loading states
 */
interface LoadingOverlayProps {
  /** Show the overlay */
  show: boolean;
  /** Loading message */
  message?: string;
  /** Subtitle message */
  subtitle?: string;
  /** Background opacity */
  opacity?: 'light' | 'medium' | 'heavy';
  /** Spinner size */
  size?: number;
  /** Container specific (not full screen) */
  container?: boolean;
  /** Additional classes */
  className?: string;
}

export function LoadingOverlay({
  show,
  message = 'Loading...',
  subtitle,
  opacity = 'medium',
  size = 40,
  container = false,
  className = '',
}: LoadingOverlayProps) {
  if (!show) return null;

  const opacityClasses = {
    light: 'bg-white/40',
    medium: 'bg-white/60',
    heavy: 'bg-white/80',
  };

  const positionClasses = container ? 'absolute inset-0' : 'fixed inset-0';

  return (
    <div
      className={cn(
        positionClasses,
        'z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-200',
        opacityClasses[opacity],
        className
      )}
    >
      <div className="text-center space-y-4 p-8">
        <Spinner size={size} variant="primary" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 animate-pulse">
            {message}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 animate-pulse">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading component for buttons and form elements
 */
interface InlineLoadingProps {
  /** Show loading state */
  loading: boolean;
  /** Loading text */
  loadingText?: string;
  /** Default children */
  children: React.ReactNode;
  /** Spinner size */
  size?: number;
  /** Spinner variant */
  variant?: SpinnerProps['variant'];
}

export function InlineLoading({
  loading,
  loadingText,
  children,
  size = 16,
  variant = 'current',
}: InlineLoadingProps) {
  return (
    <>
      {loading && (
        <Spinner 
          size={size} 
          variant={variant}
          className="mr-2" 
        />
      )}
      {loading && loadingText ? loadingText : children}
    </>
  );
} 