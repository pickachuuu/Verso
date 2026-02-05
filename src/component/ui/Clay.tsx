'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Claymorphism Design System Components
 *
 * Claymorphism is characterized by:
 * - Soft, rounded shapes
 * - Inner shadows creating a "puffy" look
 * - Outer shadows for depth
 * - Pastel/muted colors
 *
 * Optimized for light backgrounds with enhanced visual depth
 */

// ============================================
// ClayCard
// ============================================
interface ClayCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'pressed' | 'floating' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ClayCard({
  children,
  className,
  variant = 'default',
  padding = 'md'
}: ClayCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'clay-card',
    elevated: 'clay-card-elevated',
    pressed: 'clay-card-pressed',
    floating: 'clay-card-floating',
    glass: 'clay-card-glass',
  };

  return (
    <div className={clsx(
      'rounded-3xl',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// ClayButton
// ============================================
interface ClayButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ClayButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
}: ClayButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'clay-button-primary',
    secondary: 'clay-button-secondary',
    ghost: 'clay-button-ghost',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-2xl font-semibold transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// ClayBadge
// ============================================
interface ClayBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

export function ClayBadge({
  children,
  className,
  variant = 'default',
}: ClayBadgeProps) {
  const variantClasses = {
    default: 'clay-badge',
    accent: 'clay-badge-accent',
    success: 'clay-badge-success',
    warning: 'clay-badge-warning',
    error: 'clay-badge-error',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

// ============================================
// ClayIconBox
// ============================================
interface ClayIconBoxProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'secondary' | 'tertiary';
}

export function ClayIconBox({
  children,
  className,
  size = 'md',
  variant = 'default',
}: ClayIconBoxProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const variantClasses = {
    default: 'clay-icon-box',
    accent: 'clay-icon-box-accent',
    secondary: 'clay-icon-box-secondary',
    tertiary: 'clay-icon-box-tertiary',
  };

  return (
    <div className={clsx(
      'rounded-2xl flex items-center justify-center',
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// ClaySection
// ============================================
interface ClaySectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
  id?: string;
}

export function ClaySection({
  children,
  className,
  variant = 'default',
  id,
}: ClaySectionProps) {
  const variantClasses = {
    default: 'bg-background',
    muted: 'clay-section-muted',
  };

  return (
    <section
      id={id}
      className={clsx(
        'py-20 px-4 sm:px-6 lg:px-8',
        variantClasses[variant],
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
}

// ============================================
// ClayInput
// ============================================
interface ClayInputProps {
  placeholder?: string;
  className?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ClayInput({
  placeholder,
  className,
  type = 'text',
  value,
  onChange,
}: ClayInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={clsx(
        'clay-input rounded-2xl px-6 py-4 w-full',
        'placeholder:text-foreground-muted/60',
        'focus:outline-none focus:ring-2 focus:ring-accent/50',
        className
      )}
    />
  );
}

// ============================================
// ClayDivider
// ============================================
interface ClayDividerProps {
  className?: string;
}

export function ClayDivider({ className }: ClayDividerProps) {
  return (
    <div className={clsx(
      'clay-divider h-1 rounded-full my-8',
      className
    )} />
  );
}
