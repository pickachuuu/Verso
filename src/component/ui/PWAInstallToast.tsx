'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download01Icon } from 'hugeicons-react';

export default function PWAInstallToast() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // Check if the app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show toast after a short delay to ensure user sees the page first
            setTimeout(() => setShowToast(true), 4000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
            setDeferredPrompt(null);
            setShowToast(false);
        } else {
            console.log('User dismissed the PWA install prompt');
        }
    };

    return (
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
                >
                    <div className="clay-card-elevated paper-texture p-5 sm:p-6 flex items-center gap-5 bg-surface/90 backdrop-blur-sm border border-dashed border-pencil/30 rounded-[2.5rem] shadow-[0_25px_60px_-12px_rgba(43,93,139,0.25)]">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner group">
                            <Download01Icon className="w-7 h-7 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-foreground mb-1">Get the App</h3>
                            <p className="text-xs text-foreground-muted leading-snug">Install Verso for a faster, immersive study experience.</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <button
                                onClick={handleInstall}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:translate-y-0.5 whitespace-nowrap"
                            >
                                Install Now
                            </button>
                            <button
                                onClick={() => setShowToast(false)}
                                className="text-[10px] text-foreground-muted hover:text-foreground text-center font-bold tracking-wide uppercase transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
