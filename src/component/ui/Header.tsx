'use client';

import { cn } from "@/lib/utils";
import { ClayCard } from "@/component/ui/Clay";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export default function Header({ title, description, children, className, icon }: HeaderProps) {
  return (
    <ClayCard variant="default" padding="lg" className={cn("rounded-2xl", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="p-3 rounded-xl bg-primary-muted shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-base text-foreground-muted mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </ClayCard>
  );
}

Header.Subtitle = function Subtitle({children, className}: {children?: React.ReactNode, className?: string}){
    return (
        <div className={cn("text-foreground-muted", className)}>
            {children}
        </div>
    )
}
