'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type ColorTheme = 'primary' | 'accent' | 'secondary';

export interface HeroActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: ColorTheme;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const HeroActionButton = forwardRef<HTMLButtonElement, HeroActionButtonProps>(
  ({ className, theme = 'primary', icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl',
          'bg-surface border border-border/80',
          'text-foreground font-semibold text-sm',
          'shadow-sm hover:shadow-md',
          'hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          className
        )}
        {...props}
      >
        <span className="text-accent">{icon}</span>
        {children}
      </button>
    );
  }
);

HeroActionButton.displayName = 'HeroActionButton';

export default HeroActionButton;
