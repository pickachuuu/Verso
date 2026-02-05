'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type ColorTheme = 'primary' | 'accent' | 'secondary';

const themeStyles: Record<ColorTheme, { gradient: string; shadow: string }> = {
  primary: {
    gradient: 'from-primary to-primary-light',
    shadow: 'shadow-primary/25 hover:shadow-primary/30',
  },
  accent: {
    gradient: 'from-accent to-purple-500',
    shadow: 'shadow-accent/25 hover:shadow-accent/30',
  },
  secondary: {
    gradient: 'from-secondary to-secondary/80',
    shadow: 'shadow-secondary/25 hover:shadow-secondary/30',
  },
};

export interface HeroActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: ColorTheme;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const HeroActionButton = forwardRef<HTMLButtonElement, HeroActionButtonProps>(
  ({ className, theme = 'primary', icon, children, ...props }, ref) => {
    const { gradient, shadow } = themeStyles[theme];

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-3 rounded-xl',
          `bg-gradient-to-r ${gradient}`,
          'text-white font-semibold',
          'shadow-lg hover:shadow-xl',
          shadow,
          'hover:-translate-y-0.5 transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

HeroActionButton.displayName = 'HeroActionButton';

export default HeroActionButton;
