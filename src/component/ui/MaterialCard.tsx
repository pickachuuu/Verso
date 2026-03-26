import Link from 'next/link';
import { ClayBadge } from '@/component/ui/Clay';
import { ExamIcon, FlashcardIcon, NotebookIcon } from '@/component/icons';
import { Time01Icon, MoreHorizontalIcon } from 'hugeicons-react';

const TYPE_META = {
    note: {
        label: 'NOTE',
        badge: 'primary',
        icon: NotebookIcon,
        bgClasses: 'bg-primary text-surface',
        progressClasses: 'bg-primary'
    },
    flashcard: {
        label: 'FLASHCARDS',
        badge: 'success',
        icon: FlashcardIcon,
        bgClasses: 'bg-success text-surface',
        progressClasses: 'bg-success'
    },
    exam: {
        label: 'EXAM',
        badge: 'warning',
        icon: ExamIcon,
        bgClasses: 'bg-warning text-[hsl(var(--surface))]',
        progressClasses: 'bg-warning'
    }
} as const;

export interface MaterialItemData {
    id: string;
    type: 'note' | 'flashcard' | 'exam';
    title: string;
    summary: string;
    tags: string[];
    author: string;
    authorAvatarUrl?: string;
    updatedAt: string;
    href: string;
    savedAtLabel?: string;
}

export interface MaterialCardProps {
    item: MaterialItemData;
    actionSlot?: React.ReactNode;
    wrapInLink?: boolean;
}

export function MaterialCard({ item, actionSlot, wrapInLink = false }: MaterialCardProps) {
    const meta = TYPE_META[item.type];
    const Icon = meta.icon;

    const authorInitials = item.author
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U';

    const CardInnerDetails = () => (
        <div className="flex items-start gap-4 sm:gap-5 w-full">
            {/* Left Icon Block */}
            <div className={`shrink-0 w-[4.5rem] h-[4.5rem] sm:w-[5.5rem] sm:h-[5.5rem] rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shadow-sm ${meta.bgClasses}`}>
                {/* Dotted Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:6px_6px] sm:[background-size:8px_8px]" />
                
                {/* Icon Wrapper (looks like a nested rounded box in the screenshot) */}
                <div className="relative z-10 flex items-center justify-center p-2 rounded-lg border-2 border-white/40 bg-white/10 backdrop-blur-sm">
                   <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" />
                </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-widest text-foreground truncate leading-tight mt-0.5">
                        {item.title}
                    </h3>
                    <div className="shrink-0 relative z-20 pointer-events-auto" onClick={(e) => { if (!wrapInLink) e.stopPropagation(); }}>
                        {actionSlot || (
                            <button className="w-8 h-8 rounded-full bg-surface shrink-0 flex items-center justify-center text-foreground/40 shadow-sm border border-border/40 hover:text-foreground transition-colors">
                                <MoreHorizontalIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Subtitle / Author Block */}
                <div className="flex items-center gap-2.5 mt-1 sm:mt-1 overflow-hidden">
                    <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden border border-border/40 bg-background-muted flex items-center justify-center text-[10px] sm:text-[11px] font-black text-foreground shrink-0 shadow-sm">
                        {item.authorAvatarUrl ? (
                            <img
                                src={item.authorAvatarUrl}
                                alt={`${item.author} avatar`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <span>{authorInitials}</span>
                        )}
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 truncate">
                        BY {item.author.toUpperCase()}
                    </p>
                </div>

                {/* Info Pills (Date, Items count etc) */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 sm:mt-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
                        <Time01Icon className="w-3.5 h-3.5" />
                        <span>{item.updatedAt}</span>
                    </div>
                    {item.savedAtLabel && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
                            <span>SAVED {item.savedAtLabel}</span>
                        </div>
                    )}
                </div>

                {/* Status/Tag Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-[0.5rem] sm:rounded-full bg-border/40 text-foreground/80 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                        {meta.label}
                    </span>
                    {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-[0.5rem] sm:rounded-full bg-foreground text-surface text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {tag}
                        </span>
                    ))}
                    {item.tags.length > 2 && (
                        <span className="px-2 py-1 rounded-[0.5rem] sm:rounded-full bg-background-muted text-foreground/50 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                            +{item.tags.length - 2}
                        </span>
                    )}
                </div>
                
                {/* Pseudo Progress Bar / Divider */}
                <div className="flex items-center gap-3 mt-3.5 sm:mt-4 opacity-40">
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-border/40">
                        {/* Static visual bar for consistent styling with flashcards */}
                        <div className={`h-full rounded-full w-[30%] ${meta.progressClasses}`} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-foreground/60 shrink-0">
                        --
                    </span>
                </div>
            </div>
        </div>
    );

    const containerClasses = "group block w-full bg-background-muted rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 transition-all shadow-sm border border-transparent hover:border-border/40 hover:shadow-md hover:-translate-y-0.5 relative";

    if (wrapInLink) {
        return (
            <Link href={item.href} className={containerClasses}>
                <CardInnerDetails />
            </Link>
        );
    }

    return (
        <div className={containerClasses}>
            <div className="absolute inset-0 z-0" onClick={() => window.location.href = item.href} />
            <div className="relative z-10 pointer-events-none">
                <CardInnerDetails />
            </div>
        </div>
    );
}
