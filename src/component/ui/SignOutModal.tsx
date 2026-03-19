'use client';

import { useState } from 'react';
import { Logout01Icon, Cancel01Icon } from 'hugeicons-react';
import { signOut } from '@/hook/useAuthActions';
import Modal from '@/component/ui/Modal';
import { ClayCard } from '@/component/ui/Clay';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignOutModal({ isOpen, onClose }: SignOutModalProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleClose = () => {
    if (!isSigningOut) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md">
        <ClayCard variant="elevated" padding="none" className="rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-8 text-center bg-background-muted/5">
            <div className="mx-auto mb-6 w-16 h-16 bg-surface border-2 border-border/60 rounded-full flex items-center justify-center shadow-sm">
              <Logout01Icon className="w-7 h-7 text-foreground/80" />
            </div>
            
            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">Sign out</h3>
            <p className="text-sm text-foreground-muted font-medium">
              Are you sure you want to sign out?
            </p>
          </div>

          <div className="p-6 bg-surface border-t border-border/40 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              disabled={isSigningOut}
              className="flex-1 px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              <Cancel01Icon className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSigningOut}
              className="flex-1 px-4 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase bg-foreground text-surface hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSigningOut ? (
                <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Logout01Icon className="w-4 h-4" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        </ClayCard>
      </div>
    </Modal>
  );
}
