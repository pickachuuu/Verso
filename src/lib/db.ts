import Dexie, { type EntityTable } from 'dexie';

export type SyncStatus = 'synced' | 'pending' | 'error';
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncTable = 'notes' | 'note_pages' | 'flashcard_sets' | 'flashcards';

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

export interface SyncOutboxItem {
    id: string;
    table_name: SyncTable;
    record_id: string;
    operation: SyncOperation;
    payload: Record<string, unknown> | null;
    status: SyncStatus;
    retry_count: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

export interface SyncMeta {
    key: string;
    value: string;
    updated_at: string;
}

export class ReviseaDatabase extends Dexie {
    notes!: EntityTable<LocalNote, 'id'>;
    notePages!: EntityTable<LocalNotePage, 'id'>;
    flashcardSets!: EntityTable<LocalFlashcardSet, 'id'>;
    flashcards!: EntityTable<LocalFlashcard, 'id'>;
    syncOutbox!: EntityTable<SyncOutboxItem, 'id'>;
    syncMeta!: EntityTable<SyncMeta, 'key'>;

    constructor() {
        super('ReviseaOfflineDB');
        this.version(2).stores({
            notes: 'id, slug, user_id, updated_at, sync_status',
            notePages: 'id, note_id, page_order, updated_at, sync_status',
            flashcardSets: 'id, user_id, note_id, created_at, sync_status',
            flashcards: 'id, set_id, note_id, position, sync_status',
        });
        this.version(3).stores({
            notes: 'id, slug, user_id, updated_at, sync_status',
            notePages: 'id, note_id, page_order, updated_at, sync_status',
            flashcardSets: 'id, user_id, note_id, created_at, updated_at, sync_status',
            flashcards: 'id, set_id, note_id, position, updated_at, sync_status',
            syncOutbox: 'id, [table_name+record_id], table_name, record_id, operation, status, created_at, updated_at',
            syncMeta: 'key',
        });
    }
}

export const db = new ReviseaDatabase();

export async function queueSyncOperation(
    tableName: SyncTable,
    recordId: string,
    operation: SyncOperation,
    payload?: Record<string, unknown> | null
) {
    const now = new Date().toISOString();
    const existing = await db.syncOutbox
        .where('[table_name+record_id]')
        .equals([tableName, recordId] as any)
        .first()
        .catch(() => null);

    if (existing) {
        await db.syncOutbox.update(existing.id, {
            operation,
            payload: operation === 'delete' ? null : payload || null,
            status: 'pending',
            updated_at: now,
        });
        return existing.id;
    }

    const id = crypto.randomUUID();
    await db.syncOutbox.put({
        id,
        table_name: tableName,
        record_id: recordId,
        operation,
        payload: operation === 'delete' ? null : payload || null,
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: now,
        updated_at: now,
    });
    return id;
}
