import { useEffect, useRef, useState } from 'react';
import { db, type SyncOutboxItem, type SyncTable } from '@/lib/db';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { noteKeys } from './useNotes';
import { flashcardKeys } from './useFlashcards';

const supabase = createClient();

const TABLES = ['notes', 'note_pages', 'flashcard_sets', 'flashcards'] as const;

function stripLocalFields<T extends Record<string, any>>(record: T) {
    const payload = { ...record };
    delete payload.sync_status;
    delete payload.notes;
    return payload;
}

async function getPendingDeleteIds(tableName: SyncTable) {
    const pendingDeletes = await db.syncOutbox
        .where('table_name')
        .equals(tableName)
        .filter((item) => item.operation === 'delete' && item.status === 'pending')
        .toArray();

    return new Set(pendingDeletes.map((item) => item.record_id));
}

async function syncOutboxItem(item: SyncOutboxItem) {
    if (item.operation === 'delete') {
        const { error } = await supabase.from(item.table_name).delete().eq('id', item.record_id);
        if (error) throw error;
        await db.syncOutbox.delete(item.id);
        return;
    }

    const payload = stripLocalFields(item.payload || {});
    const { error } = await supabase.from(item.table_name).upsert([payload]);
    if (error) throw error;

    await db.syncOutbox.delete(item.id);
    if (item.table_name === 'notes') await db.notes.update(item.record_id, { sync_status: 'synced' });
    if (item.table_name === 'note_pages') await db.notePages.update(item.record_id, { sync_status: 'synced' });
    if (item.table_name === 'flashcard_sets') await db.flashcardSets.update(item.record_id, { sync_status: 'synced' } as any);
    if (item.table_name === 'flashcards') await db.flashcards.update(item.record_id, { sync_status: 'synced' } as any);
}

export function useSyncManager() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Safely check navigator status
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    useEffect(() => {
        if (!isOnline) return;

        const syncPendingItems = async () => {
            if (isSyncingRef.current) return;
            isSyncingRef.current = true;
            setIsSyncing(true);
            let didSync = false;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return;

                const outboxItems = await db.syncOutbox
                    .where('status')
                    .equals('pending')
                    .sortBy('created_at');

                for (const item of outboxItems) {
                    try {
                        await syncOutboxItem(item);
                        didSync = true;
                    } catch (error) {
                        await db.syncOutbox.update(item.id, {
                            retry_count: item.retry_count + 1,
                            last_error: error instanceof Error ? error.message : String(error),
                            updated_at: new Date().toISOString(),
                        });
                    }
                }

                // Sync Pending Notes
                const pendingNotes = await db.notes.where('sync_status').equals('pending').toArray();
                for (const note of pendingNotes) {
                    const hasOutbox = await db.syncOutbox.where('[table_name+record_id]').equals(['notes', note.id] as any).first();
                    if (hasOutbox) continue;
                    const payload = stripLocalFields(note);
                    const { error } = await supabase.from('notes').upsert([payload]);
                    if (!error) {
                        await db.notes.update(note.id, { sync_status: 'synced' });
                        didSync = true;
                    }
                }

                // Sync Pending Pages
                const pendingPages = await db.notePages.where('sync_status').equals('pending').toArray();
                for (const page of pendingPages) {
                    const hasOutbox = await db.syncOutbox.where('[table_name+record_id]').equals(['note_pages', page.id] as any).first();
                    if (hasOutbox) continue;
                    const payload = stripLocalFields(page);
                    const { error } = await supabase.from('note_pages').upsert([payload]);
                    if (!error) {
                        await db.notePages.update(page.id, { sync_status: 'synced' });
                        didSync = true;
                    }
                }

                // Sync Pending Flashcard Sets
                const pendingSets = await db.flashcardSets.where('sync_status').equals('pending').toArray();
                for (const set of pendingSets) {
                    const hasOutbox = await db.syncOutbox.where('[table_name+record_id]').equals(['flashcard_sets', set.id] as any).first();
                    if (hasOutbox) continue;
                    const payload = stripLocalFields(set);
                    const { error } = await supabase.from('flashcard_sets').upsert([payload]);
                    if (!error) {
                        await db.flashcardSets.update(set.id, { sync_status: 'synced' } as any);
                        didSync = true;
                    }
                }

                // Sync Pending Flashcards
                const pendingCards = await db.flashcards.where('sync_status').equals('pending').toArray();
                for (const card of pendingCards) {
                    const hasOutbox = await db.syncOutbox.where('[table_name+record_id]').equals(['flashcards', card.id] as any).first();
                    if (hasOutbox) continue;
                    const payload = stripLocalFields(card);
                    const { error } = await supabase.from('flashcards').upsert([payload]);
                    if (!error) {
                        await db.flashcards.update(card.id, { sync_status: 'synced' } as any);
                        didSync = true;
                    }
                }

                if (didSync) {
                    queryClient.invalidateQueries({ queryKey: noteKeys.all });
                    queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
                }
            } catch (error) {
                console.error('Background up-sync failed:', error);
            } finally {
                isSyncingRef.current = false;
                setIsSyncing(false);
            }
        };

        const globalDownSync = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                if (!userId) return;

                const pendingDeletesByTable = new Map<SyncTable, Set<string>>();
                await Promise.all(TABLES.map(async (table) => {
                    pendingDeletesByTable.set(table, await getPendingDeleteIds(table));
                }));

                // 1. Sync Notes
                let notesQuery = supabase.from('notes').select('*').eq('user_id', userId);
                const { data: notesData } = await notesQuery;
                
                if (notesData && notesData.length > 0) {
                    await db.transaction('rw', db.notes, async () => {
                        for (const note of notesData) {
                            if (pendingDeletesByTable.get('notes')?.has(note.id)) continue;
                            await db.notes.put({ ...note, sync_status: 'synced' });
                        }
                    });
                }

                // 2. Sync Flashcard Sets
                let setsQuery = supabase.from('flashcard_sets').select('*, notes(id, title)').eq('user_id', userId);
                const { data: setsData } = await setsQuery;

                if (setsData && setsData.length > 0) {
                    await db.transaction('rw', db.flashcardSets, async () => {
                        for (const set of setsData) {
                            if (pendingDeletesByTable.get('flashcard_sets')?.has(set.id)) continue;
                            await db.flashcardSets.put({ ...set, sync_status: 'synced' } as any);
                        }
                    });
                }

                // For dependant tables (Pages and Cards), it's highly efficient to fetch them 
                // in chunks if we have the parent IDs locally, or join. We will use all locally known IDs.
                const allNotes = await db.notes.where('user_id').equals(userId).toArray();
                const noteIds = allNotes.map(n => n.id);

                if (noteIds.length > 0) {
                    // Chunk in groups of 100 to avoid URL length limits on supabase postgres RPC
                    const chunkSize = 100;
                    for (let i = 0; i < noteIds.length; i += chunkSize) {
                        const chunk = noteIds.slice(i, i + chunkSize);
                        const { data: pagesData } = await supabase.from('note_pages').select('*').in('note_id', chunk);
                        if (pagesData && pagesData.length > 0) {
                            await db.transaction('rw', db.notePages, async () => {
                                for (const page of pagesData) {
                                    if (
                                        pendingDeletesByTable.get('note_pages')?.has(page.id) ||
                                        pendingDeletesByTable.get('notes')?.has(page.note_id)
                                    ) continue;
                                    // Avoid overwriting a locally edited page during this down-sync
                                    const existing = await db.notePages.get(page.id);
                                    if (!existing || existing.sync_status === 'synced' || existing.updated_at < page.updated_at) {
                                        await db.notePages.put({ ...page, sync_status: 'synced' });
                                    }
                                }
                            });
                        }
                    }
                }

                const allSets = await db.flashcardSets.where('user_id').equals(userId).toArray();
                const setIds = allSets.map(s => s.id);

                if (setIds.length > 0) {
                    const chunkSize = 100;
                    for (let i = 0; i < setIds.length; i += chunkSize) {
                        const chunk = setIds.slice(i, i + chunkSize);
                        const { data: cardsData } = await supabase.from('flashcards').select('*').in('set_id', chunk);
                        if (cardsData && cardsData.length > 0) {
                            await db.transaction('rw', db.flashcards, async () => {
                                for (const card of cardsData) {
                                    if (
                                        pendingDeletesByTable.get('flashcards')?.has(card.id) ||
                                        pendingDeletesByTable.get('flashcard_sets')?.has(card.set_id)
                                    ) continue;
                                    const existing = await db.flashcards.get(card.id);
                                    if (!existing || existing.sync_status === 'synced' || existing.updated_at < card.updated_at) {
                                        await db.flashcards.put({ ...card, sync_status: 'synced' } as any);
                                    }
                                }
                            });
                        }
                    }
                }

                localStorage.setItem('verso_last_global_sync', new Date().toISOString());
                await db.syncMeta.put({
                    key: 'last_global_sync',
                    value: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            } catch (error) {
                console.error('Background down-sync failed:', error);
            }
        };

        // Trigger syncs immediately when back online
        const performSyncs = async () => {
            await syncPendingItems(); // Push local changes first
            await globalDownSync();   // Then pull remote changes
        };

        performSyncs();

        // Regular check interval (every 30 seconds for up-sync, down-sync only once per window load/online event usually, 
        // but we can let it run since it's incremental)
        const intervalId = setInterval(performSyncs, 30000);
        return () => clearInterval(intervalId);

    }, [isOnline, queryClient]); // React hooks ensure this deps array handles it safely

    return { isOnline, isSyncing };
}
