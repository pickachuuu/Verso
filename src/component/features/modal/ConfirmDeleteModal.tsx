'use client';

import { useState } from 'react';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import Modal from '@/component/ui/Modal';
import { Delete01Icon } from 'hugeicons-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemName: string;
  itemType: 'note' | 'notebook' | 'flashcard set';
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  loading = false,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting && !loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Card className="w-full max-w-md">
        <Card.Header className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Delete01Icon className="w-6 h-6 text-red-600" />
          </div>
          <Card.Title className="text-lg font-semibold">{title}</Card.Title>
          <Card.Description className="text-foreground-muted">
            {description}
          </Card.Description>
        </Card.Header>

        <Card.Content className="space-y-4">
          <div className="p-4 bg-background-muted rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Delete01Icon className="w-4 h-4 text-foreground-muted" />
              <span className="text-sm font-medium text-foreground-muted">
                {itemType === 'note' ? 'Note' : itemType === 'notebook' ? 'Notebook' : 'Flashcard Set'}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{itemName}</p>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              This action cannot be undone. The {itemType} and all associated data will be permanently deleted.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </Card.Content>

        <Card.Footer className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting || loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || loading}
            className="flex-1"
          >
            {isDeleting || loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Delete01Icon className="w-4 h-4" />
                <span>Delete {itemType === 'note' ? 'Note' : itemType === 'notebook' ? 'Notebook' : 'Set'}</span>
              </div>
            )}
          </Button>
        </Card.Footer>
      </Card>
    </Modal>
  );
}
