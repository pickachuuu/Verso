'use client';

import { ClayCard, ClayButton } from '@/component/ui/Clay';
import { BookOpen01Icon, File01Icon, Target01Icon, Add01Icon, ArrowRight01Icon } from 'hugeicons-react';
import Link from 'next/link';

interface ActionItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
}

function ActionItem({ title, description, icon, href, variant = 'secondary' }: ActionItemProps) {
  return (
    <Link href={href} className="block">
      <div className={`
        p-4 rounded-2xl transition-all duration-300 group cursor-pointer
        ${variant === 'primary'
          ? 'bg-gradient-to-br from-accent to-accent/80 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
          : 'bg-background-muted/50 hover:bg-background-muted hover:scale-[1.02]'
        }
      `}>
        <div className="flex items-start gap-4">
          <div className={`
            p-3 rounded-xl transition-transform duration-300 group-hover:scale-110
            ${variant === 'primary' ? 'bg-white/20' : 'bg-surface shadow-sm'}
          `}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${variant === 'primary' ? 'text-white' : 'text-foreground'}`}>
                {title}
              </h3>
              <ArrowRight01Icon className={`
                w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all
                ${variant === 'primary' ? 'text-white/80' : 'text-foreground-muted'}
              `} />
            </div>
            <p className={`text-sm mt-1 ${variant === 'primary' ? 'text-white/80' : 'text-foreground-muted'}`}>
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
      href: '/notes',
      variant: 'primary',
    },
    {
      title: 'Study Session',
      description: 'Review your flashcards',
      icon: <Target01Icon className="w-5 h-5 text-accent" />,
      href: '/flashcards',
      variant: 'secondary',
    },
    {
      title: 'Browse Notes',
      description: 'View all your notes',
      icon: <File01Icon className="w-5 h-5 text-accent" />,
      href: '/notes',
      variant: 'secondary',
    },
    {
      title: 'Flashcard Sets',
      description: 'Manage your flashcards',
      icon: <BookOpen01Icon className="w-5 h-5 text-accent" />,
      href: '/flashcards',
      variant: 'secondary',
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
            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center border-2 border-surface">
              <span className="text-xs">📚</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center border-2 border-surface">
              <span className="text-xs">✨</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center border-2 border-surface">
              <span className="text-xs">🎯</span>
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
