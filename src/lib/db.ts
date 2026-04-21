import Dexie, { type EntityTable } from 'dexie';

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface LocalNote {
    id: string;
    title: string;
    content: string;
    tags: string[];
    cover_color: string;
    slug: string | null;
    user_id: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface LocalNotePage {
    id: string;
    note_id: string;
    title: string;
    content: string;
    page_order: number;
    created_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface LocalFlashcardSet {
    id: string;
    user_id: string;
    note_id: string | null;
    title: string;
    description: string | null;
    total_cards: number;
    mastered_cards: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface LocalFlashcard {
    id: string;
    set_id: string;
    note_id: string | null;
    question: string;
    answer: string;
    status: 'new' | 'learning' | 'review' | 'mastered';
    difficulty_level: number;
    position: number;
    last_reviewed: string | null;
    next_review: string | null;
    review_count: number;
    correct_count: number;
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    lapses: number;
    created_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export class ReviseaDatabase extends Dexie {
    notes!: EntityTable<LocalNote, 'id'>;
    notePages!: EntityTable<LocalNotePage, 'id'>;
    flashcardSets!: EntityTable<LocalFlashcardSet, 'id'>;
    flashcards!: EntityTable<LocalFlashcard, 'id'>;

    constructor() {
        super('ReviseaOfflineDB');
        this.version(2).stores({
            notes: 'id, slug, user_id, updated_at, sync_status',
            notePages: 'id, note_id, page_order, updated_at, sync_status',
            flashcardSets: 'id, user_id, note_id, created_at, sync_status',
            flashcards: 'id, set_id, note_id, position, sync_status',
        });
    }
}

export const db = new ReviseaDatabase();
