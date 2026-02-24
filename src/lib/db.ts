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

export class ReviseaDatabase extends Dexie {
    notes!: EntityTable<LocalNote, 'id'>;
    notePages!: EntityTable<LocalNotePage, 'id'>;

    constructor() {
        super('ReviseaOfflineDB');
        this.version(1).stores({
            notes: 'id, slug, user_id, updated_at, sync_status',
            notePages: 'id, note_id, page_order, updated_at, sync_status',
        });
    }
}

export const db = new ReviseaDatabase();
