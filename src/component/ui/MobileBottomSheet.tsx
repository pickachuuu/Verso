'use client';

import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cancel01Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'motion/react';

type MobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: MobileBottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            
            {/* Background Overlay */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 z-[9999]"
              />
            </Dialog.Overlay>
            
            {/* Bottom Sheet Content */}
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed left-0 right-0 bottom-0 max-h-[90dvh] flex flex-col bg-surface border-t-[4px] border-foreground rounded-t-[2rem] sm:rounded-t-[2.5rem] overflow-hidden shadow-[0_-8px_0_rgba(0,0,0,1)] z-[10000] focus:outline-none"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b-[3px] border-foreground/10 bg-surface shrink-0">
                  <div className="flex flex-col">
                    <Dialog.Title className="text-lg font-black uppercase tracking-tighter text-foreground m-0 leading-tight">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 mt-0.5 m-0">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="p-2.5 rounded-[1rem] bg-background-muted border border-border/40 text-foreground hover:bg-foreground hover:text-surface transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
                      aria-label="Close panel"
                    >
                      <Cancel01Icon className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="p-4 pb-6 overflow-y-auto min-h-0 flex-1">
                  {children}
                </div>

                {footer && (
                  <div className="shrink-0 pb-6 pt-3 px-4 bg-surface border-t-[2px] border-foreground/5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
