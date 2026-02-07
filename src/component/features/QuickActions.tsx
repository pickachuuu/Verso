'use client';

import { ClayCard, ClayButton } from '@/component/ui/Clay';
import { File01Icon, Target01Icon, Add01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';
import Link from 'next/link';

interface ActionItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'default';
  accentColor?: string; // For secondary items, which color accent to use
}

function ActionItem({ title, description, icon, href, variant = 'default', accentColor }: ActionItemProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-primary to-primary-light text-white shadow-lg hover:shadow-xl hover:scale-[1.02]';
      case 'secondary':
        return 'bg-gradient-to-br from-secondary to-secondary-light text-white shadow-lg hover:shadow-xl hover:scale-[1.02]';
      case 'tertiary':
        return 'bg-gradient-to-br from-tertiary to-tertiary-light text-white shadow-lg hover:shadow-xl hover:scale-[1.02]';
      default:
        return 'bg-surface hover:bg-surface-elevated hover:scale-[1.02]';
    }
  };

  const isHighlighted = variant !== 'default';

  return (
    <Link href={href} className="block">
      <div className={`p-4 rounded-2xl transition-all duration-300 group cursor-pointer ${getVariantClasses()}`}>
        <div className="flex items-start gap-4">
          <div className={`
            p-3 rounded-xl transition-transform duration-300 group-hover:scale-110
            ${isHighlighted ? 'bg-white/20' : `bg-surface shadow-sm`}
          `}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isHighlighted ? 'text-white' : 'text-foreground'}`}>
                {title}
              </h3>
              <ArrowRight01Icon className={`
                w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all
                ${isHighlighted ? 'text-white/80' : 'text-foreground-muted'}
              `} />
            </div>
            <p className={`text-sm mt-1 ${isHighlighted ? 'text-white/80' : 'text-foreground-muted'}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function QuickActions() {
  const actions: ActionItemProps[] = [
    {
      title: 'Create Note',
      description: 'Start a new study note',
      icon: <Add01Icon className="w-5 h-5 text-white" />,
      href: '/library',
      variant: 'primary',
    },
    {
      title: 'Study Session',
      description: 'Review your flashcards',
      icon: <Target01Icon className="w-5 h-5 text-white" />,
      href: '/flashcards',
      variant: 'secondary',
    },
    {
      title: 'Browse Notes',
      description: 'View all your notes',
      icon: <File01Icon className="w-5 h-5 text-primary" />,
      href: '/library',
      variant: 'default',
    },
    {
      title: 'Flashcard Sets',
      description: 'Manage your flashcards',
      icon: <FlashcardIcon className="w-5 h-5 text-tertiary" />,
      href: '/flashcards',
      variant: 'default',
    },
  ];

  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <p className="text-sm text-foreground-muted">Jump into your learning</p>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <ActionItem key={index} {...action} />
        ))}
      </div>

      {/* Motivational Footer */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-muted flex items-center justify-center border-2 border-surface">
              <File01Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary-muted flex items-center justify-center border-2 border-surface">
              <Target01Icon className="w-4 h-4 text-secondary" />
            </div>
            <div className="w-8 h-8 rounded-full bg-tertiary-muted flex items-center justify-center border-2 border-surface">
              <FlashcardIcon className="w-4 h-4 text-tertiary" />
            </div>
          </div>
          <p className="text-foreground-muted">
            <span className="font-medium text-foreground">Keep learning!</span>
            {' '}Consistency is key.
          </p>
        </div>
      </div>
    </ClayCard>
  );
}
