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
                console.error('Background sync failed:', error);
            } finally {
                setIsSyncing(false);
            }
        };

        // Trigger sync immediately when back online
        syncPendingItems();

        // Regular check interval (every 30 seconds)
        const intervalId = setInterval(syncPendingItems, 30000);
        return () => clearInterval(intervalId);

    }, [isOnline, queryClient]); // React hooks ensure this deps array handles it safely

    return { isOnline, isSyncing };
}
