import React from 'react';
import {
  Share01Icon,
  GlobeIcon,
  LockIcon,
  Delete01Icon,
  MoreVerticalIcon,
} from 'hugeicons-react';

export function DropdownMenuContainer({
  isOpen,
  onToggle,
  onClose,
  children,
}: {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClose: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
      <button
        onClick={onToggle}
        className={`p-2.5 rounded-full transition-all shadow-sm ${isOpen ? 'bg-foreground text-surface' : 'bg-surface/80 backdrop-blur-md text-foreground hover:bg-foreground hover:text-surface'}`}
      >
        <MoreVerticalIcon className="w-5 h-5" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute bottom-full right-0 mb-3 w-[13rem] lg:w-[14rem] bg-surface rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-2.5 flex flex-col gap-2 border-[3px] border-foreground z-50 origin-bottom-right animate-in zoom-in-95 duration-100">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  icon: Icon,
  label,
  onClick,
  variant = 'neutral',
}: {
  icon: React.ElementType;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'neutral' | 'success';
}) {
  let btnClasses = '';
  switch (variant) {
    case 'primary':
      btnClasses = 'bg-foreground text-surface hover:scale-[0.98] shadow-sm';
      break;
    case 'success':
      btnClasses = 'bg-[#00c569] text-white border-transparent';
      break;
    case 'neutral':
    default:
      btnClasses = 'bg-background-muted text-foreground border-transparent hover:border-foreground/20 hover:scale-[0.98]';
      break;
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all w-full text-left border-2 ${btnClasses}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

export function ShareMenuItem({ isCopied, onClick }: { isCopied: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <DropdownMenuItem
      icon={Share01Icon}
      label={isCopied ? 'COPIED!' : 'SHARE LINK'}
      onClick={onClick}
      variant={isCopied ? 'success' : 'neutral'}
    />
  );
}

export function VisibilityMenuItem({ isPublic, onClick }: { isPublic: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <DropdownMenuItem
      icon={isPublic ? GlobeIcon : LockIcon}
      label={isPublic ? 'MAKE PRIVATE' : 'MAKE PUBLIC'}
      onClick={onClick}
      variant="neutral"
    />
  );
}

export function DeleteMenuItem({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return <DropdownMenuItem icon={Delete01Icon} label="DELETE" onClick={onClick} />;
}
