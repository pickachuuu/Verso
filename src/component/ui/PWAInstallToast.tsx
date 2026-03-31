'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download01Icon } from 'hugeicons-react';
import { useUIStore } from '@/stores';

export default function PWAInstallToast() {
    const { deferredPrompt, setDeferredPrompt, isPWAInstalled } = useUIStore();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // If already installed, don't show the toast
        if (isPWAInstalled) return;

        // If the prompt has been captured by the LandingPage, show the toast
        if (deferredPrompt) {
            const timer = setTimeout(() => setShowToast(true), 4000);
            return () => clearTimeout(timer);
        }
    }, [deferredPrompt, isPWAInstalled]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowToast(false);
        }
    };

    return (
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-sm"
                >
                    <div className="clay-card-elevated paper-texture p-4 sm:p-5 bg-surface/90 backdrop-blur-sm border border-dashed border-pencil/30 rounded-2xl sm:rounded-[2rem] shadow-[0_25px_60px_-12px_rgba(43,93,139,0.25)]">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                                <Download01Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-foreground mb-0.5">Get the App</h3>
                                <p className="text-[11px] sm:text-xs text-foreground-muted leading-snug">Install Verso for a faster, immersive study experience.</p>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                                <button
                                    onClick={handleInstall}
                                    className="px-3.5 sm:px-4 py-2 bg-primary text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:translate-y-0.5 whitespace-nowrap"
                                >
                                    Install
                                </button>
                                <button
                                    onClick={() => setShowToast(false)}
                                    className="text-[9px] sm:text-[10px] text-foreground-muted hover:text-foreground text-center font-bold tracking-wide uppercase transition-colors"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
