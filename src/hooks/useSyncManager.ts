import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { noteKeys } from './useNotes';
import { flashcardKeys } from './useFlashcards';

const supabase = createClient();

export function useSyncManager() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
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
            if (isSyncing) return;
            setIsSyncing(true);
            let didSync = false;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return;

                // Sync Pending Notes
                const pendingNotes = await db.notes.where('sync_status').equals('pending').toArray();
                for (const note of pendingNotes) {
                    const payload: Partial<typeof note> = { ...note };
                    delete payload.sync_status;
                    const { error } = await supabase.from('notes').upsert([payload]);
                    if (!error) {
                        await db.notes.update(note.id, { sync_status: 'synced' });
                        didSync = true;
                    }
                }

                // Sync Pending Pages
                const pendingPages = await db.notePages.where('sync_status').equals('pending').toArray();
                for (const page of pendingPages) {
                    const payload: Partial<typeof page> = { ...page };
                    delete payload.sync_status;
                    const { error } = await supabase.from('note_pages').upsert([payload]);
                    if (!error) {
                        await db.notePages.update(page.id, { sync_status: 'synced' });
                        didSync = true;
                    }
                }

                // Sync Pending Flashcard Sets
                const pendingSets = await db.flashcardSets.where('sync_status').equals('pending').toArray();
                for (const set of pendingSets) {
                    const payload: Partial<typeof set> = { ...set };
                    delete payload.sync_status;
                    const { error } = await supabase.from('flashcard_sets').upsert([payload]);
                    if (!error) {
                        await db.flashcardSets.update(set.id, { sync_status: 'synced' } as any);
                        didSync = true;
                    }
                }

                // Sync Pending Flashcards
                const pendingCards = await db.flashcards.where('sync_status').equals('pending').toArray();
                for (const card of pendingCards) {
                    const payload: Partial<typeof card> = { ...card };
                    delete payload.sync_status;
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
                setIsSyncing(false);
            }
        };

        const globalDownSync = async () => {
            const lastSync = localStorage.getItem('verso_last_global_sync');
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                if (!userId) return;

                // 1. Sync Notes
                let notesQuery = supabase.from('notes').select('*').eq('user_id', userId);
                if (lastSync) notesQuery = notesQuery.gt('updated_at', lastSync);
                const { data: notesData } = await notesQuery;
                
                if (notesData && notesData.length > 0) {
                    await db.transaction('rw', db.notes, async () => {
                        for (const note of notesData) {
                            await db.notes.put({ ...note, sync_status: 'synced' });
                        }
                    });
                }

                // 2. Sync Flashcard Sets
                let setsQuery = supabase.from('flashcard_sets').select('*, notes(id, title)').eq('user_id', userId);
                if (lastSync) setsQuery = setsQuery.gt('updated_at', lastSync);
                const { data: setsData } = await setsQuery;

                if (setsData && setsData.length > 0) {
                    await db.transaction('rw', db.flashcardSets, async () => {
                        for (const set of setsData) {
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
