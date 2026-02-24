import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { noteKeys } from './useNotes';

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

                if (didSync) {
                    queryClient.invalidateQueries({ queryKey: noteKeys.all });
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
