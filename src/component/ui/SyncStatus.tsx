'use client';

import { useSyncManager } from '@/hooks/useSyncManager';
import { CloudIcon, Loading03Icon, Tick01Icon, Cancel01Icon } from 'hugeicons-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SyncStatus() {
    const { isOnline, isSyncing } = useSyncManager();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md px-3 py-2 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 text-sm font-medium transition-colors pointer-events-none">
            <AnimatePresence mode="wait">
                {!isOnline ? (
                    <motion.div
                        key="offline"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2 text-zinc-500 relative"
                    >
                        <CloudIcon size={16} />
                        <Cancel01Icon size={10} className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 rounded-full text-red-500" />
                        <span className="ml-[6px]">Offline</span>
                    </motion.div>
                ) : isSyncing ? (
                    <motion.div
                        key="syncing"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2 text-blue-500"
                    >
                        <Loading03Icon size={16} className="animate-spin" />
                        <span>Syncing...</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="synced"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2 text-green-500 relative"
                    >
                        <CloudIcon size={16} />
                        <Tick01Icon size={10} className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 rounded-full text-green-500" />
                        <span className="ml-[6px]">Synced</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
