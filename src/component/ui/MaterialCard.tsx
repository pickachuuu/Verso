import Link from 'next/link';
import { ClayBadge } from '@/component/ui/Clay';
import { ExamIcon, FlashcardIcon, NotebookIcon } from '@/component/icons';

const TYPE_META = {
    note: {
        label: 'Note',
        badge: 'accent',
        icon: NotebookIcon,
        tint: 'text-primary'
    },
    flashcard: {
        label: 'Flashcards',
        badge: 'success',
        icon: FlashcardIcon,
        tint: 'text-tertiary'
    },
    exam: {
        label: 'Exam',
        badge: 'warning',
        icon: ExamIcon,
        tint: 'text-secondary'
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
        <>
            <div className="flex items-start gap-3 flex-1">
                <div className="p-2.5 rounded-xl bg-background-muted border border-border">
                    <Icon className={`w-5 h-5 ${meta.tint}`} />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        <ClayBadge variant={meta.badge as any} className="px-2.5 py-1 text-[11px]">
                            {meta.label}
                        </ClayBadge>
                    </div>
                    <p className="text-sm text-foreground-muted mt-1">{item.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-foreground-muted">
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full overflow-hidden border border-border bg-background-muted flex items-center justify-center text-[10px] font-semibold text-foreground">
                                {item.authorAvatarUrl ? (
                                    <img
                                        src={item.authorAvatarUrl}
                                        alt={item.author ? `${item.author} avatar` : 'User avatar'}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <span>{authorInitials}</span>
                                )}
                            </span>
                            <span>By {item.author}</span>
                        </div>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>Updated {item.updatedAt}</span>
                        {item.savedAtLabel && (
                            <>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span>Saved {item.savedAtLabel}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {item.tags.map((tag) => (
                    <span
                        key={`${item.id}-${tag}`}
                        className="px-2.5 py-1 rounded-full bg-background-muted border border-border text-[11px] text-foreground-muted"
                    >
                        #{tag}
                    </span>
                ))}
                {actionSlot}
            </div>
        </>
    );

    const containerClasses = "rounded-2xl border border-border bg-surface hover:shadow-sm transition-all";

    // If wrapInLink is true, we assume the whole card is clickable and shouldn't have nested interactive actionSlots
    if (wrapInLink) {
        return (
            <Link href={item.href} className={`block ${containerClasses}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4">
                    <CardInnerDetails />
                </div>
            </Link>
        );
    }

    // Otherwise, if we have action buttons inside (like "Unsave"), we can't wrap the whole thing in a Link
    // without messing up click events. So we only wrap the left part (icon and text) in a Link.
    return (
        <div className={containerClasses}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4">
                <Link href={item.href} className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 rounded-xl bg-background-muted border border-border">
                        <Icon className={`w-5 h-5 ${meta.tint}`} />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                            <ClayBadge variant={meta.badge as any} className="px-2.5 py-1 text-[11px]">
                                {meta.label}
                            </ClayBadge>
                        </div>
                        <p className="text-sm text-foreground-muted mt-1">{item.summary}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-foreground-muted">
                            <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full overflow-hidden border border-border bg-background-muted flex items-center justify-center text-[10px] font-semibold text-foreground">
                                    {item.authorAvatarUrl ? (
                                        <img
                                            src={item.authorAvatarUrl}
                                            alt={item.author ? `${item.author} avatar` : 'User avatar'}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span>{authorInitials}</span>
                                    )}
                                </span>
                                <span>By {item.author}</span>
                            </div>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>Updated {item.updatedAt}</span>
                            {item.savedAtLabel && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span>Saved {item.savedAtLabel}</span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    {item.tags.map((tag) => (
                        <span
                            key={`${item.id}-${tag}`}
                            className="px-2.5 py-1 rounded-full bg-background-muted border border-border text-[11px] text-foreground-muted"
                        >
                            #{tag}
                        </span>
                    ))}
                    {actionSlot}
                </div>
            </div>
        </div>
    );
}
