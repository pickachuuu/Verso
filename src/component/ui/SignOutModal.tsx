'use client';

import { useState } from 'react';
import { Logout01Icon } from 'hugeicons-react';
import { signOut } from '@/hook/useAuthActions';
import Modal from '@/component/ui/Modal';
import Card from '@/component/ui/Card';
import Button from '@/component/ui/Button';

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
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-background-muted rounded-full flex items-center justify-center border border-border">
            <Logout01Icon className="w-6 h-6 text-foreground-muted" />
          </div>
          <Card.Title className="text-lg font-semibold">Sign out</Card.Title>
          <Card.Description className="text-foreground-muted">
            Are you sure you want to sign out?
          </Card.Description>
        </Card.Header>

        <Card.Footer className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSigningOut}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSigningOut}
            className="flex-1 min-w-[100px]"
          >
            {isSigningOut ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign out'
            )}
          </Button>
        </Card.Footer>
      </Card>
    </Modal>
  );
}
